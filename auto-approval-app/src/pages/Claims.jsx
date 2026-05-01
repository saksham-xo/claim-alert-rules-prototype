import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Search, X, Settings, ChevronDown } from 'lucide-react';
import { useStore, derivePresentationStatus } from '../data/store';
import StatusPill from '../components/shared/StatusPill';
import Popover from '../components/shared/Popover';
import ActionCard from '../components/shared/ActionCard';
import ApprovalWorkflow from '../components/ApprovalWorkflow';
import ActionModal from '../components/ActionModal';
import RefNote from '../components/shared/RefNote';

// Tabs collapse to Pending / All. Status sub-filter only meaningful on Pending —
// it scopes the view to a specific verdict (Needs review vs. Suspicious).
const TYPE_OPTIONS = ['All Types', 'Claims', 'Warranty'];
const PENDING_SUBFILTER_OPTIONS = [
  { key: 'all',          label: 'All pending' },
  { key: 'needs_review', label: 'Needs review' },
  { key: 'suspicious',   label: 'Suspicious' },
];

export default function Claims() {
  const navigate = useNavigate();
  const { invoices, setDecisionStatus, showToast, autoApprovalEnabled, autoApprovalSettings } = useStore();
  const [tab, setTab] = useState('pending');           // 'pending' | 'all'
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [typeOpen, setTypeOpen] = useState(false);
  const [pendingSubFilter, setPendingSubFilter] = useState('all'); // 'all' | 'needs_review' | 'suspicious'
  const [pendingSubOpen, setPendingSubOpen] = useState(false);
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [actionModal, setActionModal] = useState(null); // { kind, claimId, num }

  const handleActionConfirm = () => {
    const next = actionModal.kind === 'approve' ? 'approved' : 'rejected';
    setDecisionStatus(actionModal.claimId, next);
    showToast(`${actionModal.num} ${next}`);
    setActionModal(null);
  };

  // Pre-compute the unified presentation status for every invoice so tab counts,
  // sub-filter logic and the table all read from the same derivation.
  const enriched = useMemo(
    () => invoices.map(inv => ({
      ...inv,
      presentation: derivePresentationStatus(inv, autoApprovalEnabled, autoApprovalSettings),
    })),
    [invoices, autoApprovalEnabled, autoApprovalSettings]
  );

  const pendingCount = enriched.filter(inv => (inv.decisionStatus || 'pending') === 'pending').length;
  const totalCount = enriched.length;

  const filtered = enriched.filter(inv => {
    const decision = inv.decisionStatus || 'pending';
    if (tab === 'pending' && decision !== 'pending') return false;
    if (typeFilter !== 'All Types' && inv.type !== typeFilter) return false;
    if (tab === 'pending' && pendingSubFilter !== 'all') {
      const k = inv.presentation.key;
      if (pendingSubFilter === 'needs_review' && k !== 'needs_review') return false;
      if (pendingSubFilter === 'suspicious' && !k.startsWith('suspicious_')) return false;
    }
    if (q) {
      const hay = `${inv.partner} ${inv.num} ${inv.member} ${inv.claimId}`.toLowerCase();
      if (!hay.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Page header */}
      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-4 px-6 flex items-center gap-4 mb-6 min-h-[86px]">
        <div className="w-[52px] h-[52px] bg-primary-light rounded-lg flex items-center justify-center shrink-0">
          <ClipboardCheck size={28} className="text-primary" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-text">Claims Management</h1>
          <p className="text-sm text-text-secondary mt-0.5 tracking-wide">Review and process invoice-based claims and rewards</p>
        </div>
        <button
          onClick={() => navigate('/partner-promotions/invoice-management/settings')}
          title="Settings"
          aria-label="Settings"
          className="p-2 border border-border rounded-lg text-text-secondary hover:text-text hover:border-text-secondary cursor-pointer transition-colors"
        >
          <Settings size={16} />
        </button>
      </div>

      {/* Manual approval workflow — kept until the existing flow is sunset */}
      <RefNote kind="replicate">
        Approval Workflow banner replicated from the existing Claims Management page. Lives alongside the unified status column until the manual flow is sunset.
      </RefNote>
      <ActionCard
        title="Approval Workflow"
        subtitle={`${pendingCount} invoices in queue`}
        buttonLabel="Start Approval"
        onButtonClick={() => setWorkflowOpen(true)}
      />

      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
        {/* Tabs — Pending / All */}
        <div className="flex items-center border-b-2 border-border bg-bg px-4">
          {[
            { key: 'pending', label: `Pending(${pendingCount})` },
            { key: 'all',     label: `All(${totalCount})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-xs font-semibold border-b-[4px] -mb-[2px] cursor-pointer transition-colors ${
                tab === t.key
                  ? 'text-primary border-primary rounded-t'
                  : 'text-text-secondary border-transparent hover:text-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search + Type filter + Pending sub-filter (only on Pending tab) */}
        <div className="flex items-stretch gap-3 mx-4 my-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#868CCC]" />
            <input
              type="text"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search by Partner Name, Member or Invoice Number"
              className="w-full pl-10 pr-10 py-2.5 border border-border rounded-lg text-[13px] text-text outline-none focus:border-primary placeholder:text-[#BDC5DA]"
            />
            {q && (
              <button onClick={() => setQ('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary cursor-pointer">
                <X size={16} />
              </button>
            )}
          </div>

          <Dropdown
            value={typeFilter}
            options={TYPE_OPTIONS.map(o => ({ key: o, label: o }))}
            open={typeOpen}
            onToggle={() => { setTypeOpen(!typeOpen); setPendingSubOpen(false); }}
            onPick={(opt) => { setTypeFilter(opt); setTypeOpen(false); }}
            width="w-44"
          />

          {tab === 'pending' && (
            <Dropdown
              value={PENDING_SUBFILTER_OPTIONS.find(o => o.key === pendingSubFilter)?.label}
              options={PENDING_SUBFILTER_OPTIONS}
              open={pendingSubOpen}
              onToggle={() => { setPendingSubOpen(!pendingSubOpen); setTypeOpen(false); }}
              onPick={(opt) => { setPendingSubFilter(opt); setPendingSubOpen(false); }}
              width="w-48"
            />
          )}
        </div>

        {/* Table */}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border">Partner</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Claim ID</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Type</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Invoice Number</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-right border-b border-border border-l">Amount</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Submitted</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Status</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l w-[80px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => {
              const origIdx = invoices.findIndex(x => x.claimId === inv.claimId);
              const decision = inv.decisionStatus || 'pending';
              return (
                <tr key={inv.claimId} className="border-b border-border hover:bg-[#F5F5F5]">
                  <td className="px-4 py-3 font-medium">{inv.partner}</td>
                  <td className="px-4 py-3 text-text-secondary">{inv.claimId}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${inv.type === 'Claims' ? 'bg-[#E3F2FD] text-[#1565C0]' : 'bg-[#F3E5F5] text-[#7B1FA2]'}`}>
                      {inv.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{inv.num}</td>
                  <td className="px-4 py-3 text-right tabular-nums">₹{inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-3 text-text-secondary text-[12px]">{inv.date}</td>
                  <td className="px-4 py-3"><StatusPill status={inv.presentation.key} kind="presentation" /></td>
                  <td className="px-4 py-3">
                    <Popover items={[
                      { label: 'View', onClick: () => navigate(`/partner-promotions/invoice-management/${origIdx}`) },
                      ...(decision === 'pending' ? [
                        { label: 'Approve', success: true, onClick: () => setActionModal({ kind: 'approve', claimId: inv.claimId, num: inv.num }) },
                        { label: 'Reject',  danger: true,  onClick: () => setActionModal({ kind: 'reject',  claimId: inv.claimId, num: inv.num }) },
                      ] : []),
                    ]} />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-text-secondary text-sm">No claims match the current filter.</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-end gap-4 px-4 py-2 border-t border-border text-[13px] text-text-secondary">
          <span>Rows per page:</span>
          <select className="bg-[rgba(63,81,181,0.1)] border-none rounded px-2 py-1 text-primary font-medium"><option>10</option></select>
          <span>1-{filtered.length} of {filtered.length}</span>
          <div className="flex gap-1">
            <button className="border border-border rounded w-7 h-7 text-text-secondary cursor-pointer">&lsaquo;</button>
            <button className="border border-border rounded w-7 h-7 text-text-secondary cursor-pointer">&rsaquo;</button>
          </div>
        </div>
      </div>

      {workflowOpen && (
        <ApprovalWorkflow onClose={() => setWorkflowOpen(false)} />
      )}

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

function Dropdown({ value, options, open, onToggle, onPick, width = 'w-44' }) {
  return (
    <div className={`relative ${width}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 border border-border rounded-lg text-[13px] text-text bg-surface hover:border-text-secondary cursor-pointer"
      >
        <span>{value}</span>
        <ChevronDown size={14} className={`text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-surface border border-border rounded-lg shadow-lg z-20 overflow-hidden">
          {options.map(opt => (
            <button
              key={opt.key || opt.label}
              onClick={() => onPick(opt.key || opt.label)}
              className={`w-full text-left px-3 py-2 text-[13px] cursor-pointer transition-colors ${
                value === (opt.label || opt.key) ? 'bg-primary-light text-primary font-medium' : 'text-text hover:bg-bg'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
