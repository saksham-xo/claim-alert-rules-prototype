import { Palette } from 'lucide-react';
import { useStore } from '../../data/store';

export default function Topbar() {
  const { uiNotes, toggleUiNotes } = useStore();

  return (
    <header className="h-14 bg-surface border-b border-border shrink-0 w-full">
      <div className="max-w-[1440px] mx-auto h-full flex items-center justify-between pl-5 pr-4">
      {/* Left — logo */}
      <div className="flex items-center gap-2">
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="14" fill="#E8F5E9" stroke="#4CAF50" strokeWidth="2"/>
          <circle cx="12" cy="14" r="3" fill="#FFC107"/>
          <circle cx="20" cy="14" r="3" fill="#1976D2"/>
          <path d="M16 20c-2 0-3.5-1-4-2h8c-.5 1-2 2-4 2z" fill="#4CAF50"/>
        </svg>
        <span className="text-lg font-bold text-text tracking-tight">loyalife</span>
      </div>

      {/* Right — toggles + admin */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleUiNotes}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-all border ${
            uiNotes
              ? 'bg-primary-light border-primary/30 text-primary'
              : 'bg-bg border-border text-text-secondary hover:border-text-secondary'
          }`}
        >
          <Palette size={12} />
          UI Notes
        </button>

        <div className="flex items-center gap-2.5 ml-2 border border-border rounded-lg px-3 py-1.5">
          <div className="w-8 h-8 rounded bg-[#009A44] text-white flex items-center justify-center text-[8px] font-bold leading-none">LUPIN</div>
          <div>
            <div className="text-xs font-medium text-text leading-tight">admin</div>
            <div className="text-[10px] text-text-secondary leading-tight">Lupin</div>
          </div>
        </div>
      </div>
      </div>
    </header>
  );
}
