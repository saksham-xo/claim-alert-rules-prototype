export default function Topbar() {
  return (
    <header className="bg-surface border-b border-border h-[68px] shrink-0 w-full">
      <div className="h-full flex items-center justify-between px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
            <path d="M9 6 L9 21 Q9 25 13 25 L21 25" stroke="#FFB200" strokeWidth="3" strokeLinecap="round" fill="none" />
            <circle cx="22" cy="9" r="3" fill="#0070FF" />
            <circle cx="14" cy="9" r="3" fill="#FFB200" />
          </svg>
          <span className="text-[24px] font-semibold tracking-tight text-text font-display">loyalife</span>
        </div>

        {/* Profile */}
        <div className="flex items-center gap-2 bg-surface-soft border border-border rounded-lg px-2 py-1.5">
          <div className="w-8 h-8 rounded-full bg-[#3E94FF] text-white flex items-center justify-center text-sm font-semibold">P</div>
          <div className="leading-tight pr-1">
            <div className="text-[14px] font-semibold text-text">Purushotham</div>
            <div className="text-[12px] text-text-faint">Vistara Rewards</div>
          </div>
        </div>
      </div>
    </header>
  );
}
