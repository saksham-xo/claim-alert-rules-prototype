import { Bell } from 'lucide-react';

export default function PushPreview({ title, body, image }) {
  const previewTitle = title || 'Notification Title';
  const previewBody = body || 'Your notification body will preview here.';
  return (
    <div className="bg-[#1c1f2e] rounded-2xl p-4 w-full">
      <div className="text-[10px] uppercase text-white/60 tracking-widest mb-2">Lock screen preview</div>
      <div className="bg-white/95 backdrop-blur-md rounded-xl p-3 flex gap-3 shadow-lg">
        <div className="w-9 h-9 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
          <Bell size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-semibold text-text truncate">{previewTitle}</div>
          <div className="text-[12px] text-text-muted line-clamp-3">{previewBody}</div>
          {image && (
            <div className="mt-2 rounded-md overflow-hidden bg-surface-soft border border-border-soft">
              {/* eslint-disable-next-line jsx-a11y/img-redundant-alt */}
              <img src={image} alt="Preview image" className="w-full h-24 object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
