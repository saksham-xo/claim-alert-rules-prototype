import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '../data/store';
import StatusPill from '../components/shared/StatusPill';
import InvoiceDetail from '../components/shared/InvoiceDetail';
import OverrideModal from '../components/OverrideModal';

export default function ViewInvoice() {
  const { index } = useParams();
  const navigate = useNavigate();
  const { invoices, updateAlert, showToast } = useStore();
  const idx = parseInt(index, 10);
  const inv = invoices[idx];

  const [overrideTarget, setOverrideTarget] = useState(null);

  if (!inv) {
    return (
      <div className="text-center py-10 text-text-secondary">
        Invoice not found.
        <button onClick={() => navigate('/partner-promotions/invoice-management')} className="text-primary ml-2 cursor-pointer bg-transparent border-none font-medium">
          Back to Claims
        </button>
      </div>
    );
  }

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

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate('/partner-promotions/invoice-management')}
          className="flex items-center gap-1 bg-transparent border-none text-primary text-[13px] font-medium cursor-pointer rounded p-1 hover:bg-primary-light"
        >
          <ChevronLeft size={16} />
        </button>
        <h2 className="text-lg font-semibold text-text">
          Invoice # {inv.num || <span className="text-text-secondary italic font-normal">Missing</span>}
        </h2>
        <StatusPill status={inv.status} />
      </div>

      <InvoiceDetail
        inv={inv}
        invoiceIdx={idx}
        onAck={handleAck}
        onOverride={handleOverride}
        showToast={showToast}
      />

      {overrideTarget && (
        <OverrideModal
          alert={inv.alerts[overrideTarget.ai]}
          onClose={() => setOverrideTarget(null)}
          onConfirm={handleOverrideConfirm}
          showToast={showToast}
        />
      )}
    </div>
  );
}
