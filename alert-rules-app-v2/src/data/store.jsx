import { useState, createContext, useContext } from 'react';

const StoreContext = createContext();

const initialRules = [
  { id: 'RULE-001', name: 'High Value Invoice', desc: 'Flag invoices exceeding amount threshold for review', behavior: 'flag', groups: [[{ f: 'totalAmount', op: 'gt', val: '50000' }]], acts: ['flag_invoice', 'require_review'], on: true, by: 'Admin', at: '15 Mar, 2026' },
  { id: 'RULE-002', name: 'Duplicate Invoice Number - INV-2026-05201', desc: 'Flag invoices matching the known-duplicate number INV-2026-05201', behavior: 'flag', groups: [[{ f: 'invoiceNo', op: 'equals', val: 'INV-2026-05201' }]], acts: ['flag_invoice'], on: true, by: 'Admin', at: '20 Mar, 2026' },
  { id: 'RULE-004', name: 'Mismatched Totals', desc: 'Block when line item sum does not equal invoice total', behavior: 'block', groups: [[{ f: 'lineItemsMismatch', op: 'is_true', val: '' }]], acts: ['flag_invoice', 'block_approval'], on: true, by: 'Admin', at: '05 Apr, 2026' },
  { id: 'RULE-005', name: 'OCR Confidence Low', desc: 'Flag when OCR scan confidence below threshold', behavior: 'flag', groups: [[{ f: 'ocrConfidence', op: 'lt', val: '80' }]], acts: ['flag_invoice'], on: false, by: 'Admin', at: '10 Apr, 2026' },
];

const initialInvoices = [
  // High Value Invoice — amount > ₹50,000 (RULE-001)
  { claimId: 1257, type: 'Claims', num: 'INV-2026-05100', partner: 'SADGURU AGENCY', member: 'M-44021', amount: 78500, date: '14 Apr, 2026 09:22:10', invDate: '12 Apr, 2026', status: 'pending', ocrConfidence: 95, supplier: 'SADGURU AGENCY', customer: 'HEALTH MART CHEMIST', authDist: 'SADGURU AGENCY', partnerId: '5567890', totalClaims: 8, lastClaim: '14 Apr, 2026', lineItems: [{ code: 'PHR-101', name: 'Insulin Pen 3ml', qty: 50, price: 1200, amount: 60000 }, { code: 'PHR-102', name: 'Glucose Monitor Kit', qty: 25, price: 740, amount: 18500 }], alerts: [{ ruleId: 'RULE-001', ruleName: 'High Value Invoice', msg: 'Invoice value \u20b978,500 exceeds threshold of \u20b950,000' }], pastInvoices: [] },
  // 3. Mismatched Totals — line items don't add up (RULE-004)
  { claimId: 1209, type: 'Claims', num: 'FE-25-310468', partner: 'FOCUS MEDISALES', member: 'M-70184', amount: 5200, date: '13 Apr, 2026 13:47:59', invDate: '08 Apr, 2026', status: 'pending', ocrConfidence: 72, supplier: 'FOCUS MEDISALES PVT LTD', customer: 'Priya Retail', authDist: 'FOCUS MEDISALES PVT LTD', partnerId: '9012345', totalClaims: 5, lastClaim: '13 Apr, 2026', lineItems: [{ code: 'MED-2201', name: 'TAIXIN FORCE DRY SYRUP', qty: 10, price: 285, amount: 2850 }, { code: 'MED-2205', name: 'MAGNALOR TONIC CAPS', qty: 15, price: 135.67, amount: 2035 }], alerts: [{ ruleId: 'RULE-004', ruleName: 'Mismatched Totals', msg: 'Line items sum to \u20b94,885 but invoice total is \u20b95,200 (difference: \u20b9315)' }], pastInvoices: [] },
  // Duplicate invoice number — shares INV-2026-05201 with claim 1180, matches RULE-002
  { claimId: 1195, type: 'Warranty', num: 'INV-2026-05201', partner: 'NEW GARODIA DISTRIBUTORS', member: 'M-55498', amount: 1387, date: '10 Apr, 2026 21:03:30', invDate: '10 Apr, 2026', status: 'pending', ocrConfidence: 91, supplier: 'NEW GARODIA DISTRIBUTORS', customer: 'dia medical', authDist: 'NEW GARODIA DISTRIBUTORS', partnerId: '1234567', totalClaims: 3, lastClaim: '10 Apr, 2026', lineItems: [{ code: 'PHR-002', name: 'Paracetamol 500mg', qty: 20, price: 69.35, amount: 1387 }], alerts: [], pastInvoices: [] },
  // 6. Auto-approved invoice — matched AR-001 (Low Value Claims, scan quality 94%)
  { claimId: 1190, type: 'Claims', num: '250007300387493', partner: 'SADGURU AGENCY', member: 'M-42017', amount: 2009, date: '10 Apr, 2026 10:08:45', invDate: '09 Apr, 2026', status: 'approved', ocrConfidence: 94, autoApprovedByRuleId: 'AR-001', supplier: 'SADGURU AGENCY', customer: 'HEALTH MART CHEMIST', authDist: 'SADGURU AGENCY', partnerId: '5567890', totalClaims: 8, lastClaim: '10 Apr, 2026', lineItems: [{ code: 'PHR-003', name: 'Antibiotic Tab', qty: 4, price: 502.25, amount: 2009 }], alerts: [], pastInvoices: [] },
  // 6. High value invoice (RULE-001)
  { claimId: 1185, type: 'Claims', num: '140556', partner: 'Unknown Pharma Dist.', member: 'M-33102', amount: 62350, date: '10 Apr, 2026 17:33:12', invDate: '08 Apr, 2026', status: 'pending', ocrConfidence: 67, supplier: 'Unknown Pharma Dist.', customer: 'City Chemist', authDist: 'Metro Distributors', partnerId: '7890123', totalClaims: 1, lastClaim: '10 Apr, 2026', lineItems: [{ code: 'PHR-004', name: 'Injection Vial 10ml', qty: 120, price: 382.71, amount: 45925.20 }, { code: 'PHR-006', name: 'Syringe Pack 5ml', qty: 200, price: 82.12, amount: 16424.80 }], alerts: [{ ruleId: 'RULE-001', ruleName: 'High Value Invoice', msg: 'Invoice value \u20b962,350 exceeds threshold of \u20b950,000' }], pastInvoices: [] },
  // 8. Clean invoice
  { claimId: 1180, type: 'Claims', num: 'INV-2026-05201', partner: 'FOCUS MEDISALES', member: 'M-60215', amount: 4592.53, date: '09 Apr, 2026 14:20:05', invDate: '08 Apr, 2026', status: 'pending', ocrConfidence: 89, supplier: 'FOCUS MEDISALES PVT LTD', customer: 'Sunrise Pharmacy', authDist: 'FOCUS MEDISALES PVT LTD', partnerId: '9012345', totalClaims: 7, lastClaim: '09 Apr, 2026', lineItems: [{ code: 'PHR-004', name: 'Injection Vial 10ml', qty: 12, price: 382.71, amount: 4592.53 }], alerts: [], pastInvoices: [] },
  // Missing Invoice Number — system-level alert, no rule configured
  { claimId: 1175, type: 'Claims', num: '', partner: 'SADGURU AGENCY', member: 'M-51207', amount: 3275, date: '09 Apr, 2026 11:42:18', invDate: '07 Apr, 2026', status: 'pending', ocrConfidence: 58, supplier: 'SADGURU AGENCY', customer: 'HEALTH MART CHEMIST', authDist: 'SADGURU AGENCY', partnerId: '5567890', totalClaims: 8, lastClaim: '09 Apr, 2026', lineItems: [{ code: 'PHR-007', name: 'Vitamin D3 Cap', qty: 15, price: 218.33, amount: 3275 }], alerts: [{ system: true, ruleName: 'Missing Invoice Number', msg: 'Invoice number could not be extracted from the scan' }], pastInvoices: [] },
  // 10. Missing Retailer Name — system-level alert, no rule configured
  { claimId: 1170, type: 'Claims', num: 'INV-2026-05308', partner: '', member: 'M-63104', amount: 1845, date: '08 Apr, 2026 18:21:07', invDate: '06 Apr, 2026', status: 'pending', ocrConfidence: 62, supplier: '', customer: 'GREENLEAF CHEMIST', authDist: '', partnerId: '', totalClaims: 0, lastClaim: '—', lineItems: [{ code: 'PHR-008', name: 'Iron Supplement Tab', qty: 15, price: 123, amount: 1845 }], alerts: [{ system: true, ruleName: 'Missing Retailer Name', msg: 'Retailer name could not be extracted from the scan' }], pastInvoices: [] },
];

export function StoreProvider({ children }) {
  const [rules, setRules] = useState(initialRules);
  const [invoices, setInvoices] = useState(initialInvoices);
  const [toast, setToast] = useState(null);
  const [pmNotes, setPmNotes] = useState(false);
  const togglePmNotes = () => setPmNotes(prev => !prev);
  const [devNotes, setDevNotes] = useState(false);
  const toggleDevNotes = () => setDevNotes(prev => !prev);

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
    <StoreContext.Provider value={{ rules, invoices, toast, showToast, toggleRule, saveRule, deleteRule, duplicateRule, archiveRule, updateAlert, pmNotes, togglePmNotes, devNotes, toggleDevNotes, approveRules, toggleApproveRule, saveApproveRule, reorderApproveRules }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStore = () => useContext(StoreContext);
