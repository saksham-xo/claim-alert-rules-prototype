import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, X, ChevronLeft, Trash2, Plus } from 'lucide-react';
import { useStore } from '../data/store';
import Popover from '../components/shared/Popover';

const fieldDefs = [
  { v: 'totalAmount', l: 'Invoice Amount', numeric: true, ops: [{ v: 'equals', l: 'Equals' }, { v: 'not_equals', l: 'Not Equals' }, { v: 'gt', l: 'Greater Than' }, { v: 'lt', l: 'Less Than' }, { v: 'gte', l: 'Greater Than or Equal To' }, { v: 'lte', l: 'Less Than or Equal To' }] },
  { v: 'invoiceNo', l: 'Invoice Number', ops: [{ v: 'equals', l: 'Equals' }, { v: 'not_equals', l: 'Not Equals' }, { v: 'contains', l: 'Contains' }, { v: 'not_contains', l: 'Does Not Contain' }] },
  { v: 'totalsMismatch', l: 'Line Items Total Mismatch', ops: [{ v: 'equals', l: 'Equals' }, { v: 'not_equals', l: 'Not Equals' }] },
  { v: 'invoiceAge', l: 'Invoice Age (days)', numeric: true, ops: [{ v: 'equals', l: 'Equals' }, { v: 'not_equals', l: 'Not Equals' }, { v: 'gt', l: 'Greater Than' }, { v: 'lt', l: 'Less Than' }, { v: 'gte', l: 'Greater Than or Equal To' }, { v: 'lte', l: 'Less Than or Equal To' }] },
  { v: 'ocrConfidence', l: 'Confidence Score (%)', numeric: true, ops: [{ v: 'equals', l: 'Equals' }, { v: 'not_equals', l: 'Not Equals' }, { v: 'gt', l: 'Greater Than' }, { v: 'lt', l: 'Less Than' }, { v: 'gte', l: 'Greater Than or Equal To' }, { v: 'lte', l: 'Less Than or Equal To' }] },
  { v: 'ocrAmount', l: 'Scanned Amount vs Entered', ops: [{ v: 'equals', l: 'Equals' }, { v: 'not_equals', l: 'Not Equals' }] },
];
const noValueOps = ['is_empty', 'is_not_empty'];

const approveFieldLabels = {
  totalAmount: 'Invoice Amount',
  invoiceNo: 'Invoice Number',
  totalsMismatch: 'Line Items Total Mismatch',
  invoiceAge: 'Invoice Age (days)',
  ocrConfidence: 'Confidence Score (%)',
  ocrAmount: 'Scanned Amount vs Entered',
  stockistName: 'Stockist Name',
  gstinVerified: 'GSTIN Verified',
  lineItemsInCatalog: 'Line Items In Catalog',
  poReference: 'PO Reference',
  amountVariance: 'Amount Variance (%)',
};

const approveOpLabels = {
  equals: 'Equals', not_equals: 'Not Equals',
  gt: 'Greater Than', lt: 'Less Than',
  gte: 'Greater Than or Equal To', lte: 'Less Than or Equal To',
  contains: 'Contains', not_contains: 'Does Not Contain',
  is_empty: 'Is Empty', is_not_empty: 'Is Not Empty',
};

export default function AlertRules() {
  const navigate = useNavigate();
  const { rules, toggleRule, duplicateRule, showToast, pmNotes, devNotes, approveRules, toggleApproveRule, reorderApproveRules } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const settingsTab = searchParams.get('tab') || 'alerts';
  const setSettingsTab = (tab) => setSearchParams({ tab });
  const [alertTab, setAlertTab] = useState('active');
  const [search, setSearch] = useState('');

  const [dragIdx, setDragIdx] = useState(null);
  const [reorderConfirm, setReorderConfirm] = useState(null);

  const handleDragStart = (idx) => setDragIdx(idx);
  const handleDragOver = (e, idx) => { e.preventDefault(); };
  const handleDrop = (targetIdx) => {
    if (dragIdx === null || dragIdx === targetIdx) { setDragIdx(null); return; }
    setReorderConfirm({ from: dragIdx, to: targetIdx });
  };
  const confirmReorder = () => {
    reorderApproveRules(reorderConfirm.from, reorderConfirm.to);
    showToast('Priority updated');
    setReorderConfirm(null);
    setDragIdx(null);
  };

  const activeRules = rules.filter(r => r.on);
  const inactiveRules = rules.filter(r => !r.on);
  const alertList = (alertTab === 'active' ? activeRules : inactiveRules)
    .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      {/* Page header */}
      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-4 px-6 flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/partner-promotions/invoice-management')} className="hover:bg-bg rounded-lg p-2 cursor-pointer transition-colors">
          <ChevronLeft size={20} className="text-text" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-text">Claims Settings</h1>
          <p className="text-sm text-text-secondary mt-0.5">Configure alerts and auto-approval for invoice claims processing</p>
        </div>
      </div>

      {/* Settings card with top-level tabs */}
      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
        {/* Top-level settings tabs */}
        <div className="flex border-b-2 border-border px-4">
          <button
            onClick={() => setSettingsTab('alerts')}
            className={`px-4 py-3 text-xs font-semibold border-b-[4px] -mb-[2px] cursor-pointer transition-colors ${
              settingsTab === 'alerts'
                ? 'text-primary border-primary rounded-t'
                : 'text-text-secondary border-transparent hover:text-text'
            }`}
          >
            Alerts
          </button>
          <button
            onClick={() => setSettingsTab('auto-approval')}
            className={`px-4 py-3 text-xs font-semibold border-b-[4px] -mb-[2px] cursor-pointer transition-colors ${
              settingsTab === 'auto-approval'
                ? 'text-primary border-primary rounded-t'
                : 'text-text-secondary border-transparent hover:text-text'
            }`}
          >
            Auto-Approval
          </button>
          <button
            onClick={() => setSettingsTab('general')}
            className={`px-4 py-3 text-xs font-semibold border-b-[4px] -mb-[2px] cursor-pointer transition-colors ${
              settingsTab === 'general'
                ? 'text-primary border-primary rounded-t'
                : 'text-text-secondary border-transparent hover:text-text'
            }`}
          >
            General
          </button>
        </div>

        {/* ─── Alerts Tab ─── */}
        {settingsTab === 'alerts' && (
          <div>
            {/* Alerts header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-text">Manage Alerts</h2>
                <p className="text-xs text-text-secondary mt-0.5">Configure alerts for invoice claims processing</p>
              </div>
              <button
                onClick={() => navigate('/partner-promotions/invoice-management/settings/alerts/create')}
                className="bg-primary text-white px-5 py-2 rounded text-sm font-medium hover:bg-[#354499] transition-colors cursor-pointer"
              >
                Create Alert
              </button>
            </div>

            {/* Active/Inactive sub-tabs */}
            <div className="flex border-b border-border bg-bg px-4">
              <button
                onClick={() => setAlertTab('active')}
                className={`px-4 py-2.5 text-xs font-semibold cursor-pointer transition-colors ${
                  alertTab === 'active'
                    ? 'text-primary border-b-2 border-primary -mb-px'
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                Active ({activeRules.length})
              </button>
              <button
                onClick={() => setAlertTab('inactive')}
                className={`px-4 py-2.5 text-xs font-semibold cursor-pointer transition-colors ${
                  alertTab === 'inactive'
                    ? 'text-primary border-b-2 border-primary -mb-px'
                    : 'text-text-secondary hover:text-text'
                }`}
              >
                Inactive
              </button>
            </div>

            {/* Search */}
            <div className="relative mx-4 my-4">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#868CCC]" />
              <input
                type="text"
                placeholder="Search by Alert Name"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 border border-border rounded-lg text-[13px] text-text outline-none focus:border-primary placeholder:text-[#BDC5DA]"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary cursor-pointer">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Table */}
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-center border-b border-border w-16 relative">
                    {devNotes && (
                      <div className="absolute left-0 top-full mt-1 z-50 w-64 bg-[#E8F5E9] border border-[#A5D6A7] rounded-lg p-3 shadow-lg text-[11px] text-[#1B5E20] leading-relaxed font-normal">
                        <span className="font-semibold text-[#2E7D32]">Dev Notes:</span>
                        <ul className="mt-1 flex flex-col gap-1 list-disc pl-3">
                          <li>Toggle off → moves to Inactive tab</li>
                          <li>Toggle on → moves to Active tab</li>
                          <li>Toggle state reflects on Claims page alerts immediately</li>
                        </ul>
                      </div>
                    )}
                  </th>
                  <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Alert Name</th>
                  <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Alert ID</th>
                  <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l relative">
                    Created By
                    {pmNotes && (
                      <div className="absolute left-0 top-full mt-1 z-50 w-64 bg-[#FFF8E1] border border-[#FFE082] rounded-lg p-3 shadow-lg text-[11px] text-[#5D4037] leading-relaxed font-normal">
                        <span className="font-semibold text-[#F57F17]">PM Note:</span> Should we show the person's name + role, or just the name instead of "Admin"?
                      </div>
                    )}
                  </th>
                  <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Date Created</th>
                  <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {alertList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-text-secondary">
                      No {alertTab} alerts {search ? 'matching your search' : 'configured'}
                    </td>
                  </tr>
                ) : alertList.map(r => (
                  <tr key={r.id} className="border-b border-border hover:bg-[#F5F5F5] transition-colors">
                    <td className="px-4 py-3 text-center">
                      <label className="relative inline-block w-9 h-5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={r.on}
                          onChange={() => {
                            toggleRule(r.id);
                            showToast(`${r.name} ${r.on ? 'deactivated' : 'activated'}`);
                          }}
                          className="sr-only peer"
                        />
                        <span className="absolute inset-0 bg-gray-300 rounded-full transition-colors peer-checked:bg-primary" />
                        <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                      </label>
                    </td>
                    <td className="px-4 py-3 font-medium text-text">{r.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{r.id}</td>
                    <td className="px-4 py-3 text-text">{r.by || 'Admin'}</td>
                    <td className="px-4 py-3 text-text-secondary">{r.at || '—'}</td>
                    <td className="px-4 py-3">
                      <Popover items={[
                        { label: 'View', onClick: () => navigate(`/partner-promotions/invoice-management/settings/alerts/${r.id}`) },
                        { label: 'Edit', onClick: () => navigate(`/partner-promotions/invoice-management/settings/alerts/${r.id}/edit`) },
                        { label: 'Duplicate', onClick: () => { duplicateRule(r.id); showToast('Duplicated'); } },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-end gap-4 px-4 py-2 border-t border-border text-[13px] text-text-secondary">
              <span>Rows per page:</span>
              <select className="bg-[rgba(63,81,181,0.1)] border-none rounded px-2 py-1 text-primary font-medium">
                <option>10</option>
              </select>
              <span>1-{alertList.length} of {alertList.length}</span>
              <div className="flex gap-1">
                <button className="border border-border rounded w-7 h-7 text-text-secondary cursor-pointer">&lsaquo;</button>
                <button className="border border-border rounded w-7 h-7 text-text-secondary cursor-pointer">&rsaquo;</button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Auto-Approve Tab ─── */}
        {settingsTab === 'auto-approval' && (
          <div>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-text">Manage Auto-Approvals</h2>
                <p className="text-xs text-text-secondary mt-0.5">Claims matching these rules are instantly approved at submission. Rules are evaluated in priority order.</p>
              </div>
              <button
                onClick={() => navigate('/partner-promotions/invoice-management/settings/approve/create')}
                className="bg-primary text-white px-5 py-2 rounded text-sm font-medium hover:bg-[#354499] transition-colors cursor-pointer"
              >
                Add Rule
              </button>
            </div>

            {/* Rules table */}
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-center border-b border-border w-16"></th>
                  <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Rule Name</th>
                  <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-center border-b border-border border-l w-20">Priority</th>
                  <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-center border-b border-border border-l whitespace-nowrap">Min Confidence Score (≥)</th>
                  <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-center border-b border-border border-l w-12"></th>
                  <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l w-[100px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {approveRules.map((rule, idx) => (
                  <tr
                    key={rule.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={() => handleDrop(idx)}
                    className={`border-b border-border hover:bg-[#F5F5F5] transition-colors ${!rule.on ? 'opacity-50' : ''} ${dragIdx === idx ? 'opacity-30' : ''}`}
                  >
                    <td className="px-4 py-3 text-center">
                      <label className="relative inline-block w-9 h-5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rule.on}
                          onChange={() => {
                            toggleApproveRule(rule.id);
                            showToast(`${rule.name} ${rule.on ? 'disabled' : 'enabled'}`);
                          }}
                          className="sr-only peer"
                        />
                        <span className="absolute inset-0 bg-gray-300 rounded-full transition-colors peer-checked:bg-primary" />
                        <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                      </label>
                    </td>
                    <td className="px-4 py-3 font-medium text-text">{rule.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded">{rule.priority}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {rule.minScanQuality ? (
                        <span className="text-sm font-medium text-text">{rule.minScanQuality}%</span>
                      ) : (
                        <span className="text-xs text-text-secondary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-text-secondary cursor-grab select-none">⋮⋮</td>
                    <td className="px-4 py-3">
                      <Popover items={[
                        { label: 'View', onClick: () => navigate(`/partner-promotions/invoice-management/settings/approve/${rule.id}`) },
                        { label: 'Edit', onClick: () => navigate(`/partner-promotions/invoice-management/settings/approve/${rule.id}/edit`) },
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-end gap-4 px-4 py-2 border-t border-border text-[13px] text-text-secondary">
              <span>Rows per page:</span>
              <select className="bg-[rgba(63,81,181,0.1)] border-none rounded px-2 py-1 text-primary font-medium">
                <option>10</option>
              </select>
              <span>1-{approveRules.length} of {approveRules.length}</span>
              <div className="flex gap-1">
                <button className="border border-border rounded w-7 h-7 text-text-secondary cursor-pointer">&lsaquo;</button>
                <button className="border border-border rounded w-7 h-7 text-text-secondary cursor-pointer">&rsaquo;</button>
              </div>
            </div>


            {devNotes && (
              <div className="mx-6 mb-5 bg-[#E8F5E9] border border-[#A5D6A7] rounded-lg p-3 text-[11px] text-[#1B5E20] leading-relaxed">
                <span className="font-semibold text-[#2E7D32]">Dev Notes:</span>
                <ul className="mt-1 flex flex-col gap-1 list-disc pl-3">
                  <li>Rules evaluated in priority order — first match wins</li>
                  <li>Auto-approve evaluates at claim submission time (same as alerts)</li>
                  <li>Approved is final — new rules don't retroactively affect approved claims</li>
                  <li>Same condition framework as alerts — field/operator/value</li>
                  <li>Stockist Name, GSTIN, Line Items are semi-configurable fields (per-client setup)</li>
                  <li>Auto-approved claims logged with reason: "Auto-approved: [rule name]"</li>
                </ul>
              </div>
            )}

            {pmNotes && (
              <div className="mx-6 mb-5 bg-[#FFF8E1] border border-[#FFE082] rounded-lg p-3 text-[11px] text-[#5D4037] leading-relaxed">
                <span className="font-semibold text-[#F57F17]">PM Note:</span> Stockist Name (Approved List), GSTIN verification, and Line Items (Product Catalog) are semi-configurable fields — require per-client setup. How do we manage these lists? Separate config page per client program?
              </div>
            )}
            {/* Reorder confirmation modal */}
            {reorderConfirm && (
              <div className="fixed inset-0 bg-[rgba(17,24,39,0.5)] z-[100] flex items-center justify-center">
                <div className="bg-surface rounded-xl shadow-xl max-w-[420px] w-full p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <svg width="20" height="20" fill="none" stroke="#F57F17" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86l-8.6 14.91A1 1 0 002.54 20h17.92a1 1 0 00.85-1.53l-8.6-14.91a1 1 0 00-1.72 0z"/></svg>
                    <h3 className="text-base font-semibold text-text">Change Sequence</h3>
                  </div>
                  <p className="text-sm text-text-secondary mb-5">Changing rule sequence might impact expected outcome.</p>
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => { setReorderConfirm(null); setDragIdx(null); }}
                      className="px-4 py-2 border border-border rounded text-sm font-medium text-text hover:bg-bg cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmReorder}
                      className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-[#354499] cursor-pointer"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── General Tab ─── */}
        {settingsTab === 'general' && (
          <div className="px-6 py-5">
            <div className="text-sm text-text-secondary text-center py-10">General settings coming soon</div>
          </div>
        )}
      </div>
    </div>
  );
}
