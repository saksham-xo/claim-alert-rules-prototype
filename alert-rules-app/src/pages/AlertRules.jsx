import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, Pencil } from 'lucide-react';
import { useStore } from '../data/store';

const numericOps = [
  { v: 'equals', l: '=' }, { v: 'not_equals', l: '≠' },
  { v: 'gt', l: '>' }, { v: 'gte', l: '≥' },
  { v: 'lt', l: '<' }, { v: 'lte', l: '≤' },
];
const stringOps = [
  { v: 'equals', l: 'Equals' }, { v: 'contains', l: 'Contains' },
  { v: 'not_contains', l: "Doesn't contain" },
  { v: 'is_empty', l: 'Is empty' }, { v: 'is_not_empty', l: 'Is not empty' },
];
const booleanOps = [{ v: 'is_true', l: 'Yes' }, { v: 'is_false', l: 'No' }];
const noValueOps = ['is_empty', 'is_not_empty', 'is_true', 'is_false'];

const fieldIndex = {
  totalAmount:        { label: 'Invoice Amount', ops: numericOps, numeric: true },
  invoiceNo:          { label: 'Invoice Number', ops: stringOps },
  lineItemsMismatch:  { label: 'Line Items Total Mismatch', ops: booleanOps },
  ocrAmountMatch:     { label: 'Scanned Amount Matches Entered', ops: booleanOps },
  ocrConfidence:      { label: 'Confidence Score (%)', ops: numericOps, numeric: true },
  invoiceAge:         { label: 'Invoice Age (days)', ops: numericOps, numeric: true },
};

const defaultAlerts = [
  { id: 'DEF-01', name: 'Unable to fetch details', desc: 'Fires when invoice details are missing or unreadable by OCR.' },
  { id: 'DEF-02', name: 'Line item sum mismatch', desc: 'Fires when the sum of line items on the invoice does not match the total invoice amount.' },
  { id: 'DEF-03', name: 'Duplicate invoice number', desc: 'Fires when an invoice number has already been submitted previously by any retailer.' },
];

export default function AlertRules() {
  const navigate = useNavigate();
  const { rules, toggleRule, saveRule, showToast, devNotes } = useStore();

  const ruleHasEmptyCondition = (rule) =>
    rule.groups.some(g => g.some(c => !noValueOps.includes(c.op) && !c.val));

  const [drafts, setDrafts] = useState({});
  const [pendingConfirm, setPendingConfirm] = useState(null);

  const draftKey = (ruleId, gi, ci) => `${ruleId}:${gi}:${ci}`;

  const valueFor = (rule, gi, ci) => {
    const k = draftKey(rule.id, gi, ci);
    if (k in drafts) return drafts[k];
    return rule.groups[gi][ci].val ?? '';
  };

  const handleDraft = (rule, gi, ci, newVal) => {
    setDrafts(prev => ({ ...prev, [draftKey(rule.id, gi, ci)]: newVal }));
  };

  const handleCommit = (rule, gi, ci) => {
    const k = draftKey(rule.id, gi, ci);
    if (!(k in drafts)) return;
    const draftVal = drafts[k];
    const originalVal = rule.groups[gi][ci].val ?? '';
    if (draftVal === originalVal) {
      setDrafts(prev => { const next = { ...prev }; delete next[k]; return next; });
      return;
    }
    const field = fieldIndex[rule.groups[gi][ci].f];
    if (field?.numeric && draftVal !== '' && !(parseFloat(draftVal) > 0)) {
      showToast('Value must be greater than zero');
      setDrafts(prev => { const next = { ...prev }; delete next[k]; return next; });
      return;
    }
    if (!rule.on) {
      const nextGroups = rule.groups.map((g, i) =>
        i !== gi ? g : g.map((c, j) => j === ci ? { ...c, val: draftVal } : c)
      );
      saveRule({ ...rule, groups: nextGroups });
      setDrafts(prev => { const next = { ...prev }; delete next[k]; return next; });
      return;
    }
    setPendingConfirm({ kind: 'threshold', rule, gi, ci, newVal: draftVal, originalVal });
  };

  const clearDraft = (rule, gi, ci) => {
    setDrafts(prev => { const next = { ...prev }; delete next[draftKey(rule.id, gi, ci)]; return next; });
  };

  const handleToggleRequest = (rule) => {
    // Activating a rule that has no threshold yet is a pending state —
    // audit fires when the threshold is saved, not on the toggle itself.
    if (!rule.on && ruleHasEmptyCondition(rule)) {
      toggleRule(rule.id);
      return;
    }
    setPendingConfirm({ kind: 'toggle', rule });
  };

  const handleCancelDraft = (rule, gi, ci) => {
    clearDraft(rule, gi, ci);
    if (rule.on && ruleHasEmptyCondition(rule)) {
      toggleRule(rule.id);
    }
  };

  const acceptPending = () => {
    if (pendingConfirm.kind === 'toggle') {
      const { rule } = pendingConfirm;
      toggleRule(rule.id);
      showToast(`"${rule.name}" ${rule.on ? 'deactivated' : 'activated'} — logged to audit trail`);
    } else {
      const { rule, gi, ci, newVal } = pendingConfirm;
      const nextGroups = rule.groups.map((g, i) =>
        i !== gi ? g : g.map((c, j) => j === ci ? { ...c, val: newVal } : c)
      );
      saveRule({ ...rule, groups: nextGroups });
      showToast(`"${rule.name}" threshold updated — logged to audit trail`);
      clearDraft(rule, gi, ci);
    }
    setPendingConfirm(null);
  };

  const cancelPending = () => {
    if (pendingConfirm.kind === 'threshold') {
      const { rule, gi, ci } = pendingConfirm;
      clearDraft(rule, gi, ci);
    }
    setPendingConfirm(null);
  };

  return (
    <div>
      {/* Page header */}
      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-4 px-6 flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/partner-promotions/invoice-management')} className="hover:bg-bg rounded-lg p-2 cursor-pointer transition-colors">
          <ChevronLeft size={20} className="text-text" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-text">Claims Settings</h1>
          <p className="text-sm text-text-secondary mt-0.5">Configure alerts for invoice claims processing</p>
        </div>
      </div>

      {devNotes && (
        <div className="bg-[#E8F5E9] border border-[#A5D6A7] rounded-lg p-4 mb-6 text-[11px] text-[#1B5E20] leading-relaxed">
          <div className="font-semibold text-[#2E7D32] mb-1.5">Dev Notes — Claims Settings</div>
          <ul className="flex flex-col gap-1.5 list-disc pl-4">
            <li><strong>Built-in alerts</strong> ship enabled by default. They can only be disabled from the backend — no UI path to toggle them off. The card's toggle is display-only.</li>
            <li>The <strong>Edit Claims Settings</strong> permission gates exactly two actions on this page: toggling custom alerts on/off, and updating the threshold value. Nothing else on this screen is editable.</li>
            <li><strong>Audit trail:</strong> every custom-alert state change is recorded — toggling an existing configured rule on/off, and threshold changes on an active rule. The "Save Alert Changes" modal fires before an audit-worthy change persists: Accept commits + writes the audit entry; Cancel reverts and writes nothing.</li>
            <li><strong>Toggle first, then set threshold.</strong> The threshold input is disabled until the rule is toggled on. When activating a rule that has no threshold yet, the toggle flips on silently — activation is a <em>pending</em> state until the threshold is saved, at which point one audit entry covers both. Clicking Cancel in that pending state reverts the toggle back off; the session leaves no trace.</li>
            <li><strong>Threshold values</strong> must be greater than zero. Decimals allowed.</li>
            <li><strong>Threshold change impact — alerts are frozen at submission.</strong> Changing a threshold does not retroactively re-flag or un-flag existing claims:
              <ul className="list-[circle] pl-4 mt-1 flex flex-col gap-0.5">
                <li><em>Decrease</em> (e.g. 50k → 20k): past ₹40k claims stay unflagged. Only claims submitted after the change get evaluated at the new 20k threshold.</li>
                <li><em>Increase</em> (e.g. 50k → 100k): past ₹75k claims stay flagged (snapshot preserved). New ₹75k claims no longer flag.</li>
                <li><em>Rule toggled off</em>: existing alerts stamped with that ruleId disappear from the list and detail view. Snapshot on the invoice is preserved — toggling back on restores them.</li>
              </ul>
            </li>
          </ul>
        </div>
      )}

      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
        <div className="px-6 py-6 flex flex-col gap-7">
          {/* Default Alerts */}
          <section className="flex flex-col gap-3">
            <div>
              <h2 className="text-sm font-semibold text-text">Built-in Alerts</h2>
              <p className="text-xs text-text-secondary mt-0.5">Enabled by default. Run on every invoice at submission. No configuration required.</p>
            </div>
            <div className="flex flex-col gap-2">
              {defaultAlerts.map(a => (
                <div key={a.id} className="bg-surface border border-border rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    <Toggle checked={true} disabled />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-text mb-0.5">{a.name}</h3>
                      <p className="text-[13px] text-text-secondary leading-snug">{a.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Custom Alerts */}
          <section className="flex flex-col gap-3">
            <div>
              <h2 className="text-sm font-semibold text-text">Custom Alerts</h2>
              <p className="text-xs text-text-secondary mt-0.5">Matching invoices display a warning icon next to their amount on the Claims list. Condition changes are recorded in the audit trail.</p>
            </div>
            {rules.length === 0 ? (
              <div className="text-center py-10 text-text-secondary text-sm">No custom alerts configured.</div>
            ) : (
              <div className="flex flex-col gap-2">
                {rules.map(r => (
                  <div key={r.id} className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-3">
                    <div className="flex items-start gap-4">
                      <Toggle
                        checked={r.on}
                        onChange={() => handleToggleRequest(r)}
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-text mb-0.5">{r.name}</h3>
                        {r.desc && <p className="text-[13px] text-text-secondary leading-snug">{r.desc}</p>}
                      </div>
                    </div>
                    {r.groups?.length > 0 && r.groups[0].length > 0 && (
                      <div className="pl-[52px] flex flex-col gap-2">
                        {r.groups.map((grp, gi) => (
                          grp.map((c, ci) => {
                            const field = fieldIndex[c.f];
                            const isNoValue = noValueOps.includes(c.op);
                            const opMatch = field?.ops.find(o => o.v === c.op);
                            const k = draftKey(r.id, gi, ci);
                            const hasDraft = k in drafts && drafts[k] !== (c.val ?? '');
                            const inputDisabled = !r.on;
                            return (
                              <div key={`${gi}-${ci}`} className="flex flex-col gap-2">
                                <div className="grid grid-cols-3 gap-3">
                                  <div className="px-3 py-2.5 border border-border rounded-lg text-sm text-text bg-bg/50 cursor-not-allowed">{field?.label || c.f}</div>
                                  <div className="px-3 py-2.5 border border-border rounded-lg text-sm text-text bg-bg/50 cursor-not-allowed">{opMatch?.l || c.op}</div>
                                  {isNoValue ? (
                                    <div className="px-3 py-2.5 border border-border rounded-lg text-sm text-text-secondary bg-bg/30 italic">No value needed</div>
                                  ) : (
                                    <div className="relative">
                                      <input
                                        type={field?.numeric ? 'number' : 'text'}
                                        {...(field?.numeric ? { min: '0.01', step: 'any' } : {})}
                                        required
                                        disabled={inputDisabled}
                                        value={valueFor(r, gi, ci)}
                                        onChange={e => handleDraft(r, gi, ci, e.target.value)}
                                        onKeyDown={e => {
                                          if (e.key === 'Enter') { e.preventDefault(); handleCommit(r, gi, ci); }
                                          else if (e.key === 'Escape') { e.preventDefault(); handleCancelDraft(r, gi, ci); }
                                        }}
                                        placeholder="Value *"
                                        title={inputDisabled ? 'Enable this alert to set a threshold value' : 'Enter a value and click Save'}
                                        className={`w-full px-3 py-2.5 pr-9 border border-border rounded-lg text-sm text-text outline-none focus:border-primary placeholder:text-[#BDC5DA] ${inputDisabled ? 'bg-bg/50 cursor-not-allowed text-text-secondary' : 'bg-surface'}`}
                                      />
                                      {!inputDisabled && (
                                        <Pencil size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#868CCC] pointer-events-none" />
                                      )}
                                    </div>
                                  )}
                                </div>
                                {hasDraft && !inputDisabled && (
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => handleCancelDraft(r, gi, ci)}
                                      className="text-primary px-3 py-1.5 rounded text-sm font-medium hover:bg-bg cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleCommit(r, gi, ci)}
                                      className="bg-primary text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-[#354499] cursor-pointer"
                                    >
                                      Save
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {pendingConfirm && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center" onClick={cancelPending}>
          <div className="bg-surface rounded-lg shadow-xl w-[480px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-block" />
                <span className="text-base font-semibold text-text">Save Alert Changes</span>
              </div>
              <button onClick={cancelPending} className="bg-transparent border-none cursor-pointer text-xl text-text-secondary">&times;</button>
            </div>
            <div className="p-5">
              <p className="text-sm text-text leading-relaxed">
                This action will be recorded in the Audit Trail. Click "Accept" to save your changes.
              </p>
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
              <button
                onClick={cancelPending}
                className="text-primary px-4 py-2 rounded text-sm font-medium hover:bg-bg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={acceptPending}
                className="bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#354499] cursor-pointer"
              >
                Accept
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Toggle({ checked, onChange, disabled = false, title }) {
  return (
    <label title={title} className={`relative inline-block w-9 h-5 shrink-0 mt-0.5 ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="sr-only peer"
      />
      <span className="absolute inset-0 bg-gray-300 rounded-full transition-colors peer-checked:bg-toggle-on" />
      <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
    </label>
  );
}
