"use client";

type Props = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Realistic iPhone 15 Pro frame, dark mode. Pure CSS/SVG, no images.
 * Children render inside the screen area (390 x 844 viewport ratio).
 */
export default function IPhoneMockup({ children, className }: Props) {
  return (
    <div
      className={`relative mx-auto ${className ?? ""}`}
      style={{
        width: "min(320px, 80vw)",
        aspectRatio: "390 / 844",
      }}
    >
      {/* outer frame — titanium edge */}
      <div
        className="absolute inset-0 rounded-[44px] p-[3px]"
        style={{
          background:
            "linear-gradient(155deg, #2a2e38 0%, #0e1116 35%, #1c2028 65%, #0a0d12 100%)",
          boxShadow:
            "0 50px 100px -20px rgba(0,0,0,0.7), 0 30px 60px -30px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(245,247,250,0.06)",
        }}
      >
        {/* inner bezel */}
        <div
          className="w-full h-full rounded-[42px] p-[8px]"
          style={{
            background: "#000",
          }}
        >
          {/* screen */}
          <div className="relative w-full h-full rounded-[34px] overflow-hidden bg-[#06080F]">
            {/* dynamic island */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 w-[100px] h-[28px] bg-black rounded-full" />

            {/* status bar */}
            <div className="absolute top-0 left-0 right-0 h-12 z-20 px-7 flex items-center justify-between text-[11px] font-mono text-white/85 pointer-events-none">
              <span className="font-semibold tracking-tight">9:41</span>
              <span className="flex items-center gap-1">
                {/* signal */}
                <SignalIcon />
                <WifiIcon />
                <BatteryIcon />
              </span>
            </div>

            {/* content */}
            <div className="absolute inset-0 pt-12">{children}</div>

            {/* home indicator */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-[110px] h-[4px] rounded-full bg-white/85 z-20" />
          </div>
        </div>
      </div>

      {/* side buttons — left mute + volume */}
      <div
        className="absolute -left-[3px] top-[120px] w-[3px] h-[28px] rounded-l-sm"
        style={{ background: "#1a1d24" }}
      />
      <div
        className="absolute -left-[3px] top-[170px] w-[3px] h-[56px] rounded-l-sm"
        style={{ background: "#1a1d24" }}
      />
      <div
        className="absolute -left-[3px] top-[238px] w-[3px] h-[56px] rounded-l-sm"
        style={{ background: "#1a1d24" }}
      />
      {/* right side — power */}
      <div
        className="absolute -right-[3px] top-[180px] w-[3px] h-[80px] rounded-r-sm"
        style={{ background: "#1a1d24" }}
      />
    </div>
  );
}

function SignalIcon() {
  return (
    <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
      <rect x="0.5" y="6" width="2" height="3" rx="0.5" fill="currentColor" />
      <rect x="4" y="4" width="2" height="5" rx="0.5" fill="currentColor" />
      <rect x="7.5" y="2" width="2" height="7" rx="0.5" fill="currentColor" />
      <rect x="11" y="0" width="2" height="9" rx="0.5" fill="currentColor" />
    </svg>
  );
}
function WifiIcon() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
      <path
        d="M7 9.2 L8.8 7 A2.5 2.5 0 0 0 5.2 7 Z"
        fill="currentColor"
      />
      <path
        d="M2.6 4.5 A6 6 0 0 1 11.4 4.5"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M4.4 6.2 A3.5 3.5 0 0 1 9.6 6.2"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
    </svg>
  );
}
function BatteryIcon() {
  return (
    <svg width="24" height="11" viewBox="0 0 24 11" fill="none">
      <rect
        x="0.5"
        y="0.5"
        width="20"
        height="10"
        rx="2.5"
        stroke="currentColor"
        strokeOpacity="0.5"
      />
      <rect x="2" y="2" width="17" height="7" rx="1.2" fill="currentColor" />
      <rect x="21.5" y="3.5" width="1.5" height="4" rx="0.5" fill="currentColor" fillOpacity="0.5" />
    </svg>
  );
}
