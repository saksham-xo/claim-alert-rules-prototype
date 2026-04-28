import { useState, Fragment } from 'react';
import { Lock, AlertTriangle, FileText, ClipboardCheck, ShieldCheck, CheckCircle, ChevronDown, Pencil } from 'lucide-react';
import { useStore, VALIDATION_META, VALIDATION_CATEGORIES } from '../../data/store';
import RefNote from './RefNote';

/**
 * Auto-Approval settings panel.
 *
 * Configuration pattern (Option A — value chip + pencil-to-expand):
 *   - Each row's description text shows configured values inline as styled chips.
 *   - A small pencil icon at the end of the description triggers an inline editor sub-row.
 *   - The editor supports multiple threshold inputs in one row (e.g. "Submission burst" has hourly + daily limits).
 *   - Save fires the audit confirm modal once for the whole row (covers all changed fields).
 *
 * Row toggle vs threshold editability:
 *   - Cat 3 (Fraud detection) toggles are LOCKED (always-on).
 *   - Cat 3 thresholds are still editable. Clicking the pencil works regardless of toggle lock.
 */
export default function AutoApprovalSettings() {
  const {
    autoApprovalEnabled,
    autoApprovalSettings, toggleValidation, setValidationThreshold,
    showToast, toggleAutoApprovalEnabled,
  } = useStore();

  // Each category's expand/collapse state. Cat 3 collapsed by default since it's locked.
  const [expanded, setExpanded] = useState({ 1: true, 2: true, 3: false });

  // Which row's editor is currently expanded (one at a time)
  const [editingRowId, setEditingRowId] = useState(null);
  // Drafts keyed by `${rowId}:${field}`
  const [drafts, setDrafts] = useState({});
  const [pendingConfirm, setPendingConfirm] = useState(null);

  const draftKey = (id, field) => `${id}:${field}`;
  const valueFor = (id, field, stored) => {
    const k = draftKey(id, field);
    return k in drafts ? drafts[k] : (stored ?? '');
  };
  const setDraft = (id, field, val) => {
    setDrafts(prev => ({ ...prev, [draftKey(id, field)]: val }));
  };
  const clearRowDrafts = (id) => {
    setDrafts(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => { if (k.startsWith(`${id}:`)) delete next[k]; });
      return next;
    });
  };

  const startEditing = (rowId) => {
    if (editingRowId && editingRowId !== rowId) clearRowDrafts(editingRowId);
    setEditingRowId(rowId);
  };
  const cancelEditing = () => {
    if (editingRowId) clearRowDrafts(editingRowId);
    setEditingRowId(null);
  };

  // Compute changed fields for a row (vs stored values)
  const computeRowChanges = (settings, meta) => {
    const changes = [];
    (meta.thresholds || []).forEach(t => {
      const k = draftKey(meta.id, t.field);
      if (!(k in drafts)) return;
      const draftVal = drafts[k];
      const storedVal = settings[t.field] ?? '';
      if (String(draftVal) === String(storedVal)) return;
      changes.push({ threshold: t, draftVal, storedVal });
    });
    return changes;
  };

  const handleRowSave = (settings, meta) => {
    const changes = computeRowChanges(settings, meta);
    if (changes.length === 0) {
      cancelEditing();
      return;
    }
    // Validate all
    for (const c of changes) {
      if (c.draftVal !== '' && !(parseFloat(c.draftVal) > 0)) {
        showToast(`"${c.threshold.label}" must be greater than zero`);
        return;
      }
    }
    setPendingConfirm({ kind: 'threshold', settings, meta, changes });
  };

  const handleMasterToggleRequest = () => {
    setPendingConfirm({ kind: 'master', currentState: autoApprovalEnabled });
  };

  const isCategoryOn = (catId) => {
    if (catId === 3) return true;
    const childIds = VALIDATION_META.filter(m => m.category === catId).map(m => m.id);
    return autoApprovalSettings.some(s => childIds.includes(s.id) && s.on);
  };

  const toggleCategory = (catId) => {
    if (catId === 3) return;
    const desired = !isCategoryOn(catId);
    VALIDATION_META.filter(m => m.category === catId).forEach(m => {
      const s = autoApprovalSettings.find(x => x.id === m.id);
      if (s && s.on !== desired) toggleValidation(m.id);
    });
  };

  const acceptPending = () => {
    if (pendingConfirm.kind === 'master') {
      toggleAutoApprovalEnabled();
      showToast(`Auto-approval ${autoApprovalEnabled ? 'disabled' : 'enabled'} — logged to audit trail`);
    } else {
      const { settings, meta, changes } = pendingConfirm;
      changes.forEach(c => {
        setValidationThreshold(settings.id, c.threshold.field, parseFloat(c.draftVal));
      });
      showToast(`"${meta.name}" updated — logged to audit trail`);
      clearRowDrafts(meta.id);
      setEditingRowId(null);
    }
    setPendingConfirm(null);
  };
  const cancelPending = () => setPendingConfirm(null);

  return (
    <div className="px-6 py-6 flex flex-col gap-6">
      {/* 1. Master toggle + intro */}
      <div className={`rounded-lg border p-5 transition-colors ${
        autoApprovalEnabled ? 'bg-primary-light/30 border-primary/20' : 'bg-bg border-border'
      }`}>
        <div className="flex items-start gap-4">
          <Toggle checked={autoApprovalEnabled} onChange={handleMasterToggleRequest} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-text">Auto-approval</h3>
              <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                autoApprovalEnabled ? 'bg-success-bg text-[#2E7D32]' : 'bg-bg border border-border text-text-secondary'
              }`}>
                {autoApprovalEnabled ? 'On' : 'Off'}
              </span>
            </div>
            <p className="text-[13px] text-text-secondary mt-1 leading-snug">
              When enabled, the system runs the checks below on every uploaded invoice. Claims that pass all checks are auto-approved; everything else is flagged for manual review.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Flow diagram */}
      <div>
        <RefNote kind="replicate">
          Pipeline-card pattern same as <em>Advanced Configuration → Pre-Processing Logic</em>.
        </RefNote>
        <FlowDiagram dimmed={!autoApprovalEnabled} />
      </div>

      {/* 3. Category accordion */}
      <div>
        <RefNote kind="replicate">
          Category list + universal/category/item toggle pattern same as <em>Manage Team → Manage Roles → Creating a New Role</em>.
        </RefNote>
        <div className={`flex flex-col gap-3 transition-opacity ${autoApprovalEnabled ? '' : 'opacity-60 pointer-events-none'}`}>
          {[1, 2, 3].map(catId => (
            <CategoryBlock
              key={catId}
              catId={catId}
              expanded={expanded[catId]}
              onToggleExpand={() => setExpanded(prev => ({ ...prev, [catId]: !prev[catId] }))}
              categoryOn={isCategoryOn(catId)}
              onToggleCategory={() => toggleCategory(catId)}
              autoApprovalSettings={autoApprovalSettings}
              toggleValidation={toggleValidation}
              editingRowId={editingRowId}
              onStartEditing={startEditing}
              onCancelEditing={cancelEditing}
              onSaveRow={handleRowSave}
              drafts={drafts}
              setDraft={setDraft}
              valueFor={valueFor}
            />
          ))}
        </div>
      </div>

      {pendingConfirm && (
        <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center" onClick={cancelPending}>
          <div className="bg-surface rounded-lg shadow-xl w-[480px]" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-block" />
                <span className="text-base font-semibold text-text">Save Auto-Approval Changes</span>
              </div>
              <button onClick={cancelPending} className="bg-transparent border-none cursor-pointer text-xl text-text-secondary">&times;</button>
            </div>
            <div className="p-5 text-sm text-text leading-relaxed">
              {pendingConfirm.kind === 'master' && (
                <>You are about to <strong>{autoApprovalEnabled ? 'disable' : 'enable'}</strong> auto-approval for this program. </>
              )}
              {pendingConfirm.kind === 'threshold' && (
                <>You are about to update {pendingConfirm.changes.length} setting{pendingConfirm.changes.length === 1 ? '' : 's'} for <strong>"{pendingConfirm.meta.name}"</strong>. </>
              )}
              This action will be recorded in the Audit Trail. Click "Accept" to save your changes.
            </div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-border">
              <button onClick={cancelPending} className="text-primary px-4 py-2 rounded text-sm font-medium hover:bg-bg cursor-pointer">Cancel</button>
              <button onClick={acceptPending} className="bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#354499] cursor-pointer">Accept</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Flow diagram
// ───────────────────────────────────────────────────────────────────────────────
const FLOW_STEPS = [
  { Icon: FileText,        title: 'Read invoice',      subtitle: 'OCR pulls invoice fields' },
  { Icon: ClipboardCheck,  title: 'Check eligibility', subtitle: 'Validates document and submitter' },
  { Icon: ShieldCheck,     title: 'Check for fraud',   subtitle: 'Looks for duplicate or tampered claims' },
  { Icon: CheckCircle,     title: 'Decision',          subtitle: 'Auto-approved or flagged for review' },
];

function FlowDiagram({ dimmed }) {
  return (
    <div className={`bg-bg rounded-lg border border-border p-5 transition-opacity ${dimmed ? 'opacity-50' : ''}`}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-text">How auto-approval works</h3>
        <p className="text-xs text-text-secondary mt-0.5">
          Every uploaded invoice flows through these stages before a decision is made.
        </p>
      </div>
      <div className="flex items-stretch">
        {FLOW_STEPS.map((step, i) => (
          <Fragment key={step.title}>
            <div className="flex-1 bg-surface border border-primary/30 rounded-lg p-4 flex flex-col gap-1.5 min-w-0">
              <step.Icon size={18} className="text-primary shrink-0" />
              <div className="text-[13px] font-semibold text-text mt-0.5 leading-tight">{step.title}</div>
              <div className="text-[11px] text-text-secondary leading-snug">{step.subtitle}</div>
            </div>
            {i < FLOW_STEPS.length - 1 && (
              <div className="self-center w-4 h-px bg-primary/40 shrink-0" />
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Category block
// ───────────────────────────────────────────────────────────────────────────────
function CategoryBlock({
  catId, expanded, onToggleExpand,
  categoryOn, onToggleCategory,
  autoApprovalSettings, toggleValidation,
  editingRowId, onStartEditing, onCancelEditing, onSaveRow,
  drafts, setDraft, valueFor,
}) {
  const cat = VALIDATION_CATEGORIES[catId];
  const isLocked = catId === 3;
  const items = VALIDATION_META.filter(m => m.category === catId);

  return (
    <div className="bg-surface rounded-lg border border-border overflow-hidden">
      {/* Category header */}
      <div
        onClick={onToggleExpand}
        className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-bg/40 transition-colors"
      >
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          <Toggle
            checked={categoryOn}
            onChange={onToggleCategory}
            disabled={isLocked}
            title={isLocked ? 'Always on — cannot be turned off' : ''}
          />
          <h2 className="text-[14px] font-semibold text-primary">{cat.name}</h2>
          {isLocked && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-text-secondary bg-bg border border-border px-1.5 py-0.5 rounded">
              <Lock size={9} /> Always on
            </span>
          )}
        </div>
        <ChevronDown size={16} className={`text-text-secondary transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </div>

      {expanded && (
        <div className="border-t border-border">
          {/* Column headers */}
          <div className="grid grid-cols-[80px_minmax(0,1fr)_minmax(0,1.6fr)] gap-4 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-text-secondary bg-bg/50 border-b border-border">
            <div>Toggle</div>
            <div>Action Items</div>
            <div>Description</div>
          </div>

          {items.map(meta => {
            const settings = autoApprovalSettings.find(s => s.id === meta.id);
            if (!settings) return null;
            return (
              <ValidationRow
                key={meta.id}
                meta={meta}
                settings={settings}
                rowLocked={isLocked || meta.locked}
                onToggle={() => toggleValidation(meta.id)}
                isEditing={editingRowId === meta.id}
                onStartEditing={() => onStartEditing(meta.id)}
                onCancelEditing={onCancelEditing}
                onSave={() => onSaveRow(settings, meta)}
                drafts={drafts}
                setDraft={setDraft}
                valueFor={valueFor}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Validation row
// ───────────────────────────────────────────────────────────────────────────────
function ValidationRow({
  meta, settings, rowLocked, onToggle,
  isEditing, onStartEditing, onCancelEditing, onSave,
  drafts, setDraft, valueFor,
}) {
  const hasThresholds = !!(meta.thresholds && meta.thresholds.length > 0);
  const anyDraftDiff = hasThresholds && meta.thresholds.some(t => {
    const k = `${meta.id}:${t.field}`;
    return k in drafts && String(drafts[k]) !== String(settings[t.field] ?? '');
  });

  return (
    <div className="px-4 py-3 border-b border-border last:border-0">
      <div className="grid grid-cols-[80px_minmax(0,1fr)_minmax(0,1.6fr)] gap-4 items-start">
        <div>
          <Toggle
            checked={settings.on}
            onChange={onToggle}
            disabled={rowLocked}
            title={rowLocked ? 'Always on — cannot be turned off' : ''}
          />
        </div>
        <div className="flex items-start gap-2">
          <span className="text-sm font-medium text-text leading-tight">{meta.name}</span>
          {rowLocked && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-text-secondary bg-bg border border-border px-1.5 py-0.5 rounded shrink-0">
              <Lock size={9} /> Always on
            </span>
          )}
        </div>
        <div className="text-[13px] text-text-secondary leading-snug flex items-baseline gap-1.5 flex-wrap">
          {renderDescription(meta.desc, meta.thresholds, settings)}
          {hasThresholds && (
            <button
              onClick={onStartEditing}
              title="Edit thresholds"
              className="inline-flex items-center justify-center w-5 h-5 rounded hover:bg-bg cursor-pointer text-text-secondary hover:text-primary transition-colors shrink-0"
            >
              <Pencil size={11} />
            </button>
          )}
        </div>
      </div>

      {isEditing && hasThresholds && (
        <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-4 mt-3">
          <div /> {/* spacer aligned with Toggle column */}
          <div className="flex flex-col gap-3 bg-bg/50 border border-border rounded-lg p-4">
            <div className={`grid gap-3 ${meta.thresholds.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {meta.thresholds.map(t => (
                <div key={t.field}>
                  <div className="text-[11px] font-medium text-text-secondary mb-1 uppercase tracking-wider">{t.label}</div>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={valueFor(meta.id, t.field, settings[t.field])}
                      onChange={e => setDraft(meta.id, t.field, e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); onSave(); }
                        else if (e.key === 'Escape') { e.preventDefault(); onCancelEditing(); }
                      }}
                      className="w-full pl-3 pr-12 py-2 border border-border rounded-lg text-sm text-text outline-none focus:border-primary placeholder:text-[#BDC5DA] bg-surface"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-medium text-text-secondary uppercase tracking-wider pointer-events-none">{t.unit}</span>
                  </div>
                  {t.hint && (
                    <div className="text-[11px] text-text-secondary/80 mt-1">{t.hint}</div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={onCancelEditing} className="text-primary px-3 py-1.5 rounded text-sm font-medium hover:bg-bg cursor-pointer">Cancel</button>
              <button
                onClick={onSave}
                disabled={!anyDraftDiff}
                className={`px-3 py-1.5 rounded text-sm font-medium cursor-pointer transition-colors ${
                  anyDraftDiff ? 'bg-primary text-white hover:bg-[#354499]' : 'bg-bg text-text-secondary cursor-not-allowed'
                }`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Description renderer — substitutes {fieldName} placeholders with styled value chips.
// ───────────────────────────────────────────────────────────────────────────────
function renderDescription(template, thresholds, settings) {
  if (!template) return null;
  if (!thresholds || thresholds.length === 0) return template;

  // Split on {fieldName} placeholders (capturing them)
  const parts = template.split(/(\{[a-zA-Z]+\})/);
  return parts.map((part, i) => {
    const m = part.match(/^\{([a-zA-Z]+)\}$/);
    if (!m) return <Fragment key={i}>{part}</Fragment>;
    const fieldName = m[1];
    const t = thresholds.find(x => x.field === fieldName);
    if (!t) return <Fragment key={i}>{part}</Fragment>;
    const val = settings[fieldName];
    return (
      <span key={i} className="inline-flex items-baseline px-1.5 py-0.5 rounded bg-primary-light/60 text-primary text-[12px] font-semibold whitespace-nowrap">
        {formatValue(val, t.unit)}
      </span>
    );
  });
}

function formatValue(val, unit) {
  if (val === undefined || val === null || val === '') return '—';
  const num = typeof val === 'number' ? val : parseFloat(val);
  const formatted = isNaN(num) ? val : num.toLocaleString('en-IN');
  if (unit === '₹') return `₹${formatted}`;
  if (unit === '%') return `${formatted}%`;
  if (unit === 'x') return `${formatted}×`;
  return `${formatted} ${unit}`;
}

// ───────────────────────────────────────────────────────────────────────────────
// Toggle (shared)
// ───────────────────────────────────────────────────────────────────────────────
function Toggle({ checked, onChange, disabled = false, title, size = 'md' }) {
  const dims = size === 'lg' ? 'w-11 h-6' : 'w-9 h-5';
  const knob = size === 'lg' ? 'w-5 h-5 peer-checked:translate-x-5' : 'w-4 h-4 peer-checked:translate-x-4';
  return (
    <label title={title} className={`relative inline-block ${dims} shrink-0 mt-0.5 ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} className="sr-only peer" />
      <span className="absolute inset-0 bg-gray-300 rounded-full transition-colors peer-checked:bg-toggle-on" />
      <span className={`absolute left-0.5 top-0.5 bg-white rounded-full transition-transform ${knob}`} />
    </label>
  );
}
