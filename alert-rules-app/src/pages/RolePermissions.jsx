import { useState } from 'react';
import { UserCog, ChevronDown, Info } from 'lucide-react';
import PageHeader from '../components/shared/PageHeader';
import { useStore } from '../data/store';

const permissionGroups = [
  {
    name: 'Platform Configuration',
    locked: true,
    permissions: [
      { name: 'View Organization Details', desc: 'View program and organization configuration', on: true, locked: true },
      { name: 'Create & Link Programs', desc: 'Create new programs and link to organization', on: true, locked: true },
    ],
  },
  {
    name: 'Member',
    permissions: [
      { name: 'View Member', desc: 'View member profile and transaction history', on: true },
      { name: 'Edit Member Configuration', desc: 'Edit member profile fields and settings', on: true },
      { name: 'Allow Suspend Member', desc: 'Suspend or reactivate member accounts', on: false },
      { name: 'Allow Add/Remove Points', desc: 'Manually add or deduct points from members', on: false },
    ],
  },
  {
    name: 'Campaigns',
    permissions: [
      { name: 'View Campaigns', desc: 'View campaign list and details', on: true },
      { name: 'Edit Campaigns', desc: 'Edit existing campaign settings', on: true },
      { name: 'Create Campaigns', desc: 'Create new campaigns', on: false },
    ],
  },
  {
    name: 'Reports',
    permissions: [
      { name: 'View Reports', desc: 'View and access report dashboards', on: true },
      { name: 'Create Reports', desc: 'Generate new custom reports', on: false },
      { name: 'Delete Reports', desc: 'Delete existing reports', on: false },
    ],
  },
  {
    name: 'Partners & Promotions',
    highlight: true,
    permissions: [
      { name: 'Generate QR Codes', desc: 'Generate and manage QR code batches', on: true },
      { name: 'Approve Invoices', desc: 'Review and approve invoice-based claims', on: true },
      { name: 'Approve Visibility', desc: 'Review and approve visibility shelf images', on: true },
      { name: 'Create Scheme', desc: 'Create and manage scheme banners', on: false },
      { name: 'Approve Videos', desc: 'Review and approve partner videos', on: false },
      { name: 'Channel Partner Config', desc: 'Manage channel partner app configuration', on: true },
      { name: 'Gamification', desc: 'Create and manage gamification campaigns', on: false },
      { name: 'Edit Claims Settings', desc: 'Edit claims processing settings and configurations.', on: true, isNew: true },
    ],
  },
  {
    name: 'Users & Roles',
    permissions: [
      { name: 'View Users & Roles', desc: 'View team members and role assignments', on: true },
      { name: 'Edit Users & Roles', desc: 'Edit user details and role assignments', on: false },
      { name: 'Create Users & Roles', desc: 'Create new users and assign roles', on: false },
    ],
  },
];

export default function RolePermissions() {
  const { devNotes } = useStore();
  const [groups, setGroups] = useState(permissionGroups);
  const [expanded, setExpanded] = useState({ 'Partners & Promotions': true });
  const [roleName, setRoleName] = useState('Program Manager');
  const [roleDesc, setRoleDesc] = useState('Full access to claims management and alert configuration');

  const toggleExpand = (name) => {
    setExpanded(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const togglePermission = (groupIdx, permIdx) => {
    setGroups(prev => prev.map((g, gi) => {
      if (gi !== groupIdx) return g;
      return {
        ...g,
        permissions: g.permissions.map((p, pi) => {
          if (pi !== permIdx || p.locked) return p;
          return { ...p, on: !p.on };
        }),
      };
    }));
  };

  const toggleGroup = (groupIdx) => {
    setGroups(prev => prev.map((g, gi) => {
      if (gi !== groupIdx || g.locked) return g;
      const allOn = g.permissions.every(p => p.on);
      return {
        ...g,
        permissions: g.permissions.map(p => p.locked ? p : { ...p, on: !allOn }),
      };
    }));
  };

  return (
    <div>
      <PageHeader
        icon={<UserCog size={28} className="text-primary" />}
        title="Creating a New Role"
        subtitle="Define permissions and module access for this role"
      />

      {/* Info banner */}
      <div className="bg-[#E5F3FF] border border-[#144DFF] rounded-lg px-5 py-3 mb-6 flex items-center gap-3">
        <Info size={18} className="text-[#144DFF] shrink-0" />
        <span className="text-[13px] text-[#144DFF]">
          The new role added will be mapped to the program <strong>Loyalife Demo Program</strong>
        </span>
      </div>

      {/* Dev note — role mapping */}
      {devNotes && (
        <div className="bg-[#E8F5E9] border border-[#A5D6A7] rounded-lg p-4 mb-6 text-[11px] text-[#1B5E20] leading-relaxed">
          <span className="font-semibold text-[#2E7D32]">Dev Notes — Alert Permissions by Default Role:</span>
          <div className="mt-2 text-[10px] leading-relaxed">
            <strong>View access is open.</strong> Any user with access to Partners &amp; Promotions can open Claims Settings. Since it's the only place that explains what each alert actually checks. The claim detail view shows alert titles only (e.g. "High value invoice"), so without settings visibility reviewers can't decode why a claim was flagged.
            <br /><br />
            <strong>Edit is the permission.</strong> "Edit Claims Settings" controls writing only — toggling custom alerts on/off and updating threshold values. Program Admin gets it; Program Manager does not. Follows the Approval Workflow pattern (Program Manager = Verify, Program Admin = Approve).
            <br /><br />
            <strong>Built-in alerts</strong> (Unable to fetch details, Line item sum mismatch, Duplicate invoice number) are always on for every client. Disabling them requires a backend change — no UI path, regardless of permission.
          </div>
        </div>
      )}

      {/* Role details card */}
      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-6 mb-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Role Name *</label>
            <input
              type="text"
              value={roleName}
              onChange={e => setRoleName(e.target.value)}
              placeholder="Enter role name or designation here"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-[14px] text-text outline-none focus:border-primary"
            />
            <div className="text-[11px] text-text-secondary mt-1">{roleName.length}/25</div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5 uppercase tracking-wider">Role Description</label>
            <input
              type="text"
              value={roleDesc}
              onChange={e => setRoleDesc(e.target.value)}
              placeholder="Enter description for the above role"
              className="w-full px-3 py-2.5 border border-border rounded-lg text-[14px] text-text outline-none focus:border-primary"
            />
            <div className="text-[11px] text-text-secondary mt-1">{roleDesc.length}/150</div>
          </div>
        </div>
      </div>

      {/* Permission groups */}
      <div className="space-y-4">
        {groups.map((group, gi) => {
          const isExpanded = expanded[group.name];
          const allOn = group.permissions.filter(p => !p.locked).every(p => p.on);
          const someOn = group.permissions.some(p => p.on);

          return (
            <div
              key={group.name}
              className={`bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] overflow-hidden ${group.highlight ? 'ring-2 ring-primary/30' : ''}`}
            >
              {/* Group header */}
              <div
                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-bg/50 transition-colors"
                onClick={() => toggleExpand(group.name)}
              >
                {/* Group toggle */}
                <label className="relative inline-block w-9 h-5 cursor-pointer" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={allOn || (someOn && !allOn)}
                    onChange={() => toggleGroup(gi)}
                    disabled={group.locked}
                    className="sr-only peer"
                  />
                  <span className={`absolute inset-0 rounded-full transition-colors ${group.locked ? 'bg-gray-200' : 'bg-gray-300'} peer-checked:bg-toggle-on`} />
                  <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                </label>

                <span className="flex-1 text-[14px] font-semibold text-text">{group.name}</span>

                {group.highlight && (
                  <span className="text-[10px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded">ALERT RULES HERE</span>
                )}

                <ChevronDown
                  size={16}
                  className={`text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </div>

              {/* Expanded content */}
              {isExpanded && (
                <div>
                  {/* Column headers */}
                  <div className="grid grid-cols-12 px-5 py-2 bg-bg border-t border-b border-border text-[11px] font-semibold text-[#4F516E] uppercase tracking-wider">
                    <div className="col-span-1">Toggle</div>
                    <div className="col-span-3">Action Items</div>
                    <div className="col-span-8">Description</div>
                  </div>

                  {/* Permission rows */}
                  {group.permissions.map((perm, pi) => (
                    <div
                      key={perm.name}
                      className={`grid grid-cols-12 items-center px-5 py-3 border-b border-[#E5F3FF] last:border-0 ${perm.isNew ? 'bg-[#FAFFF5]' : ''}`}
                    >
                      <div className="col-span-1">
                        <label className="relative inline-block w-9 h-5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={perm.on}
                            onChange={() => togglePermission(gi, pi)}
                            disabled={perm.locked}
                            className="sr-only peer"
                          />
                          <span className={`absolute inset-0 rounded-full transition-colors ${perm.locked ? 'bg-gray-200' : 'bg-gray-300'} peer-checked:bg-toggle-on`} />
                          <span className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                        </label>
                      </div>
                      <div className="col-span-3 text-[13px] text-text font-medium flex items-center gap-2">
                        {perm.name}
                        {perm.isNew && (
                          <span className="text-[9px] font-bold text-white bg-success px-1.5 py-0.5 rounded">NEW</span>
                        )}
                      </div>
                      <div className="col-span-8 text-[12px] text-text-secondary">{perm.desc}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-3 mt-6 pb-6">
        <button className="bg-white text-text border border-border px-5 py-2 rounded text-sm font-medium hover:bg-bg cursor-pointer">
          Cancel
        </button>
        <button className="bg-primary text-white px-5 py-2 rounded text-sm font-medium hover:bg-[#354499] cursor-pointer">
          Save
        </button>
      </div>
    </div>
  );
}
