import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore, deriveOutcome } from '../data/store';
import InvoiceContent, { RewardPointsInline } from './shared/InvoiceContent';
import ActionModal from './ActionModal';

/**
 * Manual approval workflow — full-screen overlay that walks the reviewer through
 * the queue of claims that didn't auto-approve.
 *
 * Queue = anything with a non-`auto_approved` outcome. The reviewer sees the same
 * <InvoiceContent /> the View Invoice page uses, plus a workflow chrome around it
 * (queue progress, prev/next, Reject/Approve, Exit Workflow).
 */
export default function ApprovalWorkflow({ onClose }) {
  const { invoices, showToast, setDecisionStatus } = useStore();
  const [position, setPosition] = useState(0);
  const [actionModal, setActionModal] = useState(null);

  // Queue = anything still pending a manual decision.
  const queue = useMemo(
    () => invoices
      .map((inv, i) => ({ inv, idx: i, outcome: deriveOutcome(inv.validationResults) }))
      .filter(x => (x.inv.decisionStatus || 'pending') === 'pending'),
    [invoices]
  );

  if (queue.length === 0) {
    return (
      <div className="fixed inset-0 bg-bg z-[150] flex flex-col overflow-hidden">
        <WorkflowTopbar position={0} total={0} onClose={onClose} />
        <div className="flex-1 flex items-center justify-center text-text-secondary">
          No pending invoices in the queue. The auto-approval pipeline closed everything cleanly.
        </div>
      </div>
    );
  }

  const current = queue[Math.min(position, queue.length - 1)];
  const inv = current.inv;
  const points = inv.rewardPoints != null ? inv.rewardPoints : Math.round(inv.amount / 10);

  const advance = () => {
    if (position < queue.length - 1) setPosition(position + 1);
    else onClose();
  };

  const handleAction = (kind) => setActionModal({ kind, num: inv.num });
  const handleActionConfirm = () => {
    const next = actionModal.kind === 'approve' ? 'approved' : 'rejected';
    setDecisionStatus(inv.claimId, next);
    showToast(`${inv.num} ${next}`);
    setActionModal(null);
    advance();
  };

  return (
    <div className="fixed inset-0 bg-bg z-[150] flex flex-col overflow-hidden">
      <WorkflowTopbar position={position} total={queue.length} onClose={onClose} />

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-10 py-6">
        <div className="max-w-[1280px] mx-auto flex flex-col gap-5">
          {/* Per-claim header bar with prev/next + actions */}
          <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-4 px-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPosition(Math.max(0, position - 1))}
                disabled={position === 0}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[12px] font-medium transition-colors ${
                  position === 0
                    ? 'text-text-secondary/50 cursor-not-allowed'
                    : 'text-primary hover:bg-primary-light cursor-pointer'
                }`}
              >
                <ChevronLeft size={14} /> Prev
              </button>
              <span className="text-[12px] text-text-secondary">
                Invoice <span className="font-semibold text-text">{position + 1}</span> of {queue.length}
              </span>
              <button
                onClick={() => setPosition(Math.min(queue.length - 1, position + 1))}
                disabled={position === queue.length - 1}
                className={`flex items-center gap-1 px-2 py-1 rounded text-[12px] font-medium transition-colors ${
                  position === queue.length - 1
                    ? 'text-text-secondary/50 cursor-not-allowed'
                    : 'text-primary hover:bg-primary-light cursor-pointer'
                }`}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <RewardPointsInline points={points} />
              <div className="h-9 w-px bg-border" />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleAction('reject')}
                  className="bg-[#E53935] hover:bg-[#D32F2F] text-white px-5 py-2 rounded text-[13px] font-semibold cursor-pointer transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => handleAction('approve')}
                  className="bg-success hover:bg-[#388E3C] text-white px-5 py-2 rounded text-[13px] font-semibold cursor-pointer transition-colors"
                >
                  Approve
                </button>
              </div>
            </div>
          </div>

          <InvoiceContent inv={inv} />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-surface border-t border-border px-6 py-3 shrink-0">
        <div className="max-w-[1280px] mx-auto">
          <button
            onClick={onClose}
            className="bg-surface text-primary border border-primary px-4 py-1.5 rounded text-xs font-medium hover:bg-primary-light cursor-pointer"
          >
            Exit Workflow
          </button>
        </div>
      </div>

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

function WorkflowTopbar({ position, total, onClose }) {
  return (
    <div className="bg-surface border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-base font-semibold">Approval Workflow</span>
        {total > 0 && (
          <span className="bg-primary-light text-primary text-[11px] font-semibold px-2.5 py-1 rounded">
            {total} invoice{total === 1 ? '' : 's'} in queue
          </span>
        )}
      </div>
      <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-xl text-text-secondary hover:text-text">&times;</button>
    </div>
  );
}
