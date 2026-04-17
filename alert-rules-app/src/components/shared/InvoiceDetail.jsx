import { Pencil, ChevronLeft, Image, Zap, Info } from 'lucide-react';
import { useStore } from '../../data/store';
import { getGroups, evaluateGroups } from '../../data/rules';
import StatusPill from './StatusPill';
import BehaviorPill from './BehaviorPill';

function ConfidenceRing({ value }) {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value || 0));
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width="84" height="84" viewBox="0 0 84 84">
      <circle cx="42" cy="42" r={r} fill="none" stroke="#E3EBF6" strokeWidth="7" />
      <circle
        cx="42" cy="42" r={r} fill="none" stroke="#3F51B5" strokeWidth="7"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 42 42)"
      />
      <text x="42" y="46" textAnchor="middle" className="text-lg font-bold" fill="#303E67">{pct}%</text>
    </svg>
  );
}

function ConfidenceScoreCard({ value }) {
  return (
    <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-5 mb-5">
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-base font-semibold text-text">Confidence Score</h3>
        <div className="relative group cursor-help">
          <Info size={14} className="text-text-secondary" />
          <div className="absolute right-0 top-full mt-1 z-50 w-60 bg-text text-white text-[11px] rounded-md p-2 leading-snug opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-normal shadow-lg">
            Generated when the invoice was submitted. OCR runs once on upload — the score is stored permanently on the claim.
          </div>
        </div>
      </div>
      {value != null ? (
        <div className="flex items-center gap-4">
          <ConfidenceRing value={value} />
          <div className="flex-1 min-w-0 text-[11px] text-text-secondary leading-relaxed">
            This score reflects how reliably OCR read this invoice. It's used to decide which claims to auto-approve.
          </div>
        </div>
      ) : (
        <div className="text-sm text-text-secondary">Not available</div>
      )}
    </div>
  );
}

function AutoApprovalBanner({ rule, ocrConfidence }) {
  return (
    <div className="bg-[#E8F5E9] border border-success rounded-lg p-3 px-4 mb-4">
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-full bg-success flex items-center justify-center shrink-0">
          <Zap size={14} className="text-white" fill="white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-[#2E7D32]">Auto-approved</span>
            <span className="text-[13px] text-text">·</span>
            <span className="text-[13px] font-medium text-text">{rule ? rule.name : 'Unknown rule'}</span>
            {rule?.id && (
              <span className="text-[10px] font-mono text-text-secondary bg-surface border border-[#A5D6A7] rounded px-1.5 py-0.5">{rule.id}</span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1.5">
            {ocrConfidence != null && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-text-secondary">Confidence score</span>
                <span className="text-[12px] font-medium text-text">{ocrConfidence}%</span>
              </div>
            )}
            {rule?.minScanQuality && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-text-secondary">Rule threshold (≥)</span>
                <span className="text-[12px] font-medium text-text">{rule.minScanQuality}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AlertBanner({ alert }) {
  return (
    <div className="rounded-lg p-3 px-4 mb-2 border bg-block-bg border-[#FFCDD2]">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full border-2 border-block flex items-center justify-center shrink-0 text-sm font-bold text-block">!</div>
        <div className="flex-1">
          <div className="font-medium text-[13px] text-text">{alert.ruleName}</div>
          <div className="text-xs text-text-secondary mt-0.5">{alert.msg}</div>
        </div>
      </div>
    </div>
  );
}

function AlertsSection({ inv }) {
  if (inv.alerts.length === 0) {
    return (
      <div className="bg-[#E8F5E9] border border-success rounded-lg p-3 px-4 flex items-center gap-3">
        <div className="w-7 h-7 rounded-full border-2 border-success flex items-center justify-center shrink-0 text-success">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
        </div>
        <span className="text-[13px] font-medium text-[#2E7D32]">No alerts for this invoice.</span>
      </div>
    );
  }

  return (
    <div>
      {inv.alerts.map((alert, ai) => (
        <AlertBanner key={ai} alert={alert} />
      ))}
    </div>
  );
}

function inr(n) {
  return n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function InvoiceDetail({ inv, invoiceIdx, showToast }) {
  const { rules, invoices, approveRules, devNotes } = useStore();
  const activeRules = rules.filter(r => r.on && !r.archived);
  const activeRuleIds = new Set(activeRules.map(r => r.id));
  const autoApprovalRule = inv.autoApprovedByRuleId
    ? approveRules.find(r => r.id === inv.autoApprovedByRuleId)
    : null;

  const evaluateCond = (inv, c) => {
    const val = parseFloat((c.val || '').toString().replace(/,/g, '')) || 0;
    if (c.f === 'totalAmount') {
      if (c.op === 'gt') return inv.amount > val;
      if (c.op === 'gte') return inv.amount >= val;
      if (c.op === 'lt') return inv.amount < val;
      if (c.op === 'lte') return inv.amount <= val;
      if (c.op === 'equals') return inv.amount === val;
      if (c.op === 'not_equals') return inv.amount !== val;
    }
    if (c.f === 'invoiceNo') {
      if (c.op === 'is_empty') return !inv.num;
      if (c.op === 'is_not_empty') return !!inv.num;
      if (c.op === 'equals') return inv.num === c.val;
      if (c.op === 'contains') return (inv.num || '').includes(c.val);
      if (c.op === 'not_contains') return !(inv.num || '').includes(c.val);
    }
    if (c.f === 'lineItemsMismatch') {
      const lineSum = (inv.lineItems || []).reduce((s, li) => s + li.amount, 0);
      const mismatch = Math.abs(lineSum - inv.amount) > 0.01;
      if (c.op === 'is_true') return mismatch;
      if (c.op === 'is_false') return !mismatch;
    }
    if (c.f === 'ocrAmountMatch') {
      const matches = inv.ocrAmount == null ? true : Math.abs(inv.ocrAmount - inv.amount) < 0.01;
      if (c.op === 'is_true') return matches;
      if (c.op === 'is_false') return !matches;
    }
    if (c.f === 'invoiceAge' && inv.invDate) {
      const days = Math.floor((new Date(inv.date) - new Date(inv.invDate)) / 86400000);
      if (c.op === 'gt') return days > val;
      if (c.op === 'gte') return days >= val;
    }
    return false;
  };

  const hardcoded = inv.alerts.filter(a => a.system || activeRuleIds.has(a.ruleId));
  const hardcodedRuleIds = new Set(hardcoded.map(a => a.ruleId));
  const dynamicAlerts = activeRules
    .filter(r => !hardcodedRuleIds.has(r.id))
    .filter(r => evaluateGroups(inv, getGroups(r), evaluateCond))
    .map(r => ({ ruleId: r.id, ruleName: r.name, msg: r.desc }));
  const allAlerts = [...hardcoded, ...dynamicAlerts];
  return (
    <div className="grid grid-cols-[2fr_1fr] gap-6">
      {/* Left column */}
      <div>
        {/* Invoice Details */}
        <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-text">Invoice Details</h3>
            <button className="flex items-center gap-1 text-[#1976d2] text-sm font-medium bg-transparent border-none cursor-pointer hover:underline" onClick={() => showToast('Edit Fields')}>
              <Pencil size={14} /> Edit Fields
            </button>
          </div>
          <div className="grid grid-cols-3 gap-4 gap-x-6">
            <div>
              <div className="text-xs text-[#666] mb-1">Invoice Number</div>
              <div className="text-sm font-medium">
                {inv.num || <span className="italic text-text-secondary">Missing</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1">Invoice Amount</div>
              <div className="text-sm text-text font-medium">{inr(inv.amount)}</div>
            </div>
            <div className="row-span-3">
              <div className="text-xs text-[#666] mb-1">Invoice Preview</div>
              <div className="bg-[#F0F0F0] border border-border rounded h-[140px] flex items-center justify-center text-text-secondary text-[11px]">
                <Image size={16} className="text-text-secondary" />
              </div>
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1">Retailer</div>
              <div className="text-sm font-medium">
                {inv.partner || <span className="italic text-text-secondary">Missing</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1">Customer</div>
              <div className="text-sm text-text font-medium">{inv.customer}</div>
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1">Claim Submitted On</div>
              <div className="text-sm text-text font-medium">{inv.date}</div>
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1">Invoice Date</div>
              <div className="text-sm text-text font-medium">{inv.invDate}</div>
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1">Claim Status</div>
              <StatusPill status={inv.status} />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-text">Line Items</h3>
            <button className="flex items-center gap-1 text-[#1976d2] text-sm font-medium bg-transparent border-none cursor-pointer hover:underline" onClick={() => showToast('Edit Fields')}>
              <Pencil size={14} /> Edit Fields
            </button>
          </div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border">S.No</th>
                <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border">Product Code</th>
                <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border">Product Name</th>
                <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-right border-b border-border">Qty</th>
                <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-right border-b border-border">Unit Price</th>
                <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-right border-b border-border">Amount</th>
              </tr>
            </thead>
            <tbody>
              {inv.lineItems.map((li, i) => (
                <tr key={i} className="border-b border-border hover:bg-[#F5F5F5]">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3 font-mono text-xs">{li.code}</td>
                  <td className="px-4 py-3">{li.name}</td>
                  <td className="px-4 py-3 text-right">{li.qty}</td>
                  <td className="px-4 py-3 text-right">{inr(li.price)}</td>
                  <td className="px-4 py-3 text-right font-medium">{inr(li.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Partner Details */}
        <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-5 mb-5">
          <h3 className="text-base font-semibold text-text mb-4">Partner Details</h3>
          <div className="flex gap-8 mb-5">
            <div>
              <div className="text-xs text-[#666] mb-1">Partner Name</div>
              <div className="text-sm font-medium">
                {inv.partner || <span className="italic text-text-secondary">Missing</span>}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1">Partner ID</div>
              <div className="text-sm text-text font-medium">{inv.partnerId}</div>
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1">Total Claims</div>
              <div className="text-sm text-text font-medium">{inv.totalClaims}</div>
            </div>
            <div>
              <div className="text-xs text-[#666] mb-1">Last Claim</div>
              <div className="text-sm text-text font-medium">{inv.lastClaim}</div>
            </div>
          </div>
          <div className="text-sm font-semibold text-text mb-3">Past Invoices Claimed</div>
          <div className="flex gap-4 overflow-x-auto py-1">
            {inv.pastInvoices.length > 0 ? inv.pastInvoices.map((p, i) => (
              <div key={i} className="min-w-[180px] border border-border rounded-lg p-3 bg-[#FAFAFA] shrink-0">
                <div className="w-full h-12 bg-border rounded flex items-center justify-center text-[10px] text-text-secondary mb-2">
                  <Image size={16} />
                </div>
                <div className="text-xs font-medium text-text">{p}</div>
                <div className="mt-1"><StatusPill status="pending" /></div>
              </div>
            )) : (
              <div className="text-text-secondary text-[13px]">No past invoices</div>
            )}
          </div>
        </div>

        {/* Reward Points */}
        <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-5">
          <h3 className="text-base font-semibold text-text mb-4">Reward Points</h3>
          <div className="text-base font-semibold text-text">0 Points</div>
        </div>
      </div>

      {/* Right column */}
      <div>
        {/* Timeline */}
        <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-5 mb-5">
          <h3 className="text-base font-semibold text-text mb-4">Timeline</h3>
          <div className="flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center shrink-0">
              <svg width="16" height="16" fill="none" stroke="#3F51B5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <div>
              <div className="text-[13px] font-medium text-text">Claim submitted by Source</div>
              <div className="text-xs text-text-secondary mt-1">{inv.date}</div>
              <div className="flex gap-2 mt-1.5">
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-pending-bg text-[#B8860B]">Claim Submitted</span>
                <a href="#" className="text-xs text-primary no-underline" onClick={(e) => { e.preventDefault(); showToast('Opening receipt'); }}>receipt_image.jpg</a>
              </div>
            </div>
          </div>
        </div>

        {/* Confidence Score */}
        <ConfidenceScoreCard value={inv.ocrConfidence} />

        {/* Auto-approval banner */}
        {inv.status === 'approved' && inv.autoApprovedByRuleId && (
          <AutoApprovalBanner rule={autoApprovalRule} ocrConfidence={inv.ocrConfidence} />
        )}

        {/* Alerts */}
        <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-text">Alerts</h3>
            {devNotes && (
              <span className="text-[10px] bg-[#E8F5E9] border border-[#A5D6A7] text-[#1B5E20] px-2 py-0.5 rounded">
                <span className="font-semibold text-[#2E7D32]">Dev:</span> Filtered by active rules. No action buttons (extended).
              </span>
            )}
          </div>
          <AlertsSection inv={{ ...inv, alerts: allAlerts }} />
        </div>
      </div>
    </div>
  );
}
