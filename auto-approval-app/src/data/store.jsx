import { useState, createContext, useContext } from 'react';

const StoreContext = createContext();

// ───────────────────────────────────────────────────────────────────────────────
// Auto-approval validations — system-defined, grouped into 3 categories.
// Cat 1 + Cat 2 = configurable (toggle, threshold). Cat 3 = locked (always on).
// PM sees friendly names + descriptions, not the snake_case ids or rule regex.
// ───────────────────────────────────────────────────────────────────────────────
export const VALIDATION_CATEGORIES = {
  1: { name: 'Data extraction', desc: 'OCR pulled clean, well-formed data from the upload.' },
  2: { name: 'Business rules',  desc: 'The document represents a valid, in-policy purchase.' },
  3: { name: 'Fraud detection', desc: 'Looks for duplicate, tampered, or fraudulent submissions. Always on.' },
};

// Each validation has:
//   id, category, friendly name, desc (template — supports {fieldName} placeholders for inline value chips),
//   optional thresholds: [{ field, label, unit, defaultValue, hint }]
// Cat 3 toggle is locked; Cat 3 thresholds are still editable.
export const VALIDATION_META = [
  // Cat 1 — Data extraction
  { id: 'required_fields_extracted', category: 1, name: 'Required fields extracted',
    desc: 'Confirms OCR pulled the stockist name, statement date, total amount, and at least one line item.' },
  { id: 'statement_date_present', category: 1, name: 'Statement date present',
    desc: 'At least one parseable date is read from the document.' },
  { id: 'total_amount_sanity', category: 1, name: 'Invoice amount within allowed range',
    desc: 'Total invoice amount is above zero and below {maxAmount}.',
    thresholds: [
      { field: 'maxAmount', label: 'Maximum invoice amount', unit: '₹', defaultValue: 10000000, hint: 'Flag if invoice total exceeds this' },
    ] },
  { id: 'gst_present', category: 1, name: 'GSTIN present on document',
    desc: 'The document contains a 15-character GSTIN somewhere on it.' },
  { id: 'gst_format_valid', category: 1, name: 'GSTIN format valid',
    desc: 'The GSTIN matches the official format (state code, PAN segment, check digit).' },

  // Cat 2 — Business rules
  { id: 'gst_verified', category: 2, name: 'GSTIN verified via gov portal',
    desc: 'Calls the GST gov-portal API to confirm the GSTIN is registered and active. (Future — disabled until API access is provisioned.)',
    locked: true, defaultOn: false },
  { id: 'stockist_match', category: 2, name: 'Stockist is in the program\'s stockist list',
    desc: 'The stockist name on the document matches a registered stockist for this program.' },
  { id: 'purchase_date_range', category: 2, name: 'Purchase date in valid range',
    desc: 'Statement date can\'t be in the future or older than {maxAgeDays}.',
    thresholds: [
      { field: 'maxAgeDays', label: 'Maximum age', unit: 'days', defaultValue: 180, hint: 'Flag if statement is older than this' },
    ] },
  { id: 'value_stockist_new', category: 2, name: 'Stockist registered',
    desc: 'The stockist appears in the program\'s registered stockist list (not a new/unknown supplier).' },

  // Cat 3 — Fraud detection (toggle locked, thresholds editable where present)
  { id: 'duplicate_exact', category: 3, name: 'Duplicate invoice (exact)',
    desc: 'Same invoice number, total amount, or line-item set already submitted by anyone.' },
  { id: 'duplicate_cross_member', category: 3, name: 'Duplicate across members',
    desc: 'Same invoice key submitted by a different retailer — possible collusion.' },
  { id: 'duplicate_near_match', category: 3, name: 'Near-match duplicate',
    desc: 'Same retailer + supplier + amount (±₹1) + date (±2 days) within the last 30 days.' },
  { id: 'image_exif_missing', category: 3, name: 'Image EXIF stripped',
    desc: 'Photo has no EXIF metadata — common for re-encoded/re-saved files.' },
  { id: 'image_exif_editor', category: 3, name: 'Image edited in software',
    desc: 'Photo\'s EXIF Software field shows it was opened in Photoshop, GIMP, Snapseed, or similar.' },
  { id: 'image_capture_vs_upload_skew', category: 3, name: 'Capture-vs-upload time skew',
    desc: 'Photo was taken more than 24 hours before upload, or its capture time is in the future.' },
  { id: 'image_ela_hotspot', category: 3, name: 'Image alteration hotspot',
    desc: 'Error-Level Analysis detects pixel inconsistencies near the amount or date region.' },
  { id: 'image_double_compression', category: 3, name: 'Double-compressed JPEG',
    desc: 'JPEG quantization tables are inconsistent with a single-pass save — image was edited and re-saved.' },
  { id: 'value_math_mismatch', category: 3, name: 'Line-item math mismatch',
    desc: 'Sum of line items + tax doesn\'t equal the stated total.' },
  { id: 'value_amount_zscore', category: 3, name: 'Amount unusually high',
    desc: 'Total is a statistical outlier vs this retailer\'s last-90-day pattern.' },
  { id: 'velocity_burst', category: 3, name: 'Submission burst',
    desc: '{hourlyLimit}+ claims from this retailer in the last hour, or {dailyLimit}+ in the last 24 hours.',
    thresholds: [
      { field: 'hourlyLimit', label: 'Claims per hour', unit: 'claims', defaultValue: 5, hint: 'Flag if exceeded' },
      { field: 'dailyLimit',  label: 'Claims per 24 hours', unit: 'claims', defaultValue: 15, hint: 'Flag if exceeded' },
    ] },
  { id: 'velocity_dormancy_spike', category: 3, name: 'Dormancy spike',
    desc: 'Retailer\'s first claim in {daysDormant} and the amount is more than {multiplier} their prior median.',
    thresholds: [
      { field: 'daysDormant', label: 'Days dormant', unit: 'days', defaultValue: 60, hint: 'Trigger after this period of inactivity' },
      { field: 'multiplier',  label: 'Amount multiplier', unit: 'x', defaultValue: 3, hint: 'Trigger when amount is this many times the prior median' },
    ] },
  { id: 'ocr_low_confidence_total', category: 3, name: 'Low OCR confidence',
    desc: 'OCR engine reports below-threshold confidence on the total amount.' },
  { id: 'ocr_provider_disagreement', category: 3, name: 'OCR engines disagree',
    desc: 'Two OCR engines (Textract + DocumentAI) disagree on the total amount or stockist name.' },
  { id: 'ocr_text_below_amount', category: 3, name: 'Sparse text near total',
    desc: 'Document has very little text for its claimed amount — possible synthetic receipt.' },
  { id: 'cross_repeat_line_items', category: 3, name: 'Repeated line items',
    desc: 'Identical line-item list submitted {timesLimit}+ times by this retailer in the last {windowDays}.',
    thresholds: [
      { field: 'timesLimit', label: 'Times submitted', unit: 'times', defaultValue: 3, hint: 'Trigger at or above this count' },
      { field: 'windowDays', label: 'Within window', unit: 'days', defaultValue: 60, hint: 'Look-back window' },
    ] },
  { id: 'cross_threshold_gaming', category: 3, name: 'Threshold gaming',
    desc: 'Claim amount is within ±{percentMargin} of a reward threshold — possible amount manipulation.',
    thresholds: [
      { field: 'percentMargin', label: 'Margin around reward threshold', unit: '%', defaultValue: 2, hint: 'Trigger when claim falls within this margin of a threshold' },
    ] },
];

// Build initial settings state from the meta catalog.
const initialAutoApprovalSettings = VALIDATION_META.map(v => {
  const base = { id: v.id, on: v.defaultOn !== undefined ? v.defaultOn : true };
  (v.thresholds || []).forEach(t => { base[t.field] = t.defaultValue; });
  return base;
});

const initialRules = [
  { id: 'RULE-001', name: 'High value invoice', desc: 'Flag invoices exceeding amount threshold for review', behavior: 'flag', groups: [[{ f: 'totalAmount', op: 'gte', val: '' }]], acts: ['flag_invoice', 'require_review'], on: false, by: 'Admin', at: '15 Mar, 2026' },
];

const initialInvoices = [
  // Custom alert — High value invoice (RULE-001). Red indicator on list.
  { claimId: 1257, type: 'Claims', num: 'INV-2026-05100', partner: 'SADGURU AGENCY', member: 'M-44021', amount: 78500, date: '14 Apr, 2026 09:22:10', invDate: '12 Apr, 2026', status: 'pending', ocrConfidence: 95, supplier: 'SADGURU AGENCY', customer: 'HEALTH MART CHEMIST', authDist: 'SADGURU AGENCY', partnerId: '5567890', totalClaims: 8, lastClaim: '14 Apr, 2026', lineItems: [{ code: 'PHR-101', name: 'Insulin Pen 3ml', qty: 50, price: 1200, amount: 60000 }, { code: 'PHR-102', name: 'Glucose Monitor Kit', qty: 25, price: 740, amount: 18500 }], alerts: [{ ruleId: 'RULE-001', ruleName: 'High value invoice', msg: 'Invoice value \u20b978,500 exceeds threshold of \u20b950,000' }], pastInvoices: [] },
  // Built-in alert — Line item sum mismatch. Amber banner in detail.
  { claimId: 1209, type: 'Claims', num: 'FE-25-310468', partner: 'FOCUS MEDISALES', member: 'M-70184', amount: 5200, date: '13 Apr, 2026 13:47:59', invDate: '08 Apr, 2026', status: 'pending', ocrConfidence: 72, supplier: 'FOCUS MEDISALES PVT LTD', customer: 'Priya Retail', authDist: 'FOCUS MEDISALES PVT LTD', partnerId: '9012345', totalClaims: 5, lastClaim: '13 Apr, 2026', lineItems: [{ code: 'MED-2201', name: 'TAIXIN FORCE DRY SYRUP', qty: 10, price: 285, amount: 2850 }, { code: 'MED-2205', name: 'MAGNALOR TONIC CAPS', qty: 15, price: 135.67, amount: 2035 }], alerts: [{ system: true, ruleName: 'Line item sum mismatch', msg: 'Line items sum to \u20b94,885 but invoice total is \u20b95,200 (difference: \u20b9315)' }], pastInvoices: [] },
  // Built-in alert — Duplicate invoice number. Shares INV-2026-05201 with claim 1180.
  { claimId: 1195, type: 'Warranty', num: 'INV-2026-05201', partner: 'NEW GARODIA DISTRIBUTORS', member: 'M-55498', amount: 1387, date: '10 Apr, 2026 21:03:30', invDate: '10 Apr, 2026', status: 'pending', ocrConfidence: 91, supplier: 'NEW GARODIA DISTRIBUTORS', customer: 'dia medical', authDist: 'NEW GARODIA DISTRIBUTORS', partnerId: '1234567', totalClaims: 3, lastClaim: '10 Apr, 2026', lineItems: [{ code: 'PHR-002', name: 'Paracetamol 500mg', qty: 20, price: 69.35, amount: 1387 }], alerts: [{ system: true, ruleName: 'Duplicate invoice number', msg: 'Invoice number INV-2026-05201 has been submitted previously' }], pastInvoices: [] },
  // Auto-approved invoice — matched AR-001 (Low Value Claims, scan quality 94%). No alerts.
  { claimId: 1190, type: 'Claims', num: '250007300387493', partner: 'SADGURU AGENCY', member: 'M-42017', amount: 2009, date: '10 Apr, 2026 10:08:45', invDate: '09 Apr, 2026', status: 'approved', ocrConfidence: 94, autoApprovedByRuleId: 'AR-001', supplier: 'SADGURU AGENCY', customer: 'HEALTH MART CHEMIST', authDist: 'SADGURU AGENCY', partnerId: '5567890', totalClaims: 8, lastClaim: '10 Apr, 2026', lineItems: [{ code: 'PHR-003', name: 'Antibiotic Tab', qty: 4, price: 502.25, amount: 2009 }], alerts: [], pastInvoices: [] },
  // Custom alert — High value invoice (RULE-001). Red indicator on list.
  { claimId: 1185, type: 'Claims', num: '140556', partner: 'Unknown Pharma Dist.', member: 'M-33102', amount: 62350, date: '10 Apr, 2026 17:33:12', invDate: '08 Apr, 2026', status: 'pending', ocrConfidence: 67, supplier: 'Unknown Pharma Dist.', customer: 'City Chemist', authDist: 'Metro Distributors', partnerId: '7890123', totalClaims: 1, lastClaim: '10 Apr, 2026', lineItems: [{ code: 'PHR-004', name: 'Injection Vial 10ml', qty: 120, price: 382.71, amount: 45925.20 }, { code: 'PHR-006', name: 'Syringe Pack 5ml', qty: 200, price: 82.12, amount: 16424.80 }], alerts: [{ ruleId: 'RULE-001', ruleName: 'High value invoice', msg: 'Invoice value \u20b962,350 exceeds threshold of \u20b950,000' }], pastInvoices: [] },
  // Built-in alert — Duplicate invoice number. Shares INV-2026-05201 with claim 1195.
  { claimId: 1180, type: 'Claims', num: 'INV-2026-05201', partner: 'FOCUS MEDISALES', member: 'M-60215', amount: 4592.53, date: '09 Apr, 2026 14:20:05', invDate: '08 Apr, 2026', status: 'pending', ocrConfidence: 89, supplier: 'FOCUS MEDISALES PVT LTD', customer: 'Sunrise Pharmacy', authDist: 'FOCUS MEDISALES PVT LTD', partnerId: '9012345', totalClaims: 7, lastClaim: '09 Apr, 2026', lineItems: [{ code: 'PHR-004', name: 'Injection Vial 10ml', qty: 12, price: 382.71, amount: 4592.53 }], alerts: [{ system: true, ruleName: 'Duplicate invoice number', msg: 'Invoice number INV-2026-05201 has been submitted previously' }], pastInvoices: [] },
  // Built-in alert — Unable to fetch details. OCR could not extract line items.
  { claimId: 1175, type: 'Claims', num: '25000730046250B', partner: 'SUDHIR MEDICAL STORES', member: 'M-51207', amount: 2047, date: '09 Apr, 2026 11:42:18', invDate: '07 Mar, 2026', status: 'pending', ocrConfidence: 42, supplier: 'SUDHIR MEDICAL STORES', customer: 'SUDHIR MEDICAL STORES', authDist: 'SUDHIR MEDICAL STORES', partnerId: '5567890', totalClaims: 3, lastClaim: '09 Apr, 2026', lineItems: [], alerts: [{ system: true, ruleName: 'Unable to fetch details', msg: 'OCR could not extract line items from the submitted invoice' }], pastInvoices: [] },
  // Clean invoice — no alerts. Green banner in detail.
  { claimId: 1170, type: 'Claims', num: 'INV-2026-05308', partner: 'GREENLEAF PHARMA', member: 'M-63104', amount: 1845, date: '08 Apr, 2026 18:21:07', invDate: '06 Apr, 2026', status: 'pending', ocrConfidence: 92, supplier: 'GREENLEAF PHARMA', customer: 'GREENLEAF CHEMIST', authDist: 'GREENLEAF PHARMA', partnerId: '4433221', totalClaims: 4, lastClaim: '08 Apr, 2026', lineItems: [{ code: 'PHR-008', name: 'Iron Supplement Tab', qty: 15, price: 123, amount: 1845 }], alerts: [], pastInvoices: [] },
];

export function StoreProvider({ children }) {
  const [rules, setRules] = useState(initialRules);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [toast, setToast] = useState(null);
  const [uiNotes, setUiNotes] = useState(false);
  const toggleUiNotes = () => setUiNotes(prev => !prev);

  // Master on/off for the entire auto-approval subsystem.
  // Gated by `editClaimsSettings` RBAC permission (not enforced in the prototype yet).
  const [autoApprovalEnabled, setAutoApprovalEnabled] = useState(true);
  const toggleAutoApprovalEnabled = () => setAutoApprovalEnabled(prev => !prev);

  // Auto-approval settings — one row per validation, with on-flag + optional threshold values.
  const [autoApprovalSettings, setAutoApprovalSettings] = useState(initialAutoApprovalSettings);
  const toggleValidation = (id) => {
    setAutoApprovalSettings(prev => prev.map(v => v.id === id ? { ...v, on: !v.on } : v));
  };
  const setValidationThreshold = (id, field, value) => {
    setAutoApprovalSettings(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const [approveRules, setApproveRules] = useState([
    { id: 'AR-001', name: 'Low Value Claims', priority: 1, on: true, minScanQuality: '80', desc: 'Auto-approve claims under ₹10,000 with a readable scan.', groups: [[{ f: 'totalAmount', op: 'lte', val: '10000' }]] },
  ]);
  const toggleApproveRule = (id) => setApproveRules(prev => prev.map(r => r.id === id ? { ...r, on: !r.on } : r));
  const saveApproveRule = (rule) => {
    setApproveRules(prev => {
      const idx = prev.findIndex(r => r.id === rule.id);
      if (idx >= 0) return prev.map(r => r.id === rule.id ? rule : r);
      return [...prev, { ...rule, id: 'AR-' + String(prev.length + 1).padStart(3, '0'), priority: prev.length + 1 }];
    });
  };
  const reorderApproveRules = (from, to) => {
    setApproveRules(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated.map((r, i) => ({ ...r, priority: i + 1 }));
    });
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const toggleRule = (id) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, on: !r.on } : r));
  };

  const saveRule = (rule) => {
    setRules(prev => {
      const idx = prev.findIndex(r => r.id === rule.id);
      if (idx >= 0) return prev.map(r => r.id === rule.id ? rule : r);
      return [...prev, { ...rule, id: 'RULE-' + String(prev.length + 1).padStart(3, '0') }];
    });
  };

  const deleteRule = (id) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const archiveRule = (id) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, on: false, archived: true } : r));
  };

  const duplicateRule = (id) => {
    setRules(prev => {
      const src = prev.find(r => r.id === id);
      if (!src) return prev;
      return [...prev, { ...JSON.parse(JSON.stringify(src)), id: 'RULE-' + String(prev.length + 1).padStart(3, '0'), name: src.name + ' (copy)', on: false }];
    });
  };

  const updateAlert = (invoiceIdx, alertIdx, updates) => {
    setInvoices(prev => prev.map((inv, i) => {
      if (i !== invoiceIdx) return inv;
      return { ...inv, alerts: inv.alerts.map((a, j) => j === alertIdx ? { ...a, ...updates } : a) };
    }));
  };

  return (
    <StoreContext.Provider value={{ rules, invoices, toast, showToast, toggleRule, saveRule, deleteRule, duplicateRule, archiveRule, updateAlert, uiNotes, toggleUiNotes, approveRules, toggleApproveRule, saveApproveRule, reorderApproveRules, autoApprovalEnabled, toggleAutoApprovalEnabled, autoApprovalSettings, toggleValidation, setValidationThreshold }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
