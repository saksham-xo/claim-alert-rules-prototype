import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useStore } from '../data/store';
import { getGroups, isGroupsComplete } from '../data/rules';
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

const noValueOps = ['is_empty', 'is_not_empty', 'is_true', 'is_false'];

export default function EditAlert() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { rules, saveRule, showToast } = useStore();

  const rule = rules.find(r => r.id === id);

  const [name, setName] = useState(rule?.name || '');
  const [desc, setDesc] = useState(rule?.desc || '');
  const [groups, setGroups] = useState(rule ? getGroups(rule).map(g => g.map(c => ({ ...c }))) : [[{ f: '', op: '', val: '' }]]);

  if (!rule) {
    return (
      <div className="text-center py-20 text-text-secondary">
        <p className="text-lg font-medium mb-2">Alert not found</p>
        <button onClick={() => navigate('/partner-promotions/invoice-management/settings')} className="text-primary text-sm font-medium hover:underline cursor-pointer">Back to Alerts</button>
      </div>
    );
  }

  const handleSave = () => {
    if (!name.trim()) { showToast('Alert name is required'); return; }
    if (!isGroupsComplete(groups, noValueOps)) { showToast('Complete all conditions'); return; }
    saveRule({ ...rule, name: name.trim(), desc: desc.trim(), groups });
    showToast(`"${name.trim()}" updated`);
    navigate(`/partner-promotions/invoice-management/settings/alerts/${rule.id}`);
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(`/partner-promotions/invoice-management/settings/alerts/${rule.id}`)} className="hover:bg-bg rounded-lg p-2 cursor-pointer transition-colors">
          <ChevronLeft size={20} className="text-text" />
        </button>
        <h1 className="text-lg font-bold text-text">Edit Alert</h1>
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${rule.on ? 'bg-[#E8F5E9] text-success' : 'bg-[#F5F5F5] text-text-secondary'}`}>
          {rule.on ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] mb-5">
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
              className="w-full px-3 py-2.5 border border-border rounded-lg text-sm text-text outline-none focus:border-primary"
              placeholder="e.g. High Value Invoice"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Description</label>
            <textarea
              rows={2}
              value={desc}
              onChange={e => setDesc(e.target.value)}
              className="w-full px-3 py-2.5 border border-border rounded-lg text-[13px] text-text outline-none resize-y focus:border-primary"
              placeholder="Optional — describe what this alert checks"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-text-secondary mb-1.5 block">Alert ID</label>
            <div className="text-sm font-mono text-text-secondary">{rule.id}</div>
          </div>
        </div>
      </div>

      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] mb-5">
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

      <div className="flex items-center justify-end gap-3">
        <button
          onClick={() => navigate(`/partner-promotions/invoice-management/settings/alerts/${rule.id}`)}
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
