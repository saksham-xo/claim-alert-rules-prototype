import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '../data/store';
import { getGroups } from '../data/rules';

const fieldMeta = {
  totalAmount: { l: 'Invoice Amount', type: 'numeric' },
  invoiceNo: { l: 'Invoice Number', type: 'string' },
  invoiceAge: { l: 'Invoice Age (days)', type: 'numeric' },
  ocrConfidence: { l: 'Confidence Score (%)', type: 'numeric' },
  memberRelationRef: { l: 'Relation Reference', type: 'string' },
  memberFullName: { l: 'Full Name', type: 'string' },
  memberEmail: { l: 'Email', type: 'string' },
  memberPhone: { l: 'Phone', type: 'string' },
  memberAddress: { l: 'Address', type: 'string' },
  memberGender: { l: 'Gender', type: 'string' },
  memberDob: { l: 'Date of Birth', type: 'string' },
  memberStatus: { l: 'Status', type: 'string' },
  memberPreferredLang: { l: 'Preferred Language', type: 'string' },
  taggedStockist: { l: 'Tagged Stockist', type: 'tagged' },
};

const numericOpLabels = { equals: '=', not_equals: '!=', gt: '>', gte: '>=', lt: '<', lte: '<=' };
const stringOpLabels = {
  equals: 'Equals', contains: 'Contains', not_contains: "Doesn't contain",
  is_empty: 'Is empty', is_not_empty: 'Is not empty',
};
const taggedOpLabels = { matches: 'Matches for the Retailer', does_not_match: 'Does Not Match for the Retailer' };

function fieldLabel(key) { return fieldMeta[key]?.l || key; }
function opLabel(fieldKey, op) {
  const type = fieldMeta[fieldKey]?.type;
  if (type === 'numeric') return numericOpLabels[op] || op;
  if (type === 'string') return stringOpLabels[op] || op;
  if (type === 'tagged') return taggedOpLabels[op] || op;
  return op;
}

export default function ViewApproveRule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { approveRules } = useStore();

  const rule = approveRules.find(r => r.id === id);

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

  const groups = getGroups(rule);

  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-text-secondary mb-4">
        <button onClick={() => navigate('/partner-promotions/invoice-management/settings')} className="hover:text-primary cursor-pointer flex items-center gap-1">
          <ChevronLeft size={14} />
          Claims Settings
        </button>
        <span className="text-text-secondary">/</span>
        <button onClick={() => navigate('/partner-promotions/invoice-management/settings?tab=auto-approval')} className="hover:text-primary cursor-pointer">
          Auto-Approval
        </button>
        <span className="text-text-secondary">/</span>
        <span className="text-text font-medium">{rule.name}</span>
      </div>

      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-4 px-6 flex items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-semibold text-text">{rule.name}</h1>
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
              rule.on ? 'bg-[#E8F5E9] text-success' : 'bg-[#F5F5F5] text-text-secondary'
            }`}>
              {rule.on ? 'Active' : 'Inactive'}
            </span>
            <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded">Priority {rule.priority}</span>
          </div>
          {rule.desc && <p className="text-sm text-text-secondary mt-0.5">{rule.desc}</p>}
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] mb-5 px-6 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="text-sm font-semibold text-text whitespace-nowrap">
            Minimum Confidence Score <span className="text-text-secondary font-normal">(≥)</span>
          </div>
          {rule.minScanQuality ? (
            <div className="text-sm font-medium text-text">{rule.minScanQuality}%</div>
          ) : (
            <div className="text-sm text-text-secondary">Not set — no OCR gate applied</div>
          )}
          <div className="text-xs text-text-secondary flex-1 min-w-[200px]">
            Only claims with OCR confidence at or above this value are auto-approved.
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] mb-5">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-text">Conditions</h2>
        </div>
        <div className="px-6 py-5">
          <GroupsDisplay groups={groups} />
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
    </div>
  );
}

function GroupsDisplay({ groups }) {
  if (!groups || groups.length === 0 || groups[0].length === 0) {
    return <div className="text-sm text-text-secondary">No conditions configured</div>;
  }
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
