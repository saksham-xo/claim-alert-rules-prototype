import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal } from 'lucide-react';

export default function Popover({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="text-text-secondary hover:bg-bg rounded p-1 cursor-pointer"
      >
        <MoreHorizontal size={18} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
          {items.map((item, i) => {
            const color = item.success ? 'text-success font-medium' : item.danger ? 'text-block font-medium' : 'text-text';
            return (
              <button
                key={i}
                onClick={() => { setOpen(false); item.onClick(); }}
                className={`block w-full text-left px-3.5 py-2 text-[13px] hover:bg-bg cursor-pointer ${color}`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
