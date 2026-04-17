import { Bell } from 'lucide-react';
import { useStore } from '../data/store';
import PageHeader from '../components/shared/PageHeader';
import BehaviorPill from '../components/shared/BehaviorPill';

const alertActivity = [
  { ts: '15 Apr, 2026 12:00', inv: '25081228 [2]', rule: 'Duplicate Invoice Detection', behavior: 'block', st: 'active' },
  { ts: '14 Apr, 2026 16:15', inv: '25081228 [2]', rule: 'Duplicate Invoice Detection', behavior: 'block', st: 'active' },
  { ts: '10 Apr, 2026 13:47', inv: 'FE-25-310468', rule: 'Unauthorised Distributor', behavior: 'block', st: 'active' },
  { ts: '10 Apr, 2026 13:47', inv: 'FE-25-310468', rule: 'Mismatched Totals', behavior: 'block', st: 'active' },
  { ts: '10 Apr, 2026 10:08', inv: '250007300387493', rule: 'High Value Invoice', behavior: 'flag', st: 'overridden' },
  { ts: '09 Apr, 2026 15:30', inv: 'INV-2026-00395', rule: 'High Value Invoice', behavior: 'flag', st: 'acknowledged' },
  { ts: '08 Apr, 2026 11:12', inv: 'INV-2026-00390', rule: 'Duplicate Invoice Detection', behavior: 'block', st: 'acknowledged' },
  { ts: '07 Apr, 2026 09:45', inv: 'INV-2026-00388', rule: 'Unauthorised Distributor', behavior: 'block', st: 'acknowledged' },
];

function AlertStatusPill({ status }) {
  if (status === 'active') return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-block-bg text-[#C62828]">Active</span>;
  if (status === 'acknowledged') return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-flag-bg text-[#E65100]">Acknowledged</span>;
  if (status === 'overridden') return <span className="text-xs font-semibold px-2 py-0.5 rounded bg-[#F5F5F5] text-text-secondary">Overridden</span>;
  return null;
}

export default function AlertDashboard() {
  const { rules, invoices, showToast } = useStore();
  const activeRules = rules.filter(r => r.on);
  const totalAlerts = invoices.reduce((sum, inv) => sum + inv.alerts.length, 0);
  const blockedInvoices = invoices.filter(inv => inv.alerts.some(a => a.status === 'active' && a.behavior === 'block')).length;

  return (
    <div>
      <PageHeader
        icon={<Bell size={28} className="text-primary" />}
        title="Alert Dashboard"
        subtitle="Monitor alert activity and resolution metrics across all invoice claims"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-4">
          <span className="text-[11px] font-semibold uppercase text-text-secondary tracking-wider">Active Rules</span>
          <div className="text-[28px] font-bold text-text mt-2">{activeRules.length}</div>
        </div>
        <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-4">
          <span className="text-[11px] font-semibold uppercase text-text-secondary tracking-wider">Alerts Today</span>
          <div className="text-[28px] font-bold text-text mt-2">{totalAlerts}</div>
        </div>
        <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-4">
          <span className="text-[11px] font-semibold uppercase text-text-secondary tracking-wider">Resolution Rate</span>
          <div className="text-[28px] font-bold text-success mt-2">72%</div>
          <div className="text-[11px] text-success mt-0.5">+8% from last period</div>
        </div>
        <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-4">
          <span className="text-[11px] font-semibold uppercase text-text-secondary tracking-wider">Blocked Invoices</span>
          <div className="text-[28px] font-bold text-block mt-2">{blockedInvoices}</div>
          <div className="text-[11px] text-block mt-0.5">Require resolution</div>
        </div>
      </div>

      {/* 2-col grid: By Rule + By Severity */}
      <div className="grid grid-cols-2 gap-5 mb-6">
        {/* Alerts by Rule */}
        <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-5">
          <div className="text-sm font-semibold mb-4">Alerts by Rule (30d)</div>
          <div className="flex flex-col gap-3">
            {activeRules.map(r => (
              <div key={r.id} className="flex items-center gap-3 py-2">
                <span className="flex-1 text-[13px] font-medium">{r.name}</span>
                <BehaviorPill behavior={r.behavior} />
              </div>
            ))}
          </div>
        </div>

        {/* Alerts by Severity */}
        <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-5">
          <div className="text-sm font-semibold mb-4">Alerts by Severity</div>
          <div className="flex items-end gap-8 justify-center h-40">
            <div className="text-center">
              <div className="w-12 bg-block rounded-t" style={{ height: 80 }} />
              <div className="text-xs text-text-secondary mt-1.5">Critical</div>
              <div className="font-bold">19</div>
            </div>
            <div className="text-center">
              <div className="w-12 bg-flag rounded-t" style={{ height: 110 }} />
              <div className="text-xs text-text-secondary mt-1.5">Warning</div>
              <div className="font-bold">23</div>
            </div>
            <div className="text-center">
              <div className="w-12 bg-[#2196F3] rounded-t" style={{ height: 40 }} />
              <div className="text-xs text-text-secondary mt-1.5">Info</div>
              <div className="font-bold">5</div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alert Activity */}
      <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
        <div className="px-5 py-4 border-b border-border text-sm font-semibold">Recent Alert Activity</div>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border">Timestamp</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Invoice</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Rule Triggered</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Severity</th>
              <th className="bg-bg text-xs font-semibold text-[#4F516E] px-4 py-2.5 text-left border-b border-border border-l">Status</th>
            </tr>
          </thead>
          <tbody>
            {alertActivity.map((a, i) => (
              <tr key={i} className="border-b border-border hover:bg-[#F5F5F5]">
                <td className="px-4 py-3 text-xs text-text-secondary">{a.ts}</td>
                <td className="px-4 py-3 text-primary font-mono text-xs cursor-pointer" onClick={() => showToast(`Navigate to ${a.inv}`)}>{a.inv}</td>
                <td className="px-4 py-3">{a.rule}</td>
                <td className="px-4 py-3"><BehaviorPill behavior={a.behavior} /></td>
                <td className="px-4 py-3"><AlertStatusPill status={a.st} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
