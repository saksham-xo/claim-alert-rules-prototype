import { useState, useEffect } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { useStore } from '../data/store';

/* ── Field definitions for custom builder ── */
const fieldDefs = [
  { v: 'totalAmount', l: 'Total Amount (INR)', cat: 'Amount', t: 'number', ops: [{ v: 'greater_than', l: 'greater than' }, { v: 'less_than', l: 'less than' }, { v: 'equals', l: 'equals' }] },
  { v: 'invoiceNo', l: 'Invoice Number', cat: 'Frequency', t: 'text', ops: [{ v: 'is_duplicate', l: 'is duplicate (already exists)' }, { v: 'equals', l: 'equals' }] },
  { v: 'supplierName', l: 'Supplier / Distributor', cat: 'Data Quality', t: 'text', ops: [{ v: 'not_in_authorised', l: 'not in authorised list' }, { v: 'equals', l: 'equals' }, { v: 'not_equals', l: 'does not equal' }] },
  { v: 'totalsMismatch', l: 'Line Items vs Invoice Total', cat: 'Data Quality', t: 'comparison', ops: [{ v: 'mismatch', l: 'do not match' }, { v: 'diff_greater_than', l: 'differ by more than' }] },
  { v: 'ocrAmount', l: 'OCR Extracted Amount', cat: 'Document', t: 'number', ops: [{ v: 'not_equals_entered', l: 'does not match entered amount' }] },
  { v: 'ocrConfidence', l: 'OCR Confidence Score (%)', cat: 'Document', t: 'number', ops: [{ v: 'less_than', l: 'less than' }, { v: 'greater_than', l: 'greater than' }] },
];

const noValueOps = ['is_duplicate', 'mismatch', 'not_in_authorised', 'not_equals_entered'];

/* ── Template definitions ── */
const templateDefs = [
  { key: 'amount', title: 'Amount Threshold', desc: 'Flag invoices exceeding a configurable amount', iconBg: 'bg-flag-bg', iconColor: 'text-flag', icon: '\u20b9', pill: 'flag', defName: 'High Value Invoice', defDesc: 'Flag invoices exceeding amount threshold for additional review', defBehavior: 'flag', defActs: ['flag_invoice', 'require_review'] },
  { key: 'duplicate', title: 'Duplicate Detection', desc: 'Detect previously submitted invoice numbers', iconBg: 'bg-block-bg', iconColor: 'text-block', icon: 'copy', pill: 'block', defName: 'Duplicate Invoice Number', defDesc: 'Block when invoice number has already been submitted in the system', defBehavior: 'block', defActs: ['flag_invoice', 'block_approval'] },
  { key: 'distributor', title: 'Distributor Verification', desc: 'Check supplier against authorised distributor list for retailer', iconBg: 'bg-block-bg', iconColor: 'text-block', icon: 'shield', pill: 'block', defName: 'Unauthorised Distributor', defDesc: 'Block when supplier is not in authorised distributor list for the retailer', defBehavior: 'block', defActs: ['flag_invoice', 'block_approval', 'send_notification'] },
  { key: 'mismatch', title: 'Total Mismatch', desc: 'Compare line item sum against invoice total', iconBg: 'bg-block-bg', iconColor: 'text-block', icon: 'calc', pill: 'block', defName: 'Mismatched Totals', defDesc: 'Block when sum of line item amounts does not equal the invoice total', defBehavior: 'block', defActs: ['flag_invoice', 'block_approval'] },
  { key: 'ocr', title: 'OCR Quality Check', desc: 'Flag low-confidence scans or amount mismatches', iconBg: 'bg-flag-bg', iconColor: 'text-flag', icon: 'doc', pill: 'flag', defName: 'OCR Confidence Low', defDesc: 'Flag when OCR scan confidence is below threshold or extracted amount mismatches entry', defBehavior: 'flag', defActs: ['flag_invoice'] },
  { key: 'custom', title: 'Custom Rule', desc: 'Build a rule from scratch with custom conditions', iconBg: 'bg-bg', iconColor: 'text-text-secondary', icon: 'sliders', pill: null, defName: '', defDesc: '', defBehavior: 'flag', defActs: ['flag_invoice'] },
];

function TemplateIcon({ icon, className }) {
  const cls = `w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0 ${className}`;
  if (icon === '\u20b9') return <div className={cls}>{icon}</div>;
  if (icon === 'copy') return <div className={cls}><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg></div>;
  if (icon === 'shield') return <div className={cls}><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M12 2l9 4.5v5c0 5.25-3.82 10.15-9 11.5-5.18-1.35-9-6.25-9-11.5v-5L12 2z"/></svg></div>;
  if (icon === 'calc') return <div className={cls}><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg></div>;
  if (icon === 'doc') return <div className={cls}><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg></div>;
  if (icon === 'sliders') return <div className={cls}><svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg></div>;
  return <div className={cls}>{icon}</div>;
}

function SeverityPill({ type }) {
  if (type === 'block') return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-block-bg text-[#C62828] shrink-0">Critical</span>;
  if (type === 'flag') return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-flag-bg text-[#E65100] shrink-0">Warning</span>;
  return null;
}

/* ── Template Config Renderers ── */
function AmountConfig({ cfg, onChange }) {
  return (
    <div className="bg-[#F8F9FF] border border-border rounded-lg p-4 mb-1">
      <div className="text-sm font-medium text-text mb-2 flex items-center gap-2">
        <svg width="16" height="16" fill="none" stroke="#FF9800" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        Amount Threshold
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-text">Flag invoices where total amount is</span>
        <select
          className="px-3 py-2.5 border border-border rounded-lg text-sm text-text bg-surface outline-none focus:border-primary"
          value={cfg.comparison || 'greater_than'}
          onChange={e => onChange({ ...cfg, comparison: e.target.value })}
        >
          <option value="greater_than">greater than</option>
          <option value="less_than">less than</option>
        </select>
        <div className="flex items-center gap-1">
          <span className="text-base font-semibold text-text">{'\u20b9'}</span>
          <input
            type="number"
            className="w-[140px] px-3 py-2.5 border border-border rounded-lg text-sm text-text bg-surface outline-none focus:border-primary"
            value={cfg.threshold || '50000'}
            onChange={e => onChange({ ...cfg, threshold: e.target.value })}
            placeholder="50000"
          />
        </div>
      </div>
      <div className="text-[11px] text-text-secondary mt-1 leading-relaxed">Example: For Lupin, set threshold to {'\u20b9'}50,000. For Alkem, you might set {'\u20b9'}1,00,000.</div>
    </div>
  );
}

function DuplicateConfig({ cfg, onChange }) {
  return (
    <div className="bg-[#F8F9FF] border border-border rounded-lg p-4 mb-1">
      <div className="text-sm font-medium text-text mb-3 flex items-center gap-2">
        <svg width="16" height="16" fill="none" stroke="#F44336" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
        Duplicate Invoice Detection
      </div>
      <div className="text-sm text-text mb-3">Alert when an invoice number has already been submitted in the system.</div>
      <div className="text-xs font-medium text-text-secondary mb-2">Duplicate check scope:</div>
      <div className="flex flex-col gap-2">
        <label
          className={`flex items-center gap-2.5 p-3 px-3.5 border rounded-lg cursor-pointer transition-all ${cfg.scope !== 'partner' ? 'border-primary bg-primary-light' : 'border-border hover:border-primary'}`}
          onClick={() => onChange({ ...cfg, scope: 'all' })}
        >
          <input type="radio" name="dup-scope" checked={cfg.scope !== 'partner'} readOnly className="accent-primary" />
          <div>
            <div className="text-[13px] font-medium">All partners</div>
            <div className="text-[11px] text-text-secondary">Check against all invoices in the system</div>
          </div>
        </label>
        <label
          className={`flex items-center gap-2.5 p-3 px-3.5 border rounded-lg cursor-pointer transition-all ${cfg.scope === 'partner' ? 'border-primary bg-primary-light' : 'border-border hover:border-primary'}`}
          onClick={() => onChange({ ...cfg, scope: 'partner' })}
        >
          <input type="radio" name="dup-scope" checked={cfg.scope === 'partner'} readOnly className="accent-primary" />
          <div>
            <div className="text-[13px] font-medium">Same partner only</div>
            <div className="text-[11px] text-text-secondary">Only flag if same partner submitted the number before</div>
          </div>
        </label>
      </div>
      <label className="flex items-center gap-2 mt-3 text-[13px] cursor-pointer">
        <input type="checkbox" checked={cfg.inclRejected || false} onChange={e => onChange({ ...cfg, inclRejected: e.target.checked })} />
        Include previously rejected invoices in duplicate check
      </label>
    </div>
  );
}

function DistributorConfig({ cfg, onChange }) {
  return (
    <div className="bg-[#F8F9FF] border border-border rounded-lg p-4 mb-1">
      <div className="text-sm font-medium text-text mb-3 flex items-center gap-2">
        <svg width="16" height="16" fill="none" stroke="#F44336" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M12 2l9 4.5v5c0 5.25-3.82 10.15-9 11.5-5.18-1.35-9-6.25-9-11.5v-5L12 2z"/></svg>
        Distributor Verification
      </div>
      <div className="text-sm text-text mb-3">Alert when the invoice supplier is <strong>not</strong> in the authorised distributor list configured for that retailer.</div>
      <div className="bg-flag-bg border border-[#FFE0B2] rounded-lg p-3 flex gap-2.5 items-start">
        <svg width="16" height="16" fill="none" stroke="#FF9800" viewBox="0 0 24 24" className="shrink-0 mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <div className="text-xs text-[#E65100] leading-relaxed">
          Authorised distributor lists are managed per retailer in <strong>Program Settings &rarr; Partner Config</strong>. This rule checks the invoice supplier name against that list automatically.
        </div>
      </div>
      <label className="flex items-center gap-2 mt-3 text-[13px] cursor-pointer">
        <input type="checkbox" checked={cfg.fuzzyMatch || false} onChange={e => onChange({ ...cfg, fuzzyMatch: e.target.checked })} />
        Use fuzzy matching <span className="text-text-secondary text-[11px]">(tolerate minor spelling differences)</span>
      </label>
    </div>
  );
}

function MismatchConfig({ cfg, onChange }) {
  return (
    <div className="bg-[#F8F9FF] border border-border rounded-lg p-4 mb-1">
      <div className="text-sm font-medium text-text mb-3 flex items-center gap-2">
        <svg width="16" height="16" fill="none" stroke="#F44336" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
        Total Mismatch Check
      </div>
      <div className="text-sm text-text mb-3">Alert when the sum of all line item amounts does not match the invoice total.</div>
      <div className="text-xs font-medium text-text-secondary mb-2">Tolerance:</div>
      <div className="flex items-center gap-2">
        <span className="text-[13px]">Allow difference up to</span>
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold">{'\u20b9'}</span>
          <input
            type="number"
            className="w-[100px] px-3 py-2.5 border border-border rounded-lg text-sm text-text bg-surface outline-none focus:border-primary"
            value={cfg.tolerance || '0'}
            onChange={e => onChange({ ...cfg, tolerance: parseFloat(e.target.value) || 0 })}
            placeholder="0"
          />
        </div>
      </div>
      <div className="text-[11px] text-text-secondary mt-1 leading-relaxed">Set to 0 for exact match. Use a small tolerance (e.g., {'\u20b9'}1-5) to account for rounding differences.</div>
    </div>
  );
}

function OcrConfig({ cfg, onChange }) {
  return (
    <div className="bg-[#F8F9FF] border border-border rounded-lg p-4 mb-1">
      <div className="text-sm font-medium text-text mb-3 flex items-center gap-2">
        <svg width="16" height="16" fill="none" stroke="#FF9800" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
        OCR Quality Check
      </div>
      <div className="text-sm text-text mb-3">Flag when OCR (optical character recognition) scan quality is poor.</div>
      <div className="flex flex-col gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[13px]">Minimum confidence score:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                className="w-[80px] px-3 py-2.5 border border-border rounded-lg text-sm text-text bg-surface outline-none focus:border-primary"
                value={cfg.minConfidence || 80}
                min="0" max="100"
                onChange={e => onChange({ ...cfg, minConfidence: parseInt(e.target.value) || 80 })}
              />
              <span className="text-sm font-medium">%</span>
            </div>
          </div>
          <div className="text-[11px] text-text-secondary mt-1">Scans below this confidence level will trigger the alert. Recommended: 80%.</div>
        </div>
        <label className="flex items-center gap-2 text-[13px] cursor-pointer">
          <input type="checkbox" checked={cfg.checkAmountMatch !== false} onChange={e => onChange({ ...cfg, checkAmountMatch: e.target.checked })} />
          Also flag when extracted amount doesn't match entered amount
        </label>
      </div>
      <div className="bg-[#E3F2FD] border border-[#BBDEFB] rounded-lg p-2.5 mt-3 text-xs text-[#1565C0] flex gap-2 items-start">
        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" className="shrink-0 mt-0.5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        <span>This check requires OCR processing to be enabled for your program. Contact support if not yet configured.</span>
      </div>
    </div>
  );
}

function CustomConfig({ cfg, onChange }) {
  const conds = cfg.customConds || [{ f: '', op: '', val: '' }];
  const logic = cfg.logic || 'AND';

  const updateCond = (i, updates) => {
    const newConds = conds.map((c, j) => j === i ? { ...c, ...updates } : c);
    onChange({ ...cfg, customConds: newConds });
  };

  const addCond = () => {
    onChange({ ...cfg, customConds: [...conds, { f: '', op: '', val: '' }] });
  };

  const removeCond = (i) => {
    onChange({ ...cfg, customConds: conds.filter((_, j) => j !== i) });
  };

  return (
    <div className="bg-[#F8F9FF] border border-border rounded-lg p-4 mb-1">
      <div className="text-sm font-medium text-text mb-3 flex items-center gap-2">
        <svg width="16" height="16" fill="none" stroke="#68728C" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
        Custom Conditions
        <div className="ml-auto flex bg-bg rounded border border-border overflow-hidden">
          <button
            className={`px-2 py-0.5 text-[11px] font-semibold border-none cursor-pointer ${logic === 'AND' ? 'bg-primary text-white' : 'bg-transparent text-text-secondary'}`}
            onClick={() => onChange({ ...cfg, logic: 'AND' })}
          >AND</button>
          <button
            className={`px-2 py-0.5 text-[11px] font-semibold border-none cursor-pointer ${logic === 'OR' ? 'bg-primary text-white' : 'bg-transparent text-text-secondary'}`}
            onClick={() => onChange({ ...cfg, logic: 'OR' })}
          >OR</button>
        </div>
      </div>

      {conds.map((cd, i) => {
        const fd = fieldDefs.find(f => f.v === cd.f);
        const hideVal = noValueOps.includes(cd.op);
        return (
          <div key={i}>
            {i > 0 && (
              <div className="text-center my-1">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-bg text-[#4F516E]">{logic}</span>
              </div>
            )}
            <div className="flex items-center gap-2 mb-1">
              <select
                className="flex-1 text-[13px] px-3 py-2 border border-border rounded-lg bg-surface text-text outline-none focus:border-primary"
                value={cd.f}
                onChange={e => updateCond(i, { f: e.target.value, op: '', val: '' })}
              >
                <option value="">Select field...</option>
                {(() => {
                  let lastCat = '';
                  const opts = [];
                  fieldDefs.forEach((f, fi) => {
                    if (f.cat !== lastCat) {
                      if (lastCat) opts.push(<optgroup key={`end-${lastCat}`} />);
                      opts.push(<optgroup key={f.cat} label={f.cat} />);
                      lastCat = f.cat;
                    }
                    opts.push(<option key={fi} value={f.v}>{f.l}</option>);
                  });
                  return opts;
                })()}
              </select>
              <select
                className="flex-1 text-[13px] px-3 py-2 border border-border rounded-lg bg-surface text-text outline-none focus:border-primary"
                value={cd.op}
                onChange={e => updateCond(i, { op: e.target.value })}
              >
                <option value="">Operator...</option>
                {fd && fd.ops.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
              {!hideVal && (
                <input
                  type={fd && fd.t === 'number' ? 'number' : 'text'}
                  placeholder="Value"
                  value={cd.val}
                  onChange={e => updateCond(i, { val: e.target.value })}
                  className="flex-1 text-[13px] px-3 py-2 border border-border rounded-lg bg-surface text-text outline-none focus:border-primary"
                />
              )}
              {conds.length > 1 && (
                <button onClick={() => removeCond(i)} className="bg-transparent border-none text-block cursor-pointer text-lg">&times;</button>
              )}
            </div>
          </div>
        );
      })}
      <button
        onClick={addCond}
        className="mt-1 text-xs font-medium text-primary bg-transparent border-none cursor-pointer p-1 rounded hover:bg-primary-light"
      >
        + Add Condition
      </button>
    </div>
  );
}

function renderConfigComponent(tmplKey, cfg, onChange) {
  switch (tmplKey) {
    case 'amount': return <AmountConfig cfg={cfg} onChange={onChange} />;
    case 'duplicate': return <DuplicateConfig cfg={cfg} onChange={onChange} />;
    case 'distributor': return <DistributorConfig cfg={cfg} onChange={onChange} />;
    case 'mismatch': return <MismatchConfig cfg={cfg} onChange={onChange} />;
    case 'ocr': return <OcrConfig cfg={cfg} onChange={onChange} />;
    case 'custom': return <CustomConfig cfg={cfg} onChange={onChange} />;
    default: return null;
  }
}

function buildConds(tmplKey, cfg) {
  switch (tmplKey) {
    case 'amount': return [{ f: 'totalAmount', op: cfg.comparison || 'greater_than', val: cfg.threshold || '50000' }];
    case 'duplicate': return [{ f: 'invoiceNo', op: 'is_duplicate', val: '' }];
    case 'distributor': return [{ f: 'supplierName', op: 'not_in_authorised', val: '' }];
    case 'mismatch': return [{ f: 'totalsMismatch', op: (cfg.tolerance > 0 ? 'diff_greater_than' : 'mismatch'), val: cfg.tolerance > 0 ? String(cfg.tolerance) : '' }];
    case 'ocr': {
      const c = [{ f: 'ocrConfidence', op: 'less_than', val: String(cfg.minConfidence || 80) }];
      if (cfg.checkAmountMatch !== false) c.push({ f: 'ocrAmount', op: 'not_equals_entered', val: '' });
      return c;
    }
    case 'custom': return cfg.customConds || [{ f: '', op: '', val: '' }];
    default: return [];
  }
}

function buildPreview(tmplKey, cfg, behavior) {
  let condText = '';
  if (tmplKey === 'amount') condText = `invoice amount is greater than <strong>\u20b9${parseInt(cfg.threshold || 50000).toLocaleString('en-IN')}</strong>`;
  else if (tmplKey === 'duplicate') condText = 'invoice number has <strong>already been submitted</strong>' + (cfg.scope === 'partner' ? ' by the same partner' : '');
  else if (tmplKey === 'distributor') condText = 'supplier is <strong>not in the authorised distributor list</strong> for the retailer';
  else if (tmplKey === 'mismatch') condText = 'line item total <strong>does not match</strong> invoice total' + (cfg.tolerance > 0 ? ` (tolerance: \u20b9${cfg.tolerance})` : '');
  else if (tmplKey === 'ocr') condText = `OCR confidence is <strong>below ${cfg.minConfidence || 80}%</strong>` + (cfg.checkAmountMatch !== false ? " or extracted amount doesn't match" : '');
  else {
    const conds = cfg.customConds || [];
    condText = conds.map(c => {
      const fd = fieldDefs.find(f => f.v === c.f);
      return fd ? fd.l + ' ' + c.op + (c.val ? ' ' + c.val : '') : '(custom condition)';
    }).join(` ${cfg.logic || 'AND'} `);
  }

  const behLabel = behavior === 'block' ? 'Blocks approval' : 'Flags for review';
  const behNote = behavior === 'block' ? ' -- approver must resolve before approving' : ' -- approver sees the alert, can still approve';
  const behColor = behavior === 'block' ? 'text-[#C62828]' : 'text-[#E65100]';

  return { condText, behLabel, behNote, behColor };
}

const defaultCfg = {
  amount: { threshold: '50000', comparison: 'greater_than' },
  duplicate: { scope: 'all', inclRejected: false },
  distributor: { fuzzyMatch: false },
  mismatch: { tolerance: 0 },
  ocr: { minConfidence: 80, checkAmountMatch: true },
  custom: { customConds: [{ f: '', op: '', val: '' }], logic: 'AND' },
};

export default function RuleBuilder({ editRule, onClose }) {
  const { saveRule, showToast } = useStore();
  const isEdit = !!editRule;

  // Reverse-map template from existing rule
  const fieldToTmpl = { totalAmount: 'amount', invoiceNo: 'duplicate', supplierName: 'distributor', totalsMismatch: 'mismatch', ocrConfidence: 'ocr', ocrAmount: 'ocr' };

  // Legacy builder — supports both new `groups` shape and old `conds + logic`. Flatten groups to a single AND list for editing.
  const editConds = isEdit
    ? (editRule.conds || (editRule.groups ? editRule.groups.flat() : []))
    : [];
  const editLogic = isEdit ? (editRule.logic || 'AND') : 'AND';

  const initTmpl = isEdit ? (fieldToTmpl[editConds[0]?.f] || 'custom') : null;
  const initCfg = isEdit ? (() => {
    const t = fieldToTmpl[editConds[0]?.f] || 'custom';
    if (t === 'amount') return { threshold: editConds[0]?.val || '50000', comparison: editConds[0]?.op || 'greater_than' };
    if (t === 'mismatch') return { tolerance: parseFloat(editConds[0]?.val) || 0 };
    if (t === 'ocr') return { minConfidence: parseInt(editConds[0]?.val) || 80, checkAmountMatch: editConds.length > 1 };
    if (t === 'custom') return { customConds: JSON.parse(JSON.stringify(editConds)), logic: editLogic };
    return {};
  })() : {};

  const [step, setStep] = useState(isEdit ? 2 : 1);
  const [tmpl, setTmpl] = useState(initTmpl);
  const [cfg, setCfg] = useState(initCfg);
  const [behavior, setBehavior] = useState(isEdit ? editRule.behavior : 'flag');
  const [acts, setActs] = useState(isEdit ? {
    flag_invoice: editRule.acts.includes('flag_invoice'),
    block_approval: editRule.acts.includes('block_approval'),
    auto_approve: editRule.acts.includes('auto_approve'),
    require_review: editRule.acts.includes('require_review'),
    send_notification: editRule.acts.includes('send_notification'),
  } : { flag_invoice: true, block_approval: false, auto_approve: false, require_review: false, send_notification: false });
  const [name, setName] = useState(isEdit ? editRule.name : '');
  const [desc, setDesc] = useState(isEdit ? editRule.desc : '');
  const [enabled, setEnabled] = useState(isEdit ? editRule.on : true);

  const goStep = (n) => setStep(n);

  const pickTemplate = (key) => {
    const def = templateDefs.find(t => t.key === key);
    setTmpl(key);
    setCfg(defaultCfg[key] ? { ...defaultCfg[key] } : {});
    setBehavior(def.defBehavior);
    setName(def.defName);
    setDesc(def.defDesc);
    const defActs = def.defActs;
    setActs({
      flag_invoice: defActs.includes('flag_invoice'),
      block_approval: defActs.includes('block_approval'),
      auto_approve: defActs.includes('auto_approve'),
      require_review: defActs.includes('require_review'),
      send_notification: defActs.includes('send_notification'),
    });
    goStep(2);
  };

  const selectBehavior = (b) => {
    setBehavior(b);
    if (b === 'block') {
      setActs(prev => ({ ...prev, block_approval: true, auto_approve: false }));
    }
  };

  const toggleAct = (key) => {
    setActs(prev => {
      const next = { ...prev, [key]: !prev[key] };
      if (key === 'block_approval' && next.block_approval) next.auto_approve = false;
      if (key === 'auto_approve' && next.auto_approve) next.block_approval = false;
      return next;
    });
  };

  const handleNext = () => {
    if (step === 2) {
      if (tmpl === 'custom' && (!cfg.customConds || !cfg.customConds[0]?.f)) {
        showToast('Add at least one condition');
        return;
      }
      goStep(3);
    } else if (step === 3) {
      handleSave();
    }
  };

  const handleBack = () => {
    if (step === 3) goStep(2);
    else if (step === 2) goStep(1);
  };

  const handleSave = () => {
    if (!name.trim()) {
      showToast('Rule name is required');
      return;
    }
    const actList = Object.entries(acts).filter(([, v]) => v).map(([k]) => k);
    if (!actList.length) {
      showToast('Select at least one action');
      return;
    }
    const conds = buildConds(tmpl, cfg);
    const rule = {
      ...(isEdit ? { id: editRule.id } : {}),
      name: name.trim(),
      desc: desc.trim(),
      behavior,
      conds,
      logic: cfg.logic || 'AND',
      acts: actList,
      on: enabled,
      by: 'Admin',
      at: '15 Apr, 2026',
    };
    saveRule(rule);
    showToast(isEdit ? `"${name}" updated` : `"${name}" created`);
    onClose();
  };

  const preview = tmpl ? buildPreview(tmpl, cfg, behavior) : null;

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="bg-surface rounded-lg shadow-xl w-[720px] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header with step dots */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-base font-semibold">{isEdit ? 'Edit Alert Rule' : 'Create Alert Rule'}</span>
            <div className="flex gap-1">
              {[1, 2, 3].map(s => (
                <span
                  key={s}
                  className={`h-2 rounded-full transition-all ${
                    s === step ? 'w-5 bg-primary' :
                    s < step ? 'w-2 bg-success' :
                    'w-2 bg-border'
                  }`}
                />
              ))}
            </div>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-xl text-text-secondary">&times;</button>
        </div>

        {/* Step 1: Choose Alert Type */}
        {step === 1 && (
          <div className="p-5">
            <div className="mb-4">
              <div className="text-sm font-semibold text-text">What do you want to check?</div>
              <div className="text-xs text-text-secondary mt-0.5">Choose an alert type. Each comes with sensible defaults you can customize.</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {templateDefs.map(t => (
                <div
                  key={t.key}
                  onClick={() => pickTemplate(t.key)}
                  className="flex items-center gap-3 p-3.5 px-4 border-2 border-border rounded-lg cursor-pointer transition-all hover:border-primary hover:bg-[#F8F9FF]"
                >
                  <TemplateIcon icon={t.icon} className={`${t.iconBg} ${t.iconColor}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-text">{t.title}</div>
                    <div className="text-[11px] text-text-secondary mt-0.5 leading-snug">{t.desc}</div>
                  </div>
                  {t.pill && <SeverityPill type={t.pill} />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Configure */}
        {step === 2 && (
          <div className="p-5">
            <button
              onClick={() => goStep(1)}
              className="flex items-center gap-1 text-xs text-primary bg-transparent border-none cursor-pointer mb-3 p-1 rounded hover:bg-primary-light font-medium"
            >
              <ChevronLeft size={14} /> Change type
            </button>

            {renderConfigComponent(tmpl, cfg, setCfg)}

            <div className="border-t border-border mt-4 pt-4">
              {/* Behavior picker */}
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">When this alert is triggered, it should...</label>
              <div className="flex gap-3 mb-4">
                <div
                  onClick={() => selectBehavior('flag')}
                  className={`flex-1 flex items-center gap-2.5 p-3.5 px-4 border-2 rounded-lg cursor-pointer transition-all ${
                    behavior === 'flag' ? 'border-flag bg-flag-bg' : 'border-border hover:border-[#B0BEC5]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-flag shrink-0" />
                  <div>
                    <div className="text-[13px] font-semibold">Flag for review</div>
                    <div className="text-[11px] text-text-secondary mt-0.5">Shows alert. Approver can still approve.</div>
                  </div>
                </div>
                <div
                  onClick={() => selectBehavior('block')}
                  className={`flex-1 flex items-center gap-2.5 p-3.5 px-4 border-2 rounded-lg cursor-pointer transition-all ${
                    behavior === 'block' ? 'border-block bg-block-bg' : 'border-border hover:border-[#B0BEC5]'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-block shrink-0" />
                  <div>
                    <div className="text-[13px] font-semibold">Block approval</div>
                    <div className="text-[11px] text-text-secondary mt-0.5">Prevents approval until resolved.</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wider">When this rule triggers</label>
              <div className="flex flex-col gap-2 mb-4">
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input type="checkbox" checked={acts.flag_invoice} onChange={() => toggleAct('flag_invoice')} /> Flag Invoice <span className="text-text-secondary text-[11px]">-- show alert indicator on invoice</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input type="checkbox" checked={acts.block_approval} onChange={() => toggleAct('block_approval')} /> Block Approval <span className="text-text-secondary text-[11px]">-- prevent approval until resolved</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input type="checkbox" checked={acts.auto_approve} onChange={() => toggleAct('auto_approve')} /> Auto-Approve <span className="text-text-secondary text-[11px]">-- auto approve matching invoices</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input type="checkbox" checked={acts.require_review} onChange={() => toggleAct('require_review')} /> Require Senior Review
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[13px]">
                  <input type="checkbox" checked={acts.send_notification} onChange={() => toggleAct('send_notification')} /> Send Notification
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Name & Review */}
        {step === 3 && (
          <div className="p-5">
            <button
              onClick={() => goStep(2)}
              className="flex items-center gap-1 text-xs text-primary bg-transparent border-none cursor-pointer mb-3 p-1 rounded hover:bg-primary-light font-medium"
            >
              <ChevronLeft size={14} /> Back to configuration
            </button>

            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wider">Rule Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg text-sm text-text font-medium outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1 uppercase tracking-wider">Description</label>
                <textarea
                  rows={2}
                  placeholder="Optional -- describe what this rule checks"
                  value={desc}
                  onChange={e => setDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-border rounded-lg text-[13px] text-text outline-none resize-y focus:border-primary"
                />
              </div>

              {/* Live preview */}
              {preview && (
                <div className="bg-bg border border-border rounded-lg p-4">
                  <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">Rule Preview</div>
                  <div className="text-sm text-text leading-relaxed">
                    <div className="mb-2" dangerouslySetInnerHTML={{ __html: `When ${preview.condText} &rarr;` }} />
                    <div className={`font-semibold ${preview.behColor}`}>
                      {preview.behLabel}{preview.behNote}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <label className="relative inline-block w-9 h-5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={e => setEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <span className="absolute inset-0 bg-[#ccc] rounded-full transition-colors peer-checked:bg-success" />
                  <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                </label>
                <span className="text-[13px]">Rule is active</span>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <button
            onClick={onClose}
            className="bg-surface text-text border border-border px-4 py-2 rounded text-sm font-medium hover:bg-bg cursor-pointer"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="bg-surface text-text border border-border px-4 py-2 rounded text-sm font-medium hover:bg-bg cursor-pointer"
              >
                Back
              </button>
            )}
            {step > 1 && (
              <button
                onClick={handleNext}
                className="bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#354499] cursor-pointer"
              >
                {step === 3 ? 'Save Rule' : 'Next'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
