import { useState } from 'react';
import { X } from 'lucide-react';
import { useStore } from '../data/store';
import StatusPill from './shared/StatusPill';
import InvoiceDetail from './shared/InvoiceDetail';
import OverrideModal from './OverrideModal';
import ActionModal from './ActionModal';

export default function ApprovalWorkflow({ onClose }) {
  const { invoices, updateAlert, showToast } = useStore();
  const pending = invoices.map((inv, i) => ({ inv, idx: i })).filter(x => x.inv.status === 'pending');
  const [currentPos, setCurrentPos] = useState(0);
  const [overrideTarget, setOverrideTarget] = useState(null);
  const [actionModal, setActionModal] = useState(null);

  const current = pending[currentPos];
  if (!current) {
    return (
      <div className="fixed inset-0 bg-bg z-[150] flex flex-col overflow-hidden">
        <div className="bg-surface border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold">Approval Workflow</span>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-xl text-text-secondary">&times;</button>
        </div>
        <div className="flex-1 flex items-center justify-center text-text-secondary">
          No pending invoices in queue.
        </div>
      </div>
    );
  }

  const inv = current.inv;
  const invoiceIdx = current.idx;
  const hasBlocking = inv.alerts.some(a => a.status === 'active' && a.behavior === 'block');

  const handleAck = (ii, ai) => {
    updateAlert(ii, ai, { status: 'acknowledged' });
    showToast('Alert acknowledged');
  };

  const handleOverride = (ii, ai) => {
    setOverrideTarget({ ii, ai });
  };

  const handleOverrideConfirm = (reason) => {
    if (!overrideTarget) return;
    updateAlert(overrideTarget.ii, overrideTarget.ai, {
      status: 'overridden',
      overrideBy: 'saksham',
      overrideReason: reason,
    });
    setOverrideTarget(null);
    showToast('Alert overridden');
  };

  const handleAction = (kind) => {
    setActionModal({ kind, num: inv.num });
  };

  const handleActionConfirm = () => {
    showToast(`${inv.num} ${actionModal.kind}d`);
    setActionModal(null);
    // Move to next or close
    if (currentPos < pending.length - 1) {
      setCurrentPos(currentPos + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-bg z-[150] flex flex-col overflow-hidden">
      {/* Topbar */}
      <div className="bg-surface border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold">Approval Workflow</span>
          <span className="bg-primary-light text-primary text-[11px] font-semibold px-2.5 py-1 rounded">
            {pending.length} invoices in queue
          </span>
        </div>
        <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-xl text-text-secondary">&times;</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-20 py-6">
        {/* Invoice header + actions */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold">Invoice # {inv.num}</span>
            <StatusPill status={inv.status} />
          </div>
          <div className="flex gap-2 items-start">
            <button
              onClick={() => handleAction('reject')}
              className="bg-block text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#E53935] cursor-pointer"
            >
              Reject
            </button>
            <div className="flex flex-col items-end">
              <button
                onClick={() => hasBlocking ? null : handleAction('approve')}
                disabled={hasBlocking}
                className={`px-4 py-2 rounded text-sm font-medium cursor-pointer ${
                  hasBlocking
                    ? 'bg-[#A5D6A7] text-white cursor-not-allowed'
                    : 'bg-success text-white hover:bg-[#43A047]'
                }`}
              >
                Approve
              </button>
              {hasBlocking && (
                <div className="text-[11px] text-block mt-1">Resolve blocking alerts first</div>
              )}
            </div>
          </div>
        </div>

        <InvoiceDetail
          inv={inv}
          invoiceIdx={invoiceIdx}
          onAck={handleAck}
          onOverride={handleOverride}
          showToast={showToast}
        />
      </div>

      {/* Footer */}
      <div className="bg-surface border-t border-border px-6 py-3 shrink-0">
        <button
          onClick={onClose}
          className="bg-surface text-primary border border-primary px-4 py-1.5 rounded text-xs font-medium hover:bg-primary-light cursor-pointer"
        >
          Exit Workflow
        </button>
      </div>

      {/* Override modal */}
      {overrideTarget && (
        <OverrideModal
          alert={inv.alerts[overrideTarget.ai]}
          onClose={() => setOverrideTarget(null)}
          onConfirm={handleOverrideConfirm}
          showToast={showToast}
        />
      )}

      {/* Action modal */}
      {actionModal && (
        <ActionModal
          kind={actionModal.kind}
          invoiceNum={actionModal.num}
          onClose={() => setActionModal(null)}
          onConfirm={handleActionConfirm}
        />
      )}
    </div>
  );
}
