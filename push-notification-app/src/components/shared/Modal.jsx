import { X } from 'lucide-react';
import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const widthClass = {
    sm: 'w-[445px]',
    md: 'w-[600px]',
    lg: 'w-[920px]',
  }[size] ?? 'w-[600px]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0e1259] p-6">
      <div className={`${widthClass} max-h-[90vh] flex flex-col bg-surface rounded-lg shadow-xl overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-soft">
          <h3 className="text-[18px] font-semibold text-text">{title}</h3>
          <button onClick={onClose} className="text-text-secondary hover:text-text cursor-pointer" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto scroll-thin">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-border-soft flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
