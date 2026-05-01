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
  { id: 'statement_date_present', category: 1, name: 'Statement date present',
    desc: 'At least one parseable date is read from the document.' },
  { id: 'total_amount_sanity', category: 1, name: 'Invoice amount within allowed range',
    desc: 'Total invoice amount is above zero and below {maxAmount}.',
    thresholds: [
      { field: 'maxAmount', label: 'Maximum invoice amount', unit: '₹', defaultValue: 10000000, hint: 'Flag if invoice total exceeds this' },
    ] },

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
  { id: 'gst_valid_present', category: 3, name: 'GSTIN valid and present',
    desc: 'Document is missing a 15-character GSTIN, or the GSTIN does not match the official format (state code, PAN segment, check digit). A genuine stockist invoice always carries a valid GSTIN.' },
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
  { id: 'value_math_mismatch', category: 3, name: 'Line-item math mismatch',
    desc: 'Sum of line items + tax doesn\'t equal the stated total.' },
  { id: 'value_amount_zscore', category: 3, name: 'Amount unusually high',
    desc: 'Total is a statistical outlier vs this retailer\'s last-90-day pattern.' },
  { id: 'velocity_burst', category: 3, name: 'Submission burst',
    desc: 'More than {hourlyLimit} from a retailer in the last hour, or more than {dailyLimit} in the last 24 hours.',
    thresholds: [
      { field: 'hourlyLimit', label: 'Claims per hour', unit: 'claims', defaultValue: 5, hint: 'Flag if exceeded' },
      { field: 'dailyLimit',  label: 'Claims per 24 hours', unit: 'claims', defaultValue: 15, hint: 'Flag if exceeded' },
    ] },
  { id: 'velocity_dormancy_spike', category: 3, name: 'Dormancy spike',
    desc: 'A retailer\'s first claim after {daysDormant} of inactivity, with the amount more than {multiplier} their prior median.',
    thresholds: [
      { field: 'daysDormant', label: 'Days dormant', unit: 'days', defaultValue: 60, hint: 'Trigger after this period of inactivity' },
      { field: 'multiplier',  label: 'Amount multiplier', unit: 'x', defaultValue: 3, hint: 'Trigger when amount is this many times the prior median' },
    ] },
  { id: 'ocr_low_confidence_total', category: 3, name: 'Low OCR confidence',
    desc: 'OCR confidence falls below {confidenceThreshold} on invoices with amount above {amountThreshold}.',
    thresholds: [
      { field: 'amountThreshold',     label: 'Apply above amount',  unit: '₹', defaultValue: 100000000, hint: 'Skip the OCR-confidence check for invoices below this. Set 0 to apply to all.' },
      { field: 'confidenceThreshold', label: 'Confidence threshold', unit: '%', defaultValue: 80,        hint: 'Flag the claim if OCR confidence falls below this' },
    ] },
  { id: 'ocr_provider_disagreement', category: 3, name: 'OCR engines disagree',
    desc: 'Two OCR engines (Textract + DocumentAI) disagree on the total amount or stockist name.' },
  { id: 'cross_repeat_line_items', category: 3, name: 'Repeated line items',
    desc: 'The same line-item list submitted by a retailer {timesLimit} or more in the last {windowDays}.',
    thresholds: [
      { field: 'timesLimit', label: 'Times submitted', unit: 'times', defaultValue: 3, hint: 'Trigger at or above this count' },
      { field: 'windowDays', label: 'Within window', unit: 'days', defaultValue: 60, hint: 'Look-back window' },
    ] },
];

// Build initial settings state from the meta catalog.
// All categories default OFF — the master toggle is OFF by default and Cat 1, 2,
// AND Cat 3 children all cascade with the master. The user can independently
// toggle Cat 1 and Cat 2 rules once auto-approval is on; Cat 3 stays locked to
// the master toggle.
const initialAutoApprovalSettings = VALIDATION_META.map(v => {
  const defaultOn = v.defaultOn !== undefined ? v.defaultOn : false;
  const base = { id: v.id, on: defaultOn };
  (v.thresholds || []).forEach(t => { base[t.field] = t.defaultValue; });
  return base;
});

// ───────────────────────────────────────────────────────────────────────────────
// Outcome derivation
//
// validationResults shape (per invoice):
//   {
//     evaluatedCategories: [1, 2, 3],   // which categories actually ran
//     failures: [{ id: <validation_id>, finding: 'specific reason text' }]
//   }
//
// Outcome rules:
//   - All evaluated cats passed (no failures) → AUTO_APPROVED
//   - Any failure in Cat 1 or Cat 2 → NEEDS_REVIEW (no risk axis — completeness/eligibility issue)
//   - Only Cat 3 failures → SUSPICIOUS, risk derived from cumulative INFO/WARN/HIGH score
// ───────────────────────────────────────────────────────────────────────────────

// Severity per Cat 3 detector. Only Cat 3 has the cumulative score.
export const CAT3_SEVERITY = {
  gst_valid_present: 'WARN',
  duplicate_exact: 'HIGH',
  duplicate_cross_member: 'HIGH',
  duplicate_near_match: 'WARN',
  image_exif_missing: 'INFO',
  image_exif_editor: 'HIGH',
  value_math_mismatch: 'WARN',
  value_amount_zscore: 'WARN',
  velocity_burst: 'WARN',
  velocity_dormancy_spike: 'WARN',
  ocr_low_confidence_total: 'WARN',
  ocr_provider_disagreement: 'HIGH',
  cross_repeat_line_items: 'WARN',
};

export const SEVERITY_WEIGHT = { INFO: 3, WARN: 15, HIGH: 40 };

// ───────────────────────────────────────────────────────────────────────────────
// Presentation status — single source of truth for the unified status column.
//
// Combines `decisionStatus` (the platform's authoritative state) with the
// auto-approval verdict (the system's read of the claim) into one set of keys
// for display:
//
//   final states  → auto_approved | approved | rejected | failed
//                   ("approved" = a human approved a claim that wasn't auto-clean —
//                    i.e. needs_review or suspicious that got overridden.)
//   pending states → needs_review | suspicious_low | suspicious_medium |
//                    suspicious_high | unknown
//                   ("unknown" = "—" for legacy / pre-rollout claims that never
//                    went through the auto-approval pipeline.)
//
// validationResults presence is the gate: if the claim has results, the
// pipeline ran on it and we can display the verdict — even if the master
// toggle is currently off (the verdict was computed when the pipeline ran).
// Settings toggles still filter the failures while master is on, so the
// verdict remains responsive to the user's tweaks.
//
// Non-breaking: derived from existing fields, no schema change.
// ───────────────────────────────────────────────────────────────────────────────
export function derivePresentationStatus(inv, autoApprovalEnabled, autoApprovalSettings) {
  const decision = inv.decisionStatus || 'pending';

  if (decision === 'rejected') return { key: 'rejected' };
  if (decision === 'failed')   return { key: 'failed' };

  const hasResults = !!inv.validationResults;
  let verdict = null;
  if (hasResults) {
    let failures = inv.validationResults.failures || [];
    // Filter by enabled settings only while the master is on. With master off
    // we read the unfiltered failures so the verdict reflects what the
    // pipeline saw at submission time.
    if (autoApprovalEnabled) {
      const enabledIds = new Set((autoApprovalSettings || []).filter(s => s.on).map(s => s.id));
      failures = failures.filter(f => enabledIds.has(f.id));
    }
    verdict = deriveOutcome({ ...inv.validationResults, failures });
  }

  if (decision === 'approved') {
    if (verdict && verdict.status === 'auto_approved') return { key: 'auto_approved' };
    return { key: 'approved' };
  }

  // decision === 'pending'
  if (!hasResults) return { key: 'unknown' };
  if (verdict.status === 'auto_approved') return { key: 'auto_approved' };
  if (verdict.status === 'needs_review')  return { key: 'needs_review' };
  if (verdict.status === 'suspicious') {
    const risk = verdict.risk === 'low' ? 'low' : 'high';
    return { key: `suspicious_${risk}`, risk };
  }
  return { key: 'unknown' };
}

export function deriveOutcome(validationResults) {
  if (!validationResults) return { status: 'pending' };
  const { failures = [], evaluatedCategories = [1, 2, 3] } = validationResults;

  if (failures.length === 0) return { status: 'auto_approved', evaluatedCategories };

  const findCategory = (id) => {
    const meta = VALIDATION_META.find(m => m.id === id);
    return meta ? meta.category : null;
  };

  const cat1or2Fail = failures.some(f => {
    const cat = findCategory(f.id);
    return cat === 1 || cat === 2;
  });
  if (cat1or2Fail) {
    return { status: 'needs_review', failures, evaluatedCategories };
  }

  // All failures are Cat 3 — compute cumulative risk. Two tiers only: low / high.
  // High triggers when any single signal is HIGH-severity, or when the cumulative
  // score crosses 25 (≈ two WARN-level signals stacking).
  let score = 0;
  let anyHigh = false;
  failures.forEach(f => {
    const sev = CAT3_SEVERITY[f.id] || 'WARN';
    score += SEVERITY_WEIGHT[sev];
    if (sev === 'HIGH') anyHigh = true;
  });
  score = Math.min(100, score);
  const risk = anyHigh || score >= 25 ? 'high' : 'low';

  return { status: 'suspicious', risk, score, failures, evaluatedCategories };
}

const initialRules = [
  { id: 'RULE-001', name: 'High value invoice', desc: 'Flag invoices exceeding amount threshold for review', behavior: 'flag', groups: [[{ f: 'totalAmount', op: 'gte', val: '' }]], acts: ['flag_invoice', 'require_review'], on: false, by: 'Admin', at: '15 Mar, 2026' },
];

// Sample invoices — each carries a `validationResults` driving the auto-approval outcome.
// Mix covers all four states: AUTO_APPROVED, NEEDS_REVIEW (Cat 1 & Cat 2), SUSPICIOUS (Low/Med/High).
const initialInvoices = [
  // ── AUTO-APPROVED ─────────────────────────────────────────────────────────
  // Clean pass — small claim from a registered stockist, all 27 checks pass.
  { claimId: 1190, type: 'Claims', num: '250007300387493', partner: 'SADGURU AGENCY', member: 'M-42017',
    amount: 2009, date: '10 Apr, 2026 10:08:45', invDate: '09 Apr, 2026',
    ocrConfidence: 94, supplier: 'SADGURU AGENCY', customer: 'HEALTH MART CHEMIST',
    authDist: 'SADGURU AGENCY', partnerId: '5567890', totalClaims: 8, lastClaim: '10 Apr, 2026',
    rewardPoints: 200,
    decisionStatus: 'approved',
    lineItems: [
      { code: 'PHR-003', name: 'Amoxicillin 250mg Cap', qty: 4, price: 502.25, amount: 2009.00 },
      { code: 'PHR-011', name: 'Cetirizine 10mg Tab',   qty: 6, price: 32.50,  amount: 195.00 },
      { code: 'PHR-019', name: 'Vitamin D3 60K Sachet', qty: 8, price: 45.00,  amount: 360.00 },
      { code: 'PHR-024', name: 'Pantoprazole 40mg Tab', qty: 5, price: 28.20,  amount: 141.00 },
    ],
    validationResults: { evaluatedCategories: [1, 2, 3], failures: [] },
    alerts: [], pastInvoices: [] },

  // Clean pass — second auto-approval for the demo.
  { claimId: 1170, type: 'Claims', num: 'INV-2026-05308', partner: 'GREENLEAF PHARMA', member: 'M-63104',
    amount: 1845, date: '08 Apr, 2026 18:21:07', invDate: '06 Apr, 2026',
    ocrConfidence: 92, supplier: 'GREENLEAF PHARMA', customer: 'GREENLEAF CHEMIST',
    authDist: 'GREENLEAF PHARMA', partnerId: '4433221', totalClaims: 4, lastClaim: '08 Apr, 2026',
    rewardPoints: 184,
    decisionStatus: 'approved',
    lineItems: [
      { code: 'PHR-008', name: 'Iron Supplement Tab', qty: 15, price: 123.00, amount: 1845.00 },
      { code: 'PHR-014', name: 'Calcium + D3 Tab',    qty: 12, price: 89.50,  amount: 1074.00 },
      { code: 'PHR-021', name: 'Multivitamin Cap',    qty: 10, price: 67.20,  amount: 672.00 },
    ],
    validationResults: { evaluatedCategories: [1, 2, 3], failures: [] },
    alerts: [], pastInvoices: [] },

  // ── NEEDS REVIEW — Cat 1 (data extraction) ───────────────────────────────
  // OCR couldn't read line items. Cat 2 skipped (depends on extracted data).
  // Cat 3 fraud detectors with metadata-only inputs still ran and found nothing.
  { claimId: 1175, type: 'Claims', num: '25000730046250B', partner: 'SUDHIR MEDICAL STORES', member: 'M-51207',
    amount: 2047, date: '09 Apr, 2026 11:42:18', invDate: '07 Mar, 2026',
    ocrConfidence: 42, supplier: 'SUDHIR MEDICAL STORES', customer: 'SUDHIR MEDICAL STORES (K1208)',
    authDist: 'SUDHIR MEDICAL STORES', partnerId: '1234567', totalClaims: 154, lastClaim: '29 Apr, 2026',
    rewardPoints: 210,
    decisionStatus: 'pending',
    lineItems: [
      { code: 'PHR-031', name: 'Amlodipine 5mg Tab', qty: 12, price: 56.25,  amount: 675.00 },
      { code: 'PHR-042', name: 'Metformin 500mg Tab', qty: 18, price: 42.00,  amount: 756.00 },
      { code: 'PHR-058', name: 'Atorvastatin 10mg Tab', qty: 8,  price: 77.00,  amount: 616.00 },
    ],
    validationResults: {
      evaluatedCategories: [1, 3],
      failures: [
        { id: 'statement_date_present', finding: 'OCR could not detect a parseable date anywhere on the document.' },
        { id: 'ocr_low_confidence_total', finding: 'OCR confidence on total amount is 42% (threshold: 70%).' },
      ],
    },
    alerts: [],
    pastInvoices: [
      { num: 'GST/0054/26-27', date: '29 Apr, 2026', status: 'pending', kind: 'image' },
      { num: 'SE25-26/5612',   date: '29 Apr, 2026', status: 'pending', kind: 'pdf' },
      { num: '—',              date: '29 Apr, 2026', status: 'failed',  kind: 'pdf' },
      { num: '—',              date: '29 Apr, 2026', status: 'failed',  kind: 'pdf' },
    ] },

  // Cat 3 — GSTIN missing/invalid on the document (fraud signal).
  { claimId: 1257, type: 'Claims', num: 'INV-2026-05100', partner: 'SADGURU AGENCY', member: 'M-44021',
    amount: 78500, date: '14 Apr, 2026 09:22:10', invDate: '12 Apr, 2026',
    ocrConfidence: 81, supplier: 'SADGURU AGENCY', customer: 'HEALTH MART CHEMIST',
    authDist: 'SADGURU AGENCY', partnerId: '5567890', totalClaims: 8, lastClaim: '14 Apr, 2026',
    decisionStatus: 'pending',
    lineItems: [
      { code: 'PHR-101', name: 'Insulin Pen 3ml', qty: 50, price: 1200, amount: 60000 },
      { code: 'PHR-102', name: 'Glucose Monitor Kit', qty: 25, price: 740, amount: 18500 },
    ],
    validationResults: {
      evaluatedCategories: [1, 2, 3],
      failures: [
        { id: 'gst_valid_present', finding: 'No 15-character GSTIN matching the official format was found on the document.' },
      ],
    },
    alerts: [], pastInvoices: [] },

  // ── NEEDS REVIEW — Cat 2 (business rules) ────────────────────────────────
  // Statement date is older than the configured 180-day max-age.
  { claimId: 1185, type: 'Claims', num: '140556', partner: 'City Chemist', member: 'M-33102',
    amount: 62350, date: '10 Apr, 2026 17:33:12', invDate: '08 Sep, 2025',
    ocrConfidence: 88, supplier: 'Metro Distributors', customer: 'City Chemist',
    authDist: 'Metro Distributors', partnerId: '7890123', totalClaims: 1, lastClaim: '10 Apr, 2026',
    decisionStatus: 'rejected',
    lineItems: [
      { code: 'PHR-004', name: 'Injection Vial 10ml', qty: 120, price: 382.71, amount: 45925.20 },
      { code: 'PHR-006', name: 'Syringe Pack 5ml', qty: 200, price: 82.12, amount: 16424.80 },
    ],
    validationResults: {
      evaluatedCategories: [1, 2, 3],
      failures: [
        { id: 'purchase_date_range', finding: 'Statement date 08 Sep 2025 is 213 days old (limit: 180 days).' },
      ],
    },
    alerts: [], pastInvoices: [] },

  // ── SUSPICIOUS — Low (one INFO-level Cat 3 signal) ───────────────────────
  // Single weak signal: image EXIF stripped. Score 3 (INFO) → LOW.
  { claimId: 1195, type: 'Warranty', num: 'INV-2026-05201', partner: 'NEW GARODIA DISTRIBUTORS', member: 'M-55498',
    amount: 1387, date: '10 Apr, 2026 21:03:30', invDate: '10 Apr, 2026',
    ocrConfidence: 91, supplier: 'NEW GARODIA DISTRIBUTORS', customer: 'Mr. Kaushal Patel',
    authDist: 'NEW GARODIA DISTRIBUTORS', partnerId: '1234567', totalClaims: 3, lastClaim: '10 Apr, 2026',
    decisionStatus: 'pending',
    qrDetails: { referenceId: '#QR-ABC-123898702118765', productId: 'WRT-2026-001', productName: 'Widget Pro', warrantyDuration: '2 years' },
    lineItems: [
      { code: 'PHR-002', name: 'Paracetamol 500mg', qty: 20, price: 69.35, amount: 1387.00 },
      { code: 'PHR-007', name: 'Azithromycin 500mg', qty: 4, price: 88.50, amount: 354.00 },
      { code: 'PHR-013', name: 'ORS Powder Sachet',  qty: 12, price: 22.00, amount: 264.00 },
      { code: 'PHR-018', name: 'Cough Syrup 100ml',  qty: 3, price: 145.00, amount: 435.00 },
    ],
    validationResults: {
      evaluatedCategories: [1, 2, 3],
      failures: [
        { id: 'image_exif_missing', finding: 'Photo has no EXIF metadata. Common for re-encoded files but not necessarily fraudulent.' },
      ],
    },
    alerts: [], pastInvoices: [] },

  // ── SUSPICIOUS — Medium (two WARN signals stack to score 30) ─────────────
  // Math mismatch + low OCR confidence on total. 15 + 15 = 30 → MEDIUM.
  { claimId: 1209, type: 'Claims', num: 'FE-25-310468', partner: 'FOCUS MEDISALES', member: 'M-70184',
    amount: 5200, date: '13 Apr, 2026 13:47:59', invDate: '08 Apr, 2026',
    ocrConfidence: 68, supplier: 'FOCUS MEDISALES PVT LTD', customer: 'Priya Retail',
    authDist: 'FOCUS MEDISALES PVT LTD', partnerId: '9012345', totalClaims: 5, lastClaim: '13 Apr, 2026',
    decisionStatus: 'pending',
    lineItems: [
      { code: 'MED-2201', name: 'TAIXIN FORCE DRY SYRUP', qty: 10, price: 285, amount: 2850 },
      { code: 'MED-2205', name: 'MAGNALOR TONIC CAPS', qty: 15, price: 135.67, amount: 2035 },
    ],
    validationResults: {
      evaluatedCategories: [1, 2, 3],
      failures: [
        { id: 'value_math_mismatch', finding: 'Line items sum to ₹4,885 but invoice total is ₹5,200 (difference: ₹315).' },
        { id: 'ocr_low_confidence_total', finding: 'OCR confidence on total amount is 68% (threshold: 70%).' },
      ],
    },
    alerts: [], pastInvoices: [] },

  // ── SUSPICIOUS — High (one HIGH-severity Cat 3 signal) ───────────────────
  // Exact duplicate of an earlier submission. HIGH severity → HIGH risk regardless of stack.
  { claimId: 1180, type: 'Claims', num: 'INV-2026-05201', partner: 'FOCUS MEDISALES', member: 'M-60215',
    amount: 4592.53, date: '09 Apr, 2026 14:20:05', invDate: '08 Apr, 2026',
    ocrConfidence: 89, supplier: 'FOCUS MEDISALES PVT LTD', customer: 'Sunrise Pharmacy',
    authDist: 'FOCUS MEDISALES PVT LTD', partnerId: '9012345', totalClaims: 7, lastClaim: '09 Apr, 2026',
    decisionStatus: 'rejected',
    lineItems: [
      { code: 'PHR-004', name: 'Injection Vial 10ml', qty: 12, price: 382.71, amount: 4592.53 },
      { code: 'PHR-006', name: 'Syringe Pack 5ml',    qty: 8,  price: 82.12,  amount: 656.96 },
      { code: 'PHR-009', name: 'Glucose Test Strips', qty: 5,  price: 220.00, amount: 1100.00 },
    ],
    validationResults: {
      evaluatedCategories: [1, 2, 3],
      failures: [
        { id: 'duplicate_exact', finding: 'Invoice number INV-2026-05201 was submitted on 10 Apr 2026 by member M-55498 (NEW GARODIA).' },
      ],
    },
    alerts: [], pastInvoices: [] },

  // ── LEGACY — submitted before auto-approval rolled out ──────────────────
  // No validationResults; the pipeline never ran on this claim. Status pill
  // shows "—" until a human approves or rejects it.
  { claimId: 1142, type: 'Claims', num: 'INV-2025-04922', partner: 'BHARAT MEDISTORE', member: 'M-29410',
    amount: 3450, date: '02 Mar, 2026 09:14:22', invDate: '28 Feb, 2026',
    ocrConfidence: 0, supplier: 'BHARAT MEDISTORE', customer: 'Bharat Medistore',
    authDist: 'BHARAT MEDISTORE', partnerId: '6677889', totalClaims: 22, lastClaim: '02 Mar, 2026',
    decisionStatus: 'pending',
    lineItems: [
      { code: 'PHR-005', name: 'Disprin Tab Strip', qty: 30, price: 18.00, amount: 540.00 },
      { code: 'PHR-012', name: 'Crocin 650mg Tab', qty: 25, price: 36.50, amount: 912.50 },
    ],
    alerts: [], pastInvoices: [] },

  // ── HEAVY FAILURE — abstract-wallpaper-style submission ──────────────────
  // Many failures across all three categories. Used to demo the auto-approval
  // card's accordion + "Show N more" affordance under load.
  { claimId: 1300, type: 'Claims', num: 'IMG-9981-XYZ', partner: 'NOVA HEALTH MART', member: 'M-90021',
    amount: 12500, date: '20 Apr, 2026 22:11:09', invDate: '20 Apr, 2026',
    ocrConfidence: 18, supplier: 'NOVA HEALTH MART', customer: '—',
    authDist: 'NOVA HEALTH MART', partnerId: '5544332', totalClaims: 31, lastClaim: '20 Apr, 2026',
    decisionStatus: 'pending',
    lineItems: [
      { code: 'PHR-077', name: 'Pantoprazole 40mg Tab', qty: 30, price: 95.00,  amount: 2850.00 },
      { code: 'PHR-082', name: 'Telmisartan 40mg Tab',  qty: 25, price: 124.00, amount: 3100.00 },
      { code: 'PHR-091', name: 'Rosuvastatin 10mg Tab', qty: 20, price: 188.00, amount: 3760.00 },
      { code: 'PHR-095', name: 'Glimepiride 2mg Tab',   qty: 15, price: 86.00,  amount: 1290.00 },
      { code: 'PHR-104', name: 'Losartan 50mg Tab',     qty: 10, price: 150.00, amount: 1500.00 },
    ],
    validationResults: {
      evaluatedCategories: [1, 2, 3],
      failures: [
        // Cat 1 — extraction collapse
        { id: 'statement_date_present',    finding: 'No parseable date detected anywhere on the document.' },
        { id: 'total_amount_sanity',       finding: 'Total amount could not be read; sanity check skipped.' },
        // Cat 2 — business rules
        { id: 'stockist_match',            finding: 'Stockist name not extractable, no match attempted.' },
        { id: 'value_stockist_new',        finding: 'Stockist absent from program registry.' },
        { id: 'purchase_date_range',       finding: 'No date to validate against the program window.' },
        // Cat 3 — fraud signals
        { id: 'gst_valid_present',         finding: 'No 15-character GSTIN matching the official format was found on the document.' },
        { id: 'image_exif_missing',        finding: 'No EXIF metadata; file appears re-encoded.' },
        { id: 'image_exif_editor',         finding: 'EXIF Software field references "Adobe Photoshop CC".' },
        { id: 'ocr_low_confidence_total',  finding: 'OCR confidence is 18% (threshold: 80%).' },
        { id: 'ocr_provider_disagreement', finding: 'Textract and DocumentAI returned non-overlapping field sets.' },
      ],
    },
    alerts: [], pastInvoices: [] },
];

export function StoreProvider({ children }) {
  const [rules, setRules] = useState(initialRules);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [toast, setToast] = useState(null);
  const [uiNotes, setUiNotes] = useState(false);
  const toggleUiNotes = () => setUiNotes(prev => !prev);

  // Update a claim's final decision status — pending | approved | rejected | failed.
  // This is the legacy Loyalife platform status, parallel to (and independent from) the
  // auto-approval verdict that lives in `validationResults`.
  const setDecisionStatus = (claimId, status) => {
    setInvoices(prev => prev.map(inv => inv.claimId === claimId ? { ...inv, decisionStatus: status } : inv));
  };

  // Master on/off for the entire auto-approval subsystem.
  // Gated by `editClaimsSettings` RBAC permission (not enforced in the prototype yet).
  // Default OFF — the program owner has to opt in, and that opt-in goes through the
  // platform Approval Workflow.
  const [autoApprovalEnabled, setAutoApprovalEnabled] = useState(false);
  const setAutoApprovalEnabledTo = (val) => setAutoApprovalEnabled(val);

  // Auto-approval settings — one row per validation, with on-flag + optional threshold values.
  const [autoApprovalSettings, setAutoApprovalSettings] = useState(initialAutoApprovalSettings);
  const toggleValidation = (id) => {
    setAutoApprovalSettings(prev => prev.map(v => v.id === id ? { ...v, on: !v.on } : v));
  };
  // Apply many on/off changes in one go (used for category-level toggles + master cascades).
  // updates: [{ id, on }]
  const applyValidationOnUpdates = (updates) => {
    if (!updates || updates.length === 0) return;
    const map = new Map(updates.map(u => [u.id, u.on]));
    setAutoApprovalSettings(prev => prev.map(v => map.has(v.id) ? { ...v, on: map.get(v.id) } : v));
  };
  const setValidationThreshold = (id, field, value) => {
    setAutoApprovalSettings(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  // Approval Workflow log — every settings change accepted in the audit-trail modal
  // appends an entry here. Mirrors the platform-level Approval Workflow page.
  const [approvalWorkflowEntries, setApprovalWorkflowEntries] = useState([]);
  const logApprovalWorkflowEntry = (entry) => {
    setApprovalWorkflowEntries(prev => [
      { id: 2700 + prev.length + 1, raisedOn: new Date().toISOString().replace('T', ' ').slice(0, 19), ...entry },
      ...prev,
    ]);
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
    <StoreContext.Provider value={{ rules, invoices, toast, showToast, toggleRule, saveRule, deleteRule, duplicateRule, archiveRule, updateAlert, uiNotes, toggleUiNotes, approveRules, toggleApproveRule, saveApproveRule, reorderApproveRules, autoApprovalEnabled, setAutoApprovalEnabledTo, autoApprovalSettings, toggleValidation, applyValidationOnUpdates, setValidationThreshold, setDecisionStatus, approvalWorkflowEntries, logApprovalWorkflowEntry }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
