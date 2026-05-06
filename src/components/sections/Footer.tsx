import FooterAccountStrip from "@/components/account/FooterAccountStrip";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/[0.08] px-6 md:px-20 py-14">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
        {/* brand */}
        <div className="md:col-span-5">
          <div className="headline-serif text-[28px] tracking-tight">Orbis</div>
          <p className="font-kr text-white/55 text-[13px] leading-[1.85] mt-3 max-w-sm">
            NASA 천체 데이터와 깊이 있는 통찰로,
            <br />
            인간관계의 비밀을 해독하는 정밀 점성술.
          </p>
        </div>

        {/* nav */}
        <div className="md:col-span-4 grid grid-cols-2 gap-6">
          <div>
            <div className="label-mono mb-4">PRODUCT</div>
            <ul className="space-y-2 font-kr text-[13px] text-white/65">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  나 자신 리포트
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  관계 리포트
                </a>
              </li>
            </ul>
          </div>
          <div>
            <div className="label-mono mb-4">COMPANY</div>
            <ul className="space-y-2 font-kr text-[13px] text-white/65">
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  이용약관
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  개인정보처리방침
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition-colors">
                  문의
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* account / login */}
        <FooterAccountStrip />
      </div>

      {/* business info — fine print */}
      <div className="max-w-7xl mx-auto mt-14 pt-6 border-t border-white/[0.06]">
        <div className="font-kr text-white/35 text-[11px] leading-[1.9] flex flex-wrap gap-x-4 gap-y-1">
          <span>상호: 원더크리에이티브</span>
          <span>대표: 이원준</span>
          <span>사업자등록번호: 678-37-00662</span>
          <span>통신판매업 신고번호: 2019-서울용산-1033</span>
          <a
            href="mailto:support@wondercreative.kr"
            className="hover:text-white transition-colors"
          >
            문의: support@wondercreative.kr
          </a>
        </div>
        <div className="mt-4 flex items-center justify-between label-mono opacity-50">
          <span>© 2026 ORBIS</span>
          <span>SEOUL</span>
        </div>
      </div>
    </footer>
  );
}
