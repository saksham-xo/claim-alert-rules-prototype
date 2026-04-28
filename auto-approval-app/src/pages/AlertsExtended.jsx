import { useState } from 'react';
import { Shield, Search, X } from 'lucide-react';
import { useStore } from '../data/store';
import PageHeader from '../components/shared/PageHeader';
import BehaviorPill from '../components/shared/BehaviorPill';
// ActionCard removed — using inline "Manage Alerts" header row instead
import Popover from '../components/shared/Popover';
import RuleBuilder from '../components/RuleBuilder';

export default function AlertsExtended() {
  const { rules, toggleRule, deleteRule, duplicateRule, showToast } = useStore();
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const activeRules = rules.filter(r => r.on);
  const inactiveRules = rules.filter(r => !r.on);
  const list = (tab === 'active' ? activeRules : inactiveRules)
    .filter(r => !search || r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader
        icon={<Shield size={28} className="text-primary" />}
        title="Alerts"
        subtitle="Configure alerts for invoice claims processing"
      />

      {/* Table card — Manage Alerts header inside the card */}
      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
        {/* Card header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-text">Manage Alerts</h2>
          <button
            onClick={() => { setEditingRule(null); setBuilderOpen(true); }}
            className="bg-primary text-white px-5 py-2 rounded text-sm font-medium hover:bg-[#354499] transition-colors cursor-pointer"
          >
            Create Alert
          </button>
        </div>
        {/* Tabs — both use same primary blue */}
        <div className="flex border-b-2 border-border bg-bg px-4">
          <button
            onClick={() => setTab('active')}
            className={`px-4 py-3 text-xs font-semibold border-b-[4px] -mb-[2px] cursor-pointer transition-colors ${
              tab === 'active'
                ? 'text-primary border-primary rounded-t'
                : 'text-text-secondary border-transparent hover:text-text'
            }`}
          >
            Active Alerts({activeRules.length})
          </button>
          <button
            onClick={() => setTab('inactive')}
            className={`px-4 py-3 text-xs font-semibold border-b-[4px] -mb-[2px] cursor-pointer transition-colors ${
              tab === 'inactive'
                ? 'text-primary border-primary rounded-t'
                : 'text-text-secondary border-transparent hover:text-text'
            }`}
          >
            Inactive Alerts
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
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-center border-b border-border w-16"></th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Alert Name</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">When triggered</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l w-[140px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-text-secondary">
                  No {tab} alerts {search ? 'matching your search' : 'configured'}
                </td>
              </tr>
            ) : list.map(r => (
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
                    <span className="absolute inset-0 bg-gray-300 rounded-full transition-colors peer-checked:bg-toggle-on" />
                    <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                  </label>
                </td>
                <td className="px-4 py-3 font-medium text-text">{r.name}</td>
                <td className="px-4 py-3"><BehaviorPill behavior={r.behavior} /></td>
                <td className="px-4 py-3">
                  <Popover items={[
                    { label: 'View', onClick: () => { setEditingRule(r); setBuilderOpen(true); } },
                    { label: 'Edit', onClick: () => { setEditingRule(r); setBuilderOpen(true); } },
                    { label: 'Duplicate', onClick: () => { duplicateRule(r.id); showToast('Duplicated'); } },
                    { label: 'Delete', onClick: () => { deleteRule(r.id); showToast(`"${r.name}" deleted`); }, danger: true },
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
          <span>1-{list.length} of {list.length}</span>
          <div className="flex gap-1">
            <button className="border border-border rounded w-7 h-7 text-text-secondary cursor-pointer">&lsaquo;</button>
            <button className="border border-border rounded w-7 h-7 text-text-secondary cursor-pointer">&rsaquo;</button>
          </div>
        </div>
      </div>

      {builderOpen && (
        <RuleBuilder
          editRule={editingRule}
          onClose={() => { setBuilderOpen(false); setEditingRule(null); }}
        />
      )}
    </div>
  );
}
