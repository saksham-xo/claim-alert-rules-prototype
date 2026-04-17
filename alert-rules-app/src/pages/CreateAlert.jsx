import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Check } from 'lucide-react';
import { useStore } from '../data/store';
import { emptyGroups, evaluateGroups, isGroupsComplete } from '../data/rules';
import ConditionBuilder from '../components/shared/ConditionBuilder';

// Standard operator sets — mirrored from the Loyalife Rule Engine so rule logic is portable.
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

const booleanOps = [
  { v: 'is_true', l: 'Yes' },
  { v: 'is_false', l: 'No' },
];

const fieldDefs = [
  { group: 'GLOBAL ATTRIBUTES', fields: [
    { v: 'totalAmount', l: 'Invoice Amount', numeric: true, ops: numericOps },
    { v: 'invoiceNo', l: 'Invoice Number', ops: stringOps },
    { v: 'lineItemsMismatch', l: 'Line Items Total Mismatch', ops: booleanOps },
    { v: 'invoiceAge', l: 'Invoice Age (days)', numeric: true, ops: numericOps },
    { v: 'ocrConfidence', l: 'Confidence Score (%)', numeric: true, ops: numericOps },
    { v: 'ocrAmountMatch', l: 'Scanned Amount Matches Entered', ops: booleanOps },
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
  ]},
];

const flatFields = fieldDefs.flatMap(g => g.fields);

const noValueOps = ['is_empty', 'is_not_empty', 'is_true', 'is_false'];

const steps = [
  { num: 1, label: 'Set Conditions' },
  { num: 2, label: 'Alert Details' },
  { num: 3, label: 'Review & Save' },
];

function fieldLabel(key) {
  return flatFields.find(f => f.v === key)?.l || key;
}
function opLabel(fieldKey, op) {
  const fd = flatFields.find(f => f.v === fieldKey);
  return fd?.ops.find(o => o.v === op)?.l || op;
}

function evaluateCond(inv, invoices, c) {
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
    if (c.op === 'lt') return days < val;
    if (c.op === 'lte') return days <= val;
  }
  return false;
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
        <circle cx="48" cy="48" r={r} fill="none" stroke="#3F51B5" strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 48 48)"
          className="transition-all duration-500"
        />
        <text x="48" y="44" textAnchor="middle" className="text-lg font-bold" fill="#303E67">{matched}</text>
        <text x="48" y="58" textAnchor="middle" className="text-[10px]" fill="#868CCC">of {total}</text>
      </svg>
      <span className="text-[11px] text-text-secondary mt-1">invoices match</span>
    </div>
  );
}

export default function CreateAlert() {
  const navigate = useNavigate();
  const { rules, invoices, saveRule, showToast } = useStore();

  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [groups, setGroups] = useState(emptyGroups());
  const [enabled, setEnabled] = useState(true);

  const groupsReady = isGroupsComplete(groups, noValueOps);
  const matched = groupsReady
    ? invoices.filter(inv => evaluateGroups(inv, groups, (i, c) => evaluateCond(i, invoices, c)))
    : [];

  const canGoStep2 = groupsReady;
  const isDuplicateName = name.trim().length > 0 && rules.some(r => r.name.toLowerCase() === name.trim().toLowerCase());
  const canGoStep3 = name.trim().length > 0 && !isDuplicateName && desc.trim().length > 0;

  const handleSave = () => {
    saveRule({
      name: name.trim(),
      desc: desc.trim(),
      behavior: 'flag',
      groups,
      acts: ['flag_invoice'],
      on: enabled,
      by: 'Admin',
      at: '15 Apr, 2026',
    });
    showToast(`"${name.trim()}" created`);
    navigate('/partner-promotions/invoice-management/settings');
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/partner-promotions/invoice-management/settings')} className="hover:bg-bg rounded-lg p-2 cursor-pointer transition-colors">
          <ChevronLeft size={20} className="text-text" />
        </button>
        <h1 className="text-lg font-bold text-text">Create Alert</h1>
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
          <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-text">Set Alert Conditions</h2>
            </div>
            <div className="px-6 py-5">
              <ConditionBuilder
                groups={groups}
                onChange={setGroups}
                fieldDefs={fieldDefs}
                noValueOps={noValueOps}
              />
            </div>
          </div>

          {groupsReady && (
            <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
              <div className="px-6 py-4 border-b border-border">
                <h2 className="text-sm font-semibold text-text">Preview — Matching Invoices</h2>
              </div>
              <div className="px-6 py-5">
                <div className="flex gap-6">
                  <DonutChart matched={matched.length} total={invoices.length} />
                  <div className="flex-1 min-w-0">
                    {matched.length === 0 ? (
                      <div className="text-sm text-text-secondary py-4">No existing invoices match these conditions.</div>
                    ) : (
                      <table className="w-full border-collapse text-[13px]">
                        <thead>
                          <tr>
                            <th className="text-left text-[11px] font-semibold text-text-secondary py-2 border-b border-border">Invoice #</th>
                            <th className="text-left text-[11px] font-semibold text-text-secondary py-2 border-b border-border pl-3">Partner</th>
                            <th className="text-right text-[11px] font-semibold text-text-secondary py-2 border-b border-border pl-3">Amount</th>
                            <th className="text-left text-[11px] font-semibold text-text-secondary py-2 border-b border-border pl-3">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matched.map((inv, i) => (
                            <tr key={i} className="border-b border-border hover:bg-[#F5F5F5]">
                              <td className="py-2 font-mono text-xs text-primary">{inv.num || <span className="italic text-text-secondary font-sans">Missing</span>}</td>
                              <td className="py-2 pl-3 text-text">{inv.partner}</td>
                              <td className="py-2 pl-3 text-right font-medium">₹{inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                              <td className="py-2 pl-3 text-text-secondary text-xs">{inv.date}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/partner-promotions/invoice-management/settings')} className="px-5 py-2 border border-border rounded text-sm font-medium text-text hover:bg-bg cursor-pointer">
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
              <h2 className="text-sm font-semibold text-text">Alert Details</h2>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1.5 block">Alert Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className={`w-full px-3 py-2.5 border rounded-lg text-sm text-text outline-none focus:border-primary ${isDuplicateName ? 'border-block' : 'border-border'}`}
                  placeholder="e.g. High Value Invoice"
                />
                {isDuplicateName && (
                  <div className="text-xs text-block mt-1">An alert with this name already exists.</div>
                )}
              </div>
              <div>
                <label className="text-xs font-medium text-text-secondary mb-1.5 block">Description *</label>
                <textarea
                  rows={2}
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-lg text-[13px] text-text outline-none resize-y focus:border-primary"
                  placeholder="Describe what this alert checks"
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
                  <div className="text-[11px] font-semibold uppercase text-text-secondary tracking-wider mb-1">Alert Name</div>
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
                <div className="text-[11px] font-semibold uppercase text-text-secondary tracking-wider mb-2">Conditions</div>
                <GroupsReview groups={groups} />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <label className="relative inline-block w-9 h-5 cursor-pointer">
                  <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="sr-only peer" />
                  <span className="absolute inset-0 bg-gray-300 rounded-full transition-colors peer-checked:bg-success" />
                  <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                </label>
                <span className="text-[13px] text-text">Activate alert immediately</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={() => setStep(2)} className="px-5 py-2 border border-border rounded text-sm font-medium text-text hover:bg-bg cursor-pointer">Back</button>
            <button
              onClick={handleSave}
              className="bg-primary text-white px-5 py-2 rounded text-sm font-medium hover:bg-[#354499] transition-colors cursor-pointer"
            >
              Save Alert
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
