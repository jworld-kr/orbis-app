/**
 * Orbit packages — single source of truth.
 * 1 orbit = 1 full report (12 chapters).
 *
 * Original price is what we display struck-through; price is what the
 * user actually pays. Both are in KRW (whole won, no decimals).
 */

export type OrbitPackage = {
  id: "single" | "double" | "triple_plus_one";
  count: number;          // orbits granted on purchase
  originalKrw: number;    // shown struck-through
  priceKrw: number;       // actually charged
  label?: string;         // optional badge ("3+1")
  title: string;          // human label
};

export const ORBIT_PACKAGES: OrbitPackage[] = [
  {
    id: "single",
    count: 1,
    originalKrw: 25_900,
    priceKrw: 5_900,
    title: "1 오빗",
  },
  {
    id: "double",
    count: 2,
    originalKrw: 51_800,
    priceKrw: 11_800,
    title: "2 오빗",
  },
  {
    id: "triple_plus_one",
    count: 4,
    originalKrw: 77_700,
    priceKrw: 17_700,
    label: "3+1",
    title: "3+1 오빗",
  },
];

export function findPackage(id: string): OrbitPackage | undefined {
  return ORBIT_PACKAGES.find((p) => p.id === id);
}

/** Format KRW with thousands separator and "원" suffix. */
export function formatKrw(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}
