import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Info } from 'lucide-react';
import { useStore } from '../data/store';
import { getGroups, evaluateGroups, isGroupsComplete } from '../data/rules';
import ConditionBuilder from '../components/shared/ConditionBuilder';

const numericOps = [
  { v: 'equals', l: '=' },
  { v: 'not_equals', l: '!=' },
  { v: 'gt', l: '>' },
  { v: 'gte', l: '>=' },
  { v: 'lt', l: '<' },
  { v: 'lte', l: '<=' },
];

const stringOps = [
  { v: 'equals', l: 'Equals' },
  { v: 'contains', l: 'Contains' },
  { v: 'not_contains', l: "Doesn't contain" },
  { v: 'is_empty', l: 'Is empty' },
  { v: 'is_not_empty', l: 'Is not empty' },
];

const fieldDefs = [
  { group: 'GLOBAL ATTRIBUTES', fields: [
    { v: 'totalAmount', l: 'Invoice Amount', numeric: true, ops: numericOps },
    { v: 'invoiceNo', l: 'Invoice Number', ops: stringOps },
  ]},
  { group: 'MEMBER ATTRIBUTES', fields: [
    { v: 'memberRelationRef', l: 'Relation Reference', ops: stringOps },
    { v: 'memberFullName', l: 'Full Name', ops: stringOps },
    { v: 'memberEmail', l: 'Email', ops: stringOps },
    { v: 'memberPhone', l: 'Phone', ops: stringOps },
    { v: 'memberAddress', l: 'Address', ops: stringOps },
    { v: 'memberGender', l: 'Gender', ops: stringOps },
    { v: 'memberDob', l: 'Date of Birth', ops: stringOps },
    { v: 'memberStatus', l: 'Status', ops: stringOps },
    { v: 'memberPreferredLang', l: 'Preferred Language', ops: stringOps },
    { v: 'taggedStockist', l: 'Tagged Stockist', needsTagging: true, ops: [{ v: 'matches', l: 'Matches for the Retailer' }, { v: 'does_not_match', l: 'Does Not Match for the Retailer' }] },
  ]},
];

const noValueOps = ['is_empty', 'is_not_empty', 'matches', 'does_not_match'];

function num(v) {
  return parseFloat((v || '').toString().replace(/,/g, '')) || 0;
}

function evaluateCond(inv, c) {
  const v = num(c.val);
  if (c.f === 'totalAmount') {
    if (c.op === 'equals') return inv.amount === v;
    if (c.op === 'not_equals') return inv.amount !== v;
    if (c.op === 'gt') return inv.amount > v;
    if (c.op === 'lt') return inv.amount < v;
    if (c.op === 'gte') return inv.amount >= v;
    if (c.op === 'lte') return inv.amount <= v;
  }
  if (c.f === 'invoiceNo') {
    const s = (inv.num || '');
    if (c.op === 'equals') return s === c.val;
    if (c.op === 'not_equals') return s !== c.val;
    if (c.op === 'contains') return s.includes(c.val);
    if (c.op === 'not_contains') return !s.includes(c.val);
  }
  return false;
}

function matchInvoices(invoices, groups, minScanQuality) {
  const complete = isGroupsComplete(groups, noValueOps);
  const gate = minScanQuality !== '' && minScanQuality !== undefined && minScanQuality !== null;
  const gateVal = num(minScanQuality);
  if (!complete && !gate) return [];

  return invoices.filter(inv => {
    if (inv.status !== 'pending') return false;
    if (gate && (inv.ocrConfidence ?? 0) < gateVal) return false;
    if (!complete) return gate;
    return evaluateGroups(inv, groups, evaluateCond);
  });
}

function DonutChart({ matched, total }) {
  const pct = total > 0 ? (matched / total) * 100 : 0;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="flex flex-col items-center">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#E3EBF6" strokeWidth="8" />
        <circle cx="48" cy="48" r={r} fill="none" stroke="#4CAF50" strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 48 48)"
          className="transition-all duration-500"
        />
        <text x="48" y="44" textAnchor="middle" className="text-lg font-bold" fill="#303E67">{matched}</text>
        <text x="48" y="58" textAnchor="middle" className="text-[10px]" fill="#868CCC">of {total}</text>
      </svg>
      <span className="text-[11px] text-text-secondary mt-1">would auto-approve</span>
    </div>
  );
}

function PreviewPanel({ matched, pendingInvoices, previousMatchIds, newlyMatchedCount, noLongerMatchedCount }) {
  return (
    <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-text">Preview — Matching Claims</h2>
        <p className="text-xs text-text-secondary mt-0.5">
          Pending claims that would auto-approve with these changes. Already-approved claims are not re-evaluated.
        </p>
        {(newlyMatchedCount > 0 || noLongerMatchedCount > 0) && (
          <div className="flex items-center gap-3 mt-2 text-[11px]">
            {newlyMatchedCount > 0 && (
              <span className="text-success font-medium">+{newlyMatchedCount} newly matching</span>
            )}
            {noLongerMatchedCount > 0 && (
              <span className="text-text-secondary">−{noLongerMatchedCount} no longer matching</span>
            )}
          </div>
        )}
      </div>
      <div className="px-6 py-5">
        <div className="flex gap-6">
          <DonutChart matched={matched.length} total={pendingInvoices.length} />
          <div className="flex-1 min-w-0">
            {matched.length === 0 ? (
              <div className="text-sm text-text-secondary py-4">No pending claims match these conditions.</div>
            ) : (
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className="text-left text-[11px] font-semibold text-text-secondary py-2 border-b border-border">Invoice #</th>
                    <th className="text-left text-[11px] font-semibold text-text-secondary py-2 border-b border-border pl-3">Partner</th>
                    <th className="text-right text-[11px] font-semibold text-text-secondary py-2 border-b border-border pl-3">Amount</th>
                    <th className="text-right text-[11px] font-semibold text-text-secondary py-2 border-b border-border pl-3">Confidence Score</th>
                  </tr>
                </thead>
                <tbody>
                  {matched.map((inv, i) => {
                    const isNew = previousMatchIds && !previousMatchIds.has(inv.claimId);
                    return (
                      <tr key={i} className="border-b border-border hover:bg-[#F5F5F5]">
                        <td className="py-2 font-mono text-xs text-primary">
                          <span className="inline-flex items-center gap-1.5">
                            {inv.num || <span className="italic text-text-secondary font-sans">Missing</span>}
                            {isNew && (
                              <span className="text-[9px] font-bold uppercase tracking-wide text-success bg-[#E8F5E9] px-1.5 py-0.5 rounded">New</span>
                            )}
                          </span>
                        </td>
                        <td className="py-2 pl-3 text-text">{inv.partner}</td>
                        <td className="py-2 pl-3 text-right font-medium">₹{inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="py-2 pl-3 text-right text-text-secondary">{inv.ocrConfidence != null ? `${inv.ocrConfidence}%` : '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function EditApproveRule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { invoices, approveRules, saveApproveRule, showToast } = useStore();

  const rule = approveRules.find(r => r.id === id);

  const [name, setName] = useState(rule?.name || '');
  const [desc, setDesc] = useState(rule?.desc || '');
  const [groups, setGroups] = useState(rule ? getGroups(rule).map(g => g.map(c => ({ ...c }))) : [[{ f: '', op: '', val: '' }]]);
  const [minScanQuality, setMinScanQuality] = useState(rule?.minScanQuality ?? '');

  if (!rule) {
    return (
      <div className="text-center py-20 text-text-secondary">
        <p className="text-lg font-medium mb-2">Rule not found</p>
        <button onClick={() => navigate('/partner-promotions/invoice-management/settings?tab=auto-approval')} className="text-primary text-sm font-medium hover:underline cursor-pointer">
          Back to Claims Settings
        </button>
      </div>
    );
  }

  const scanQualityInvalid = minScanQuality !== '' && (num(minScanQuality) < 0 || num(minScanQuality) > 100);
  const groupsReady = isGroupsComplete(groups, noValueOps);
  const matched = matchInvoices(invoices, groups, minScanQuality);
  const previousMatched = matchInvoices(invoices, getGroups(rule), rule.minScanQuality);
  const previousMatchIds = new Set(previousMatched.map(i => i.claimId));
  const currentMatchIds = new Set(matched.map(i => i.claimId));
  const newlyMatchedCount = matched.filter(i => !previousMatchIds.has(i.claimId)).length;
  const noLongerMatchedCount = previousMatched.filter(i => !currentMatchIds.has(i.claimId)).length;
  const pendingInvoices = invoices.filter(i => i.status === 'pending');

  const handleSave = () => {
    if (!name.trim()) { showToast('Rule name is required'); return; }
    if (!desc.trim()) { showToast('Description is required'); return; }
    if (!groupsReady) { showToast('Complete all conditions'); return; }
    if (scanQualityInvalid) { showToast('Scan quality must be between 0 and 100'); return; }
    saveApproveRule({
      ...rule,
      name: name.trim(),
      desc: desc.trim(),
      groups,
      minScanQuality: typeof minScanQuality === 'string' ? minScanQuality.trim() : minScanQuality,
    });
    showToast(`"${name.trim()}" updated`);
    navigate(`/partner-promotions/invoice-management/settings/approve/${rule.id}`);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/partner-promotions/invoice-management/settings/approve/${rule.id}`)} className="hover:bg-bg rounded-lg p-2 cursor-pointer transition-colors">
          <ChevronLeft size={20} className="text-text" />
        </button>
        <h1 className="text-lg font-bold text-text">Edit Approval Rule</h1>
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${rule.on ? 'bg-[#E8F5E9] text-success' : 'bg-[#F5F5F5] text-text-secondary'}`}>
          {rule.on ? 'Active' : 'Inactive'}
        </span>
        <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded">Priority {rule.priority}</span>
      </div>

      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] mb-5">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Rule Details</h2>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Rule Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-text outline-none focus:border-primary"
              placeholder="e.g. Low Value — Approved Stockist"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Description *</label>
            <textarea
              rows={2}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-[13px] text-text outline-none resize-y focus:border-primary"
              placeholder="Describe when this rule applies"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Rule ID</label>
            <input
              type="text"
              value={rule.id}
              readOnly
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-text-secondary bg-bg font-mono"
            />
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] mb-5 px-6 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          <label className="text-sm font-semibold text-text whitespace-nowrap">
            Minimum Confidence Score <span className="text-text-secondary font-normal">(≥)</span>
          </label>
          <div className="relative w-[140px]">
            <input
              type="number"
              min="0"
              max="100"
              value={minScanQuality}
              onChange={e => setMinScanQuality(e.target.value)}
              className={`w-full px-3 py-2 pr-8 border rounded-lg text-sm text-text outline-none focus:border-primary ${scanQualityInvalid ? 'border-block' : 'border-border'}`}
              placeholder="e.g. 80"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm pointer-events-none">%</span>
          </div>
          <div className="text-[12px] text-text-secondary flex items-center gap-1.5 flex-1 min-w-[200px]">
            <Info size={13} className="shrink-0" />
            <span>Only auto-approve claims scored at or above this value.</span>
          </div>
        </div>
        {scanQualityInvalid && (
          <div className="mt-2 text-xs text-block">Value must be between 0 and 100.</div>
        )}
      </div>

      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] mb-5">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Conditions <span className="text-block">*</span></h2>
        </div>
        <div className="px-6 py-5">
          <ConditionBuilder
            groups={groups}
            onChange={setGroups}
            fieldDefs={fieldDefs}
            noValueOps={noValueOps}
          />
          <div className="mt-4 bg-bg/40 border border-border rounded-lg p-4">
            <div className="mb-2">
              <span className="inline-block text-[11px] font-semibold text-success bg-[#E8F5E9] px-2.5 py-1 rounded-full">THEN</span>
            </div>
            <div className="text-sm text-text">
              Invoice claim will be <span className="font-semibold text-success">auto-approved instantly</span>.
            </div>
          </div>
        </div>
      </div>

      {(groupsReady || minScanQuality !== '') && !scanQualityInvalid && (
        <div className="mb-5">
          <PreviewPanel
            matched={matched}
            pendingInvoices={pendingInvoices}
            previousMatchIds={previousMatchIds}
            newlyMatchedCount={newlyMatchedCount}
            noLongerMatchedCount={noLongerMatchedCount}
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/partner-promotions/invoice-management/settings/approve/${rule.id}`)}
          className="px-5 py-2 border border-border rounded text-sm font-medium text-text hover:bg-bg cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="bg-primary text-white px-5 py-2 rounded text-sm font-medium hover:bg-[#354499] transition-colors cursor-pointer"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
