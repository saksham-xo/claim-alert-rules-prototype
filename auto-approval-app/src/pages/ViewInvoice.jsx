import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '../data/store';
import InvoiceContent, { RewardPointsInline } from '../components/shared/InvoiceContent';
import ActionModal from '../components/ActionModal';

/**
 * Invoice detail page. Wrapper around the shared <InvoiceContent /> body —
 * adds the page-level header with back arrow, title, reward pill, and Reject/Approve buttons.
 *
 * The same body renders inside the Approval Workflow modal (ApprovalWorkflow.jsx).
 */
export default function ViewInvoice() {
  const { index } = useParams();
  const { invoices, setDecisionStatus, showToast } = useStore();
  const idx = parseInt(index, 10);
  const inv = invoices[idx];
  const [actionModal, setActionModal] = useState(null);

  if (!inv) {
    return (
      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-12 text-center text-text-secondary">
        Invoice not found.{' '}
        <Link to="/partner-promotions/invoice-management" className="text-primary hover:underline ml-1">Back to claims</Link>
      </div>
    );
  }

  const points = inv.rewardPoints != null ? inv.rewardPoints : Math.round(inv.amount / 10);
  const decision = inv.decisionStatus || 'pending';
  const isFinalised = decision === 'approved' || decision === 'rejected' || decision === 'failed';

  const handleAction = (kind) => setActionModal({ kind, num: inv.num });
  const handleActionConfirm = () => {
    const next = actionModal.kind === 'approve' ? 'approved' : 'rejected';
    setDecisionStatus(inv.claimId, next);
    showToast(`${inv.num} ${next === 'approved' ? 'approved' : 'rejected'}`);
    setActionModal(null);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header bar */}
      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-4 px-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/partner-promotions/invoice-management" className="hover:bg-bg rounded-lg p-1.5 cursor-pointer transition-colors text-text">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-xl font-semibold text-text">View Invoice</h1>
        </div>
        <div className="flex items-center gap-4">
          <RewardPointsInline points={points} />
          <div className="h-9 w-px bg-border" />
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleAction('reject')}
              disabled={isFinalised}
              className={`px-5 py-2 rounded text-[13px] font-semibold transition-colors ${
                isFinalised
                  ? 'bg-bg text-text-secondary cursor-not-allowed'
                  : 'bg-[#E53935] hover:bg-[#D32F2F] text-white cursor-pointer'
              }`}
            >
              Reject
            </button>
            <button
              onClick={() => handleAction('approve')}
              disabled={isFinalised}
              className={`px-5 py-2 rounded text-[13px] font-semibold transition-colors ${
                isFinalised
                  ? 'bg-bg text-text-secondary cursor-not-allowed'
                  : 'bg-success hover:bg-[#388E3C] text-white cursor-pointer'
              }`}
            >
              Approve
            </button>
          </div>
        </div>
      </div>

      <InvoiceContent inv={inv} />

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
