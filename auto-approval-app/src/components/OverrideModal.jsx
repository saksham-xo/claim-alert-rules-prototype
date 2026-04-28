import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function OverrideModal({ alert, onClose, onConfirm, showToast }) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      showToast('Reason is required');
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-[480px]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-base font-semibold text-text">Override Alert & Approve</span>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-xl text-text-secondary">&times;</button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Warning banner */}
          <div className="bg-flag-bg border border-flag rounded-lg p-3 px-4 mb-4 flex gap-2.5 items-start">
            <AlertTriangle size={20} className="text-flag shrink-0 mt-0.5" />
            <div>
              <div className="font-medium text-[#E65100]">You are overriding a blocking alert</div>
              <div className="text-xs text-[#F57C00] mt-1">This action will be recorded in the audit trail.</div>
            </div>
          </div>

          {/* Alert info */}
          <div className="mb-4 text-[13px] text-text">
            <strong>{alert.ruleName}</strong>: {alert.msg}
          </div>

          {/* Reason */}
          <label className="block text-xs font-medium text-text-secondary mb-1">Override Reason *</label>
          <textarea
            rows={3}
            placeholder="Why is this alert being overridden?"
            value={reason}
            onChange={e => setReason(e.target.value)}
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
            onClick={handleConfirm}
            className="bg-block text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#E53935] cursor-pointer"
          >
            Override & Approve
          </button>
        </div>
      </div>
    </div>
  );
}
