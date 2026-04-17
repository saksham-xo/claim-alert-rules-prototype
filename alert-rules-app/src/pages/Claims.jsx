import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Search, X, Settings, Info, AlertTriangle } from 'lucide-react';
import { useStore } from '../data/store';
import { getGroups, evaluateGroups } from '../data/rules';
import PageHeader from '../components/shared/PageHeader';
import ActionCard from '../components/shared/ActionCard';
import StatusPill from '../components/shared/StatusPill';
import Popover from '../components/shared/Popover';
import ApprovalWorkflow from '../components/ApprovalWorkflow';
import ActionModal from '../components/ActionModal';

export default function Claims() {
  const navigate = useNavigate();
  const { rules, invoices, showToast } = useStore();
  const [tab, setTab] = useState('pending');
  const [workflowOpen, setWorkflowOpen] = useState(false);
  const [actionModal, setActionModal] = useState(null);

  const activeRules = rules.filter(r => r.on && !r.archived);
  const activeRuleIds = new Set(activeRules.map(r => r.id));

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

  // Compute dynamic alerts from active rules
  const computeAlerts = (inv) => {
    const hardcoded = inv.alerts.filter(a => a.system || activeRuleIds.has(a.ruleId));
    const hardcodedRuleIds = new Set(hardcoded.map(a => a.ruleId));

    const dynamic = activeRules
      .filter(r => !hardcodedRuleIds.has(r.id))
      .filter(r => evaluateGroups(inv, getGroups(r), evaluateCond))
      .map(r => ({ ruleId: r.id, ruleName: r.name, msg: r.desc }));

    return [...hardcoded, ...dynamic];
  };

  const activeAlerts = (inv) => computeAlerts(inv);

  const pending = invoices.filter(i => i.status === 'pending');
  const flagged = invoices.filter(i => activeAlerts(i).length > 0);
  const list = tab === 'pending' ? pending : tab === 'flagged' ? flagged : invoices;


  return (
    <div>
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
          className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg text-sm text-text-secondary hover:text-text hover:border-text-secondary cursor-pointer transition-colors"
        >
          <Settings size={16} />
          Settings
        </button>
      </div>

      <ActionCard
        title="Approval Workflow"
        subtitle={`${pending.length} invoices in queue`}
        buttonLabel="Start Approval"
        onButtonClick={() => setWorkflowOpen(true)}
      />

      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
        <div className="flex items-center border-b-2 border-border bg-bg px-4">
          {[
            { key: 'pending', label: `Pending Actions (${pending.length})` },
            { key: 'all', label: 'All Status', warning: true },
            { key: 'flagged', label: `Flagged (${flagged.length})`, red: true },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-3 text-xs font-semibold border-b-[4px] -mb-[2px] cursor-pointer transition-colors ${
                tab === t.key
                  ? `${t.red ? 'text-block border-block' : t.warning ? 'text-flag border-flag' : 'text-primary border-primary'} rounded-t`
                  : 'text-text-secondary border-transparent hover:text-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="relative mx-4 my-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#868CCC]" />
          <input type="text" placeholder="Search by Partner Name or Invoice Number" className="w-full pl-10 pr-10 py-2.5 border border-border rounded-lg text-[13px] text-text outline-none focus:border-primary placeholder:text-[#BDC5DA]" />
          <X size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary cursor-pointer" />
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border">Partner Name</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Claim ID</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Type</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Invoice Number</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Amount</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Claim Submitted On</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l relative">
                <div className="group inline-flex items-center gap-1 cursor-help">
                  <span>Confidence Score</span>
                  <Info size={12} className="text-text-secondary" />
                  <div className="absolute left-0 top-full mt-1 z-50 w-60 bg-text text-white text-[11px] rounded-md p-2 leading-snug opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-normal normal-case tracking-normal shadow-lg">
                    OCR confidence score is generated at the time the invoice is submitted. OCR runs once on upload — the score is stored permanently on the claim.
                  </div>
                </div>
              </th>
              {tab === 'all' && <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Status</th>}
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.map((inv, i) => {
              const origIdx = invoices.indexOf(inv);
              const invAlerts = activeAlerts(inv);
              return (
                <tr key={i} className="border-b border-border hover:bg-[#F5F5F5]">
                  <td className="px-4 py-3 font-medium relative">
                    <span className="inline-flex items-center gap-2">
                      {inv.partner || <span className="italic font-normal text-text-secondary">Missing</span>}
                      {!inv.partner && (
                        <span className="group relative inline-flex items-center">
                          <span className="relative flex h-2.5 w-2.5 shrink-0 cursor-help">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                          </span>
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 z-50 text-[10px] font-semibold text-primary bg-primary-light px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-sm">
                            Default alert example for the missing name claim
                          </span>
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{inv.claimId}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${inv.type === 'Claims' ? 'bg-[#E3F2FD] text-[#1565C0]' : 'bg-[#F3E5F5] text-[#7B1FA2]'}`}>
                      {inv.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">
                    <span className="inline-flex items-center gap-2">
                      {inv.num || <span className="italic text-text-secondary font-sans">Missing</span>}
                      {!inv.num && (
                        <span className="group relative inline-flex items-center">
                          <span className="relative flex h-2.5 w-2.5 shrink-0 cursor-help">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                          </span>
                          <span className="absolute left-5 top-1/2 -translate-y-1/2 z-50 text-[10px] font-semibold text-primary bg-primary-light px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-sm font-sans">
                            Configurable alert example
                          </span>
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-2">
                      <span>₹{inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                      {invAlerts.length > 0 && (
                        <AlertTriangle size={14} className="text-[#C62828]" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-text-secondary">{inv.date}</td>
                  <td className="px-4 py-3 text-text">
                    {inv.ocrConfidence != null ? `${inv.ocrConfidence}%` : '—'}
                  </td>
                  {tab === 'all' && <td className="px-4 py-3"><StatusPill status={inv.status} /></td>}
                  <td className="px-4 py-3">
                    <Popover items={[
                      { label: 'View', onClick: () => navigate(`/partner-promotions/invoice-management/${origIdx}`) },
                    ]} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="flex items-center justify-end gap-4 px-4 py-2 border-t border-border text-[13px] text-text-secondary">
          <span>Rows per page:</span>
          <select className="bg-[rgba(63,81,181,0.1)] border-none rounded px-2 py-1 text-primary font-medium"><option>10</option></select>
          <span>1-{list.length} of {list.length}</span>
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
          kind="approve"
          invoiceNum={actionModal.inv.num}
          onClose={() => setActionModal(null)}
          onConfirm={() => {
            showToast(`${actionModal.inv.num} approved`);
            setActionModal(null);
          }}
        />
      )}
    </div>
  );
}
