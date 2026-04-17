import { useParams, useNavigate } from 'react-router-dom';
import { Shield, ChevronLeft } from 'lucide-react';
import { useStore } from '../data/store';
import { getGroups, evaluateGroups } from '../data/rules';

const fieldMeta = {
  totalAmount: { l: 'Invoice Amount', type: 'numeric' },
  invoiceNo: { l: 'Invoice Number', type: 'string' },
  lineItemsMismatch: { l: 'Line Items Total Mismatch', type: 'boolean' },
  ocrAmountMatch: { l: 'Scanned Amount Matches Entered', type: 'boolean' },
  ocrConfidence: { l: 'Confidence Score (%)', type: 'numeric' },
  invoiceAge: { l: 'Invoice Age (days)', type: 'numeric' },
  memberRelationRef: { l: 'Relation Reference', type: 'string' },
  memberFullName: { l: 'Full Name', type: 'string' },
  memberEmail: { l: 'Email', type: 'string' },
  memberPhone: { l: 'Phone', type: 'string' },
  memberAddress: { l: 'Address', type: 'string' },
  memberGender: { l: 'Gender', type: 'string' },
  memberDob: { l: 'Date of Birth', type: 'string' },
  memberStatus: { l: 'Status', type: 'string' },
  memberPreferredLang: { l: 'Preferred Language', type: 'string' },
};

const numericOpLabels = {
  equals: '=', not_equals: '!=', gt: '>', gte: '>=', lt: '<', lte: '<=',
};
const stringOpLabels = {
  equals: 'Equals', contains: 'Contains', not_contains: "Doesn't contain",
  is_empty: 'Is empty', is_not_empty: 'Is not empty',
};
const booleanOpLabels = { is_true: 'Yes', is_false: 'No' };

function fieldLabel(key) { return fieldMeta[key]?.l || key; }
function opLabel(fieldKey, op) {
  const type = fieldMeta[fieldKey]?.type;
  if (type === 'numeric') return numericOpLabels[op] || op;
  if (type === 'string') return stringOpLabels[op] || op;
  if (type === 'boolean') return booleanOpLabels[op] || op;
  return op;
}

function evaluateCondFor(inv, c, invoices) {
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
    if (c.op === 'is_duplicate') return invoices.filter(o => o.num === inv.num).length > 1;
    if (c.op === 'equals') return inv.num === c.val;
    if (c.op === 'not_equals') return inv.num !== c.val;
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
      <span className="text-[11px] text-text-secondary mt-1">invoices flagged</span>
    </div>
  );
}

export default function ViewAlert() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { rules, invoices, devNotes } = useStore();

  const rule = rules.find(r => r.id === id);

  if (!rule) {
    return (
      <div className="text-center py-20 text-text-secondary">
        <p className="text-lg font-medium mb-2">Alert not found</p>
        <button onClick={() => navigate('/partner-promotions/invoice-management/settings')} className="text-primary text-sm font-medium hover:underline cursor-pointer">
          Back to Alerts
        </button>
      </div>
    );
  }

  const groups = getGroups(rule);
  const matched = invoices.filter(inv => evaluateGroups(inv, groups, (i, c) => evaluateCondFor(i, c, invoices)));

  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-4">
        <button onClick={() => navigate('/partner-promotions/invoice-management/settings')} className="hover:text-primary cursor-pointer flex items-center gap-1">
          <ChevronLeft size={14} />
          Claims Settings
        </button>
        <span className="text-text-secondary">/</span>
        <button onClick={() => navigate('/partner-promotions/invoice-management/settings?tab=alerts')} className="hover:text-primary cursor-pointer">
          Alerts
        </button>
        <span className="text-text-secondary">/</span>
        <span className="text-text font-medium">{rule.name}</span>
      </div>

      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-4 px-6 flex items-center gap-4 mb-6 min-h-[86px]">
        <div className="w-[52px] h-[52px] bg-primary-light rounded-lg flex items-center justify-center shrink-0">
          <Shield size={28} className="text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-text">{rule.name}</h1>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
              rule.on
                ? 'bg-[#E8F5E9] text-success'
                : 'bg-[#F5F5F5] text-text-secondary'
            }`}>
              {rule.on ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-sm text-text-secondary mt-0.5 tracking-wide">{rule.desc}</p>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] mb-5">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Conditions</h2>
        </div>
        <div className="px-6 py-5">
          {groups && groups.length > 0 && groups[0].length > 0 ? (
            <GroupsDisplay groups={groups} />
          ) : (
            <div className="text-sm text-text-secondary">No conditions configured</div>
          )}
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-text">Flagged Invoices ({matched.length})</h2>
            {devNotes && (
              <span className="text-[10px] bg-[#E8F5E9] border border-[#A5D6A7] text-[#1B5E20] px-2 py-0.5 rounded">
                <span className="font-semibold text-[#2E7D32]">Dev:</span> Live data — updates as invoices are added or rules change. Rows clickable → invoice detail.
              </span>
            )}
          </div>
        </div>
        <div className="px-6 py-5">
          <div className="flex gap-6">
            <DonutChart matched={matched.length} total={invoices.length} />
            <div className="flex-1 min-w-0">
              {matched.length === 0 ? (
                <div className="text-sm text-text-secondary py-4">No invoices match this alert's conditions.</div>
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
                    {matched.map((inv, i) => {
                      const origIdx = invoices.indexOf(inv);
                      return (
                        <tr key={i} className="border-b border-border hover:bg-[#F5F5F5] cursor-pointer" onClick={() => navigate(`/partner-promotions/invoice-management/${origIdx}`)}>
                          <td className="py-2 font-mono text-xs text-primary">{inv.num || <span className="italic text-text-secondary font-sans">Missing</span>}</td>
                          <td className="py-2 pl-3 text-text">{inv.partner}</td>
                          <td className="py-2 pl-3 text-right font-medium">₹{inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="py-2 pl-3 text-text-secondary text-xs">{inv.date}</td>
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
    </div>
  );
}

function GroupsDisplay({ groups }) {
  return (
    <div className="flex flex-col gap-2">
      {groups.map((grp, gi) => (
        <div key={gi}>
          {gi > 0 && (
            <div className="my-2">
              <span className="inline-block text-[11px] font-semibold text-[#7C3AED] bg-[#F3E8FF] px-2.5 py-1 rounded-full">OR</span>
            </div>
          )}
          <div className="bg-[#F8F9FF] border border-border rounded-lg p-4">
            <div className="flex flex-col gap-2">
              {grp.map((c, ci) => (
                <div key={ci}>
                  {ci > 0 && (
                    <div className="my-1.5">
                      <span className="inline-block text-[11px] font-semibold text-success bg-[#E8F5E9] px-2.5 py-1 rounded-full">AND</span>
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
