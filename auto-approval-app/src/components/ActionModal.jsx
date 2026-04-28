import { useState } from 'react';

export default function ActionModal({ kind, invoiceNum, onClose, onConfirm }) {
  const [note, setNote] = useState('');
  const isApprove = kind === 'approve';

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-[480px]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-base font-semibold text-text">
            {isApprove ? 'Approve Invoice' : 'Reject Invoice'}
          </span>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-xl text-text-secondary">&times;</button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Warning */}
          <div className="bg-[#FFF8E1] border border-[#FFD54F] rounded p-2.5 px-3.5 text-xs text-[#F57F17] font-medium mb-4">
            This action cannot be reverted.
          </div>

          <p className="text-[13px] text-text mb-4">
            {isApprove ? (
              <>Approve <strong>{invoiceNum}</strong>? Points will be credited immediately.</>
            ) : (
              <>Reject <strong>{invoiceNum}</strong>? The submitter will be notified.</>
            )}
          </p>

          <label className="block text-xs font-medium text-text-secondary mb-1">Reason / Note</label>
          <textarea
            rows={3}
            placeholder="Optional — leave a note for the audit trail"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full p-2 px-3 border border-border rounded-lg text-[13px] text-text outline-none resize-y focus:border-primary"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="bg-surface text-text border border-border px-4 py-2 rounded text-sm font-medium hover:bg-bg cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(note.trim())}
            className={`text-white px-4 py-2 rounded text-sm font-medium cursor-pointer ${
              isApprove
                ? 'bg-success hover:bg-[#43A047]'
                : 'bg-block hover:bg-[#E53935]'
            }`}
          >
            {isApprove ? 'Approve' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}
