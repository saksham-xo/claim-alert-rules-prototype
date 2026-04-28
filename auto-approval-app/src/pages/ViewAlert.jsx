import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '../data/store';
import { getGroups } from '../data/rules';

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

export default function ViewAlert() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { rules } = useStore();

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

      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
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
