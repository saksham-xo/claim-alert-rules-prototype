import { Trash2 } from 'lucide-react';

// Rule-engine-style condition builder: OR of AND-groups.
// Data shape: groups = [[{f, op, val}, ...], [{f, op, val}, ...], ...]
// Inner arrays are ANDed; outer is ORed.
//
// Props:
// - groups, onChange(groups)
// - fieldDefs: flat array [{ v, l, numeric?, ops }] OR categorized
//   [{ group: 'MEMBER ATTRIBUTES' | null, fields: [{ v, l, ... }] }]
// - noValueOps: string[] — operator values that render no value input

function flattenFieldDefs(fieldDefs) {
  if (!fieldDefs?.length) return [];
  return fieldDefs[0]?.fields ? fieldDefs.flatMap(g => g.fields) : fieldDefs;
}

function renderFieldOptions(fieldDefs) {
  if (!fieldDefs?.length) return null;
  if (fieldDefs[0]?.fields) {
    return fieldDefs.map((g, i) =>
      g.group
        ? <optgroup key={i} label={g.group}>{g.fields.map(f => <option key={f.v} value={f.v}>{f.l}</option>)}</optgroup>
        : g.fields.map(f => <option key={f.v} value={f.v}>{f.l}</option>)
    );
  }
  return fieldDefs.map(f => <option key={f.v} value={f.v}>{f.l}</option>);
}

export default function ConditionBuilder({ groups, onChange, fieldDefs, noValueOps = [] }) {
  const flatFields = flattenFieldDefs(fieldDefs);
  const updateCond = (gi, ci, updates) => {
    onChange(groups.map((g, i) => i !== gi ? g : g.map((c, j) => j === ci ? { ...c, ...updates } : c)));
  };

  const addAnd = (gi) => {
    onChange(groups.map((g, i) => i !== gi ? g : [...g, { f: '', op: '', val: '' }]));
  };

  const removeCond = (gi, ci) => {
    const g = groups[gi];
    if (g.length <= 1 && groups.length <= 1) return; // never empty everything
    if (g.length <= 1) {
      // Drop the whole group
      onChange(groups.filter((_, i) => i !== gi));
      return;
    }
    onChange(groups.map((grp, i) => i !== gi ? grp : grp.filter((_, j) => j !== ci)));
  };

  const addOr = () => {
    onChange([...groups, [{ f: '', op: '', val: '' }]]);
  };

  return (
    <div className="flex flex-col">
      {groups.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && (
            <div className="my-2">
              <span className="inline-block text-[11px] font-semibold text-[#7C3AED] bg-[#F3E8FF] px-2.5 py-1 rounded-full">OR</span>
            </div>
          )}

          <div className="bg-bg/40 border border-border rounded-lg p-4">
            {/* IF pill */}
            <div className="mb-3">
              <span className="inline-block text-[11px] font-semibold text-[#F59E0B] bg-[#FEF3C7] px-2.5 py-1 rounded-full">IF</span>
            </div>

            {group.map((c, ci) => {
              const fd = flatFields.find(f => f.v === c.f);
              const hideVal = noValueOps.includes(c.op);
              return (
                <div key={ci}>
                  {ci > 0 && (
                    <div className="my-2">
                      <span className="inline-block text-[11px] font-semibold text-success bg-[#E8F5E9] px-2.5 py-1 rounded-full">AND</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 px-3 py-2.5 border border-border rounded-lg text-sm text-text bg-surface outline-none focus:border-primary"
                      value={c.f}
                      onChange={e => updateCond(gi, ci, { f: e.target.value, op: '', val: '' })}
                    >
                      <option value="">Choose an attribute</option>
                      {renderFieldOptions(fieldDefs)}
                    </select>
                    <select
                      className={`flex-1 px-3 py-2.5 border border-border rounded-lg text-sm bg-surface outline-none focus:border-primary ${!c.f ? 'text-text-secondary opacity-50 cursor-not-allowed' : 'text-text'}`}
                      value={c.op}
                      onChange={e => updateCond(gi, ci, { op: e.target.value })}
                      disabled={!c.f}
                    >
                      <option value="">Choose operator</option>
                      {fd && fd.ops.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                    </select>
                    {!hideVal ? (
                      <input
                        type={fd?.numeric ? 'number' : 'text'}
                        className={`flex-1 px-3 py-2.5 border border-border rounded-lg text-sm bg-surface outline-none focus:border-primary ${!c.op ? 'text-text-secondary opacity-50 cursor-not-allowed' : 'text-text'}`}
                        value={c.val}
                        onChange={e => updateCond(gi, ci, { val: e.target.value })}
                        placeholder="Value"
                        disabled={!c.op}
                      />
                    ) : <div className="flex-1" />}
                    <button
                      onClick={() => removeCond(gi, ci)}
                      className="p-2 rounded-lg text-text-secondary hover:bg-block-bg hover:text-block cursor-pointer transition-colors"
                      aria-label="Remove condition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}

            <button
              onClick={() => addAnd(gi)}
              className="mt-3 text-[11px] font-semibold text-success bg-[#E8F5E9] px-2.5 py-1 rounded-full hover:bg-[#C8E6C9] cursor-pointer transition-colors"
            >
              + add AND condition
            </button>
          </div>
        </div>
      ))}

      <button
        onClick={addOr}
        className="mt-3 self-start text-[11px] font-semibold text-[#7C3AED] bg-[#F3E8FF] px-2.5 py-1 rounded-full hover:bg-[#E9D5FF] cursor-pointer transition-colors"
      >
        + add OR condition
      </button>
    </div>
  );
}
