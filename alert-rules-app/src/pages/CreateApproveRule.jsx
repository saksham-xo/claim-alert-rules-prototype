import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check, Info } from 'lucide-react';
import { useStore } from '../data/store';
import { emptyGroups, evaluateGroups, isGroupsComplete } from '../data/rules';
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

const flatFields = fieldDefs.flatMap(g => g.fields);

const noValueOps = ['is_empty', 'is_not_empty', 'matches', 'does_not_match'];

const steps = [
  { num: 1, label: 'Set Conditions' },
  { num: 2, label: 'Rule Details' },
  { num: 3, label: 'Review & Save' },
];

function fieldLabel(key) {
  return flatFields.find(f => f.v === key)?.l || key;
}
function opLabel(fieldKey, op) {
  const fd = flatFields.find(f => f.v === fieldKey);
  return fd?.ops.find(o => o.v === op)?.l || op;
}

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
  // taggedStockist — no mock tag data; live system evaluates against program config
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

function PreviewPanel({ matched, invoices }) {
  return (
    <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
      <div className="px-6 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-text">Preview — Matching Claims</h2>
        <p className="text-xs text-text-secondary mt-0.5">Existing pending claims that would be auto-approved by this rule</p>
      </div>
      <div className="px-6 py-5">
        <div className="flex gap-6">
          <DonutChart matched={matched.length} total={invoices.length} />
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
                  {matched.map((inv, i) => (
                    <tr key={i} className="border-b border-border hover:bg-[#F5F5F5]">
                      <td className="py-2 font-mono text-xs text-primary">{inv.num || <span className="italic text-text-secondary font-sans">Missing</span>}</td>
                      <td className="py-2 pl-3 text-text">{inv.partner}</td>
                      <td className="py-2 pl-3 text-right font-medium">₹{inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      <td className="py-2 pl-3 text-right text-text-secondary">{inv.ocrConfidence != null ? `${inv.ocrConfidence}%` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateApproveRule() {
  const navigate = useNavigate();
  const { invoices, showToast, saveApproveRule } = useStore();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [groups, setGroups] = useState(emptyGroups());
  const [minScanQuality, setMinScanQuality] = useState('');
  const [enabled, setEnabled] = useState(true);

  const scanQualityInvalid = minScanQuality !== '' && (num(minScanQuality) < 0 || num(minScanQuality) > 100);
  const groupsReady = isGroupsComplete(groups, noValueOps);
  const matched = matchInvoices(invoices.filter(i => i.status === 'pending'), groups, minScanQuality);
  const pendingInvoices = invoices.filter(i => i.status === 'pending');

  const canGoStep2 = groupsReady && !scanQualityInvalid;
  const canGoStep3 = name.trim().length > 0 && desc.trim().length > 0;

  const handleSave = () => {
    if (scanQualityInvalid) {
      showToast('Scan quality must be between 0 and 100');
      return;
    }
    saveApproveRule({
      name: name.trim(),
      desc: desc.trim(),
      groups,
      minScanQuality: minScanQuality.trim?.() ?? minScanQuality,
      on: enabled,
    });
    showToast(`"${name.trim()}" created`);
    navigate('/partner-promotions/invoice-management/settings?tab=auto-approval');
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/partner-promotions/invoice-management/settings?tab=auto-approval')} className="hover:bg-bg rounded-lg p-2 cursor-pointer transition-colors">
          <ChevronLeft size={20} className="text-text" />
        </button>
        <h1 className="text-lg font-bold text-text">Add Approval Rule</h1>
      </div>

      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] px-6 py-4 mb-6">
        <div className="flex items-center">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center flex-1 last:flex-initial">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s.num < step ? 'bg-success text-white'
                    : s.num === step ? 'bg-primary text-white'
                    : 'bg-bg text-text-secondary border border-border'
                }`}>
                  {s.num < step ? <Check size={14} /> : s.num}
                </div>
                <span className={`text-xs font-semibold whitespace-nowrap ${
                  s.num === step ? 'text-primary' : s.num < step ? 'text-success' : 'text-text-secondary'
                }`}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-[2px] mx-4 rounded ${s.num < step ? 'bg-success' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] px-6 py-4">
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

          <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-text">Set Auto-Approval Conditions <span className="text-block">*</span></h2>
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
            <PreviewPanel matched={matched} invoices={pendingInvoices} />
          )}

          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/partner-promotions/invoice-management/settings?tab=auto-approval')} className="px-5 py-2 border border-border rounded text-sm font-medium text-text hover:bg-bg cursor-pointer">
              Cancel
            </button>
            <button
              onClick={() => canGoStep2 && setStep(2)}
              disabled={!canGoStep2}
              className={`px-5 py-2 rounded text-sm font-medium transition-colors ${canGoStep2 ? 'bg-primary text-white hover:bg-[#354499] cursor-pointer' : 'bg-[#93c5fd] text-white cursor-not-allowed'}`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
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
            </div>
          </div>
          <div className="flex items-center justify-between">
            <button onClick={() => setStep(1)} className="px-5 py-2 border border-border rounded text-sm font-medium text-text hover:bg-bg cursor-pointer">Back</button>
            <button
              onClick={() => canGoStep3 && setStep(3)}
              disabled={!canGoStep3}
              className={`px-5 py-2 rounded text-sm font-medium transition-colors ${canGoStep3 ? 'bg-primary text-white hover:bg-[#354499] cursor-pointer' : 'bg-[#93c5fd] text-white cursor-not-allowed'}`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-text">Review</h2>
            </div>
            <div className="px-6 py-5 flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase text-text-secondary tracking-wider mb-1">Rule Name</div>
                  <div className="text-sm font-medium text-text">{name}</div>
                </div>
                {desc && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase text-text-secondary tracking-wider mb-1">Description</div>
                    <div className="text-sm text-text">{desc}</div>
                  </div>
                )}
              </div>

              <div>
                <div className="text-[11px] font-semibold uppercase text-text-secondary tracking-wider mb-1">Minimum Confidence Score (≥)</div>
                {minScanQuality ? (
                  <div className="text-sm font-medium text-text">{minScanQuality}%</div>
                ) : (
                  <div className="text-sm text-text-secondary">Not set — no OCR gate</div>
                )}
              </div>

              <div>
                <div className="text-[11px] font-semibold uppercase text-text-secondary tracking-wider mb-2">Conditions</div>
                <GroupsReview groups={groups} />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <label className="relative inline-block w-9 h-5 cursor-pointer">
                  <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="sr-only peer" />
                  <span className="absolute inset-0 bg-gray-300 rounded-full transition-colors peer-checked:bg-success" />
                  <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                </label>
                <span className="text-[13px] text-text">Activate rule immediately</span>
              </div>
            </div>
          </div>

          <PreviewPanel matched={matched} invoices={pendingInvoices} />

          <div className="flex items-center justify-between">
            <button onClick={() => setStep(2)} className="px-5 py-2 border border-border rounded text-sm font-medium text-text hover:bg-bg cursor-pointer">Back</button>
            <button
              onClick={handleSave}
              className="bg-primary text-white px-5 py-2 rounded text-sm font-medium hover:bg-[#354499] transition-colors cursor-pointer"
            >
              Save Rule
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupsReview({ groups }) {
  return (
    <div className="flex flex-col gap-2">
      {groups.map((grp, gi) => (
        <div key={gi}>
          {gi > 0 && (
            <div className="my-1">
              <span className="inline-block text-[10px] font-semibold text-[#7C3AED] bg-[#F3E8FF] px-2 py-0.5 rounded-full">OR</span>
            </div>
          )}
          <div className="bg-[#F8F9FF] border border-border rounded-lg p-3">
            <div className="mb-1.5">
              <span className="inline-block text-[10px] font-semibold text-[#F59E0B] bg-[#FEF3C7] px-2 py-0.5 rounded-full">IF</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {grp.map((c, ci) => (
                <div key={ci}>
                  {ci > 0 && (
                    <div className="my-1">
                      <span className="inline-block text-[10px] font-semibold text-success bg-[#E8F5E9] px-2 py-0.5 rounded-full">AND</span>
                    </div>
                  )}
                  <div className="text-sm text-text">
                    <span className="font-medium">{fieldLabel(c.f)}</span>{' '}
                    <span className="text-text-secondary">{opLabel(c.f, c.op)}</span>
                    {c.val && <span className="font-semibold text-primary ml-1">{c.val}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
