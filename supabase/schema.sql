-- =============================================================================
-- Orbis — initial schema (Phase 1)
--
-- 실행 방법
--   Supabase Dashboard → SQL Editor → New query → 이 파일 내용 전체 붙여넣기 → Run
--   처음 한 번만 실행. 이미 실행된 상태에서 다시 돌리면 "already exists" 에러 가능.
--
-- 무엇이 만들어지나
--   1. users               — Auth 가입 시 자동 row 생성 + token 잔액 보관
--   2. charts              — 사용자가 입력한 차트 (생일·장소·계산 결과 JSON)
--   3. reports             — 보고서 (preview / full 두 단계 + 12챕터 JSON)
--   4. token_transactions  — 토큰 충전·차감·환불 내역
--
-- RLS 정책
--   - 본인 row 만 SELECT 가능
--   - 변경(INSERT/UPDATE/DELETE)은 서비스 롤(서버 라우트)이 service_role 키로 수행
--   - 익명 사용자(anon)는 차트·보고서를 직접 못 만든다 → 항상 /api 거쳐야 함
--
-- 토큰 흐름
--   - 가입 시 users.token_balance = 0 (무료 미리보기는 차트당 1회로 별도 처리)
--   - 결제 webhook이 service_role로 token_balance 증가 + transactions 기록
--   - 풀 보고서 생성 시 consume_orbit() 함수로 한 트랜잭션에 -1 + transactions 기록
-- =============================================================================

-- ─── extensions ──────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =============================================================================
-- 1. users
-- =============================================================================
create table if not exists public.users (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  display_name    text,
  token_balance   int  not null default 0,
  free_preview_used_count int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists users_created_at_idx on public.users(created_at desc);

-- Auth 가입 시 public.users row 자동 생성
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', null)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- updated_at 자동 갱신용 공통 트리거 함수
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_touch_updated_at on public.users;
create trigger users_touch_updated_at
  before update on public.users
  for each row execute function public.touch_updated_at();

-- =============================================================================
-- 2. charts
-- =============================================================================
create table if not exists public.charts (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  name            text not null,
  birth_date      date not null,
  birth_time      time not null,
  birth_place     text not null,
  latitude        double precision not null,
  longitude       double precision not null,
  timezone        text not null,
  -- 동일 차트 재계산을 막는 해시 (date+time+lat+lon+tz 조합)
  fingerprint     text not null,
  -- /api/chart 결과 JSON (planets, houses, ascmc, …) 그대로 보관
  chart_json      jsonb not null,
  created_at      timestamptz not null default now()
);

create index if not exists charts_user_id_idx on public.charts(user_id);
-- 같은 사용자가 같은 차트를 여러 번 못 만들도록
create unique index if not exists charts_user_fingerprint_uniq
  on public.charts(user_id, fingerprint);

-- =============================================================================
-- 3. reports
-- =============================================================================
-- status:
--   'preview_pending' → Ch I 생성 대기/진행
--   'preview_ready'   → Ch I 까지 노출 가능, 결제 전
--   'full_pending'    → 결제 후 Ch II~XII 생성 중
--   'full_ready'      → 12챕터 모두 완성
--   'failed'          → 생성 실패 (재시도 가능)
create table if not exists public.reports (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references public.users(id) on delete cascade,
  chart_id        uuid not null references public.charts(id) on delete cascade,
  status          text not null default 'preview_pending'
                  check (status in ('preview_pending','preview_ready','full_pending','full_ready','failed')),
  -- chapters: [{ no:1, content:{...} }, ..., { no:12, content:{...} }]
  chapters        jsonb not null default '[]'::jsonb,
  model           text,
  preview_ready_at timestamptz,
  full_ready_at   timestamptz,
  paid_token_tx_id uuid,        -- 풀 잠금해제에 사용한 token_transactions.id (null = 무료 미리보기 단계)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists reports_user_id_idx on public.reports(user_id);
create index if not exists reports_chart_id_idx on public.reports(chart_id);
-- 한 차트당 보고서 1개 (재생성은 같은 row를 update)
create unique index if not exists reports_chart_uniq on public.reports(chart_id);

drop trigger if exists reports_touch_updated_at on public.reports;
create trigger reports_touch_updated_at
  before update on public.reports
  for each row execute function public.touch_updated_at();

-- =============================================================================
-- 4. token_transactions
-- =============================================================================
-- 모든 토큰 잔액 변동의 감사 로그.
-- delta > 0  → 충전 / 환불 / 보너스
-- delta < 0  → 보고서 생성에 사용
-- reason 예: 'purchase' | 'report_generate' | 'refund' | 'admin_adjust'
create table if not exists public.token_transactions (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.users(id) on delete cascade,
  delta             int  not null check (delta <> 0),
  reason            text not null,
  report_id         uuid references public.reports(id) on delete set null,
  -- Toss 결제 키 (충전 시)
  toss_payment_key  text,
  toss_order_id     text,
  -- 패키지 정보 스냅샷 (충전 시) — 가격 변경되어도 거래 시점 가격 유지
  package_snapshot  jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists token_tx_user_id_idx on public.token_transactions(user_id, created_at desc);
create index if not exists token_tx_report_id_idx on public.token_transactions(report_id);

-- =============================================================================
-- 함수: consume_orbit(p_user_id, p_report_id)
-- 한 트랜잭션 안에서:
--   1. users.token_balance 가 1 이상인지 검사
--   2. -1 차감
--   3. token_transactions 에 reason='report_generate' 기록
--   4. reports.paid_token_tx_id 갱신
-- 잔액 부족 시 exception → 호출자가 결제 페이지로 보냄
-- =============================================================================
create or replace function public.consume_orbit(p_user_id uuid, p_report_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance int;
  v_tx_id   uuid;
begin
  -- 행 잠금
  select token_balance into v_balance
    from public.users
    where id = p_user_id
    for update;

  if v_balance is null then
    raise exception 'user not found: %', p_user_id;
  end if;

  if v_balance < 1 then
    raise exception 'insufficient_orbits' using errcode = 'P0001';
  end if;

  update public.users
    set token_balance = token_balance - 1
    where id = p_user_id;

  insert into public.token_transactions (user_id, delta, reason, report_id)
    values (p_user_id, -1, 'report_generate', p_report_id)
    returning id into v_tx_id;

  update public.reports
    set paid_token_tx_id = v_tx_id
    where id = p_report_id;

  return v_tx_id;
end;
$$;

revoke all on function public.consume_orbit(uuid, uuid) from public;
grant execute on function public.consume_orbit(uuid, uuid) to service_role;

-- =============================================================================
-- 함수: grant_orbits(p_user_id, p_count, p_reason, p_toss_key, p_toss_order, p_package)
-- Toss webhook 등에서 토큰 충전 시 사용. 한 트랜잭션 안에서 잔액 증가 + 거래 기록.
-- =============================================================================
create or replace function public.grant_orbits(
  p_user_id uuid,
  p_count int,
  p_reason text,
  p_toss_key text default null,
  p_toss_order text default null,
  p_package jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tx_id uuid;
begin
  if p_count <= 0 then
    raise exception 'p_count must be positive';
  end if;

  update public.users
    set token_balance = token_balance + p_count
    where id = p_user_id;

  insert into public.token_transactions
    (user_id, delta, reason, toss_payment_key, toss_order_id, package_snapshot)
    values
    (p_user_id, p_count, p_reason, p_toss_key, p_toss_order, p_package)
    returning id into v_tx_id;

  return v_tx_id;
end;
$$;

revoke all on function public.grant_orbits(uuid, int, text, text, text, jsonb) from public;
grant execute on function public.grant_orbits(uuid, int, text, text, text, jsonb) to service_role;

-- =============================================================================
-- RLS — Row Level Security
-- =============================================================================
alter table public.users               enable row level security;
alter table public.charts              enable row level security;
alter table public.reports             enable row level security;
alter table public.token_transactions  enable row level security;

-- ── users ──────────────────────────────────────────────────────────────────
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ── charts ─────────────────────────────────────────────────────────────────
drop policy if exists "charts_select_own" on public.charts;
create policy "charts_select_own"
  on public.charts for select
  using (auth.uid() = user_id);

-- INSERT/UPDATE/DELETE 는 서비스 롤만 (정책 X = 차단)
-- service_role 은 RLS 를 무시하므로 별도 정책 필요 없음

-- ── reports ────────────────────────────────────────────────────────────────
-- 본인 보고서 SELECT 허용. 단 Ch I(=preview)만 보이는지 / 풀이 보이는지는
-- 애플리케이션 코드에서 status 로 분기. (DB 단에서 컬럼 단위 차단은 안 함.)
drop policy if exists "reports_select_own" on public.reports;
create policy "reports_select_own"
  on public.reports for select
  using (auth.uid() = user_id);

-- ── token_transactions ────────────────────────────────────────────────────
drop policy if exists "token_tx_select_own" on public.token_transactions;
create policy "token_tx_select_own"
  on public.token_transactions for select
  using (auth.uid() = user_id);

-- =============================================================================
-- 끝
-- 다음 단계: lib/supabase/{client,server}.ts 작성 + Auth 붙이기
-- =============================================================================
