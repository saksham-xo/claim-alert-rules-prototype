import { useState } from 'react';
import { Bell, Eye, ChevronLeft, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { NOTIFICATIONS, CAMPAIGNS } from '../data/engageData';
import ChannelPill from '../components/shared/ChannelPill';
import CreateNotification from './CreateNotification';

export default function Notifications() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = NOTIFICATIONS.filter((n) =>
    n.name.toLowerCase().includes(search.toLowerCase())
  );

  const campaignName = (id) => CAMPAIGNS.find((c) => c.id === id)?.name ?? id;

  const statusColor = (s) => ({
    Scheduled: 'bg-[#EDF3FF] text-[#3B5BDB] border border-[#BFD0FF]',
    Sent:       'bg-[#E6F9EC] text-[#1A7F37]',
    Draft:      'bg-surface-soft text-text-muted border border-border-soft',
    Failed:     'bg-[#FFF0F0] text-danger border border-[#FFD5D5]',
  }[s] ?? 'bg-surface-soft text-text-muted');

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="bg-surface rounded-lg p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center text-primary">
            <Bell size={22} />
          </div>
          <div className="flex-1">
            <div className="text-[24px] font-semibold leading-9 text-text">Notifications</div>
            <div className="text-[14px] text-text tracking-[0.25px]">Schedule and send notifications to campaign members</div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-primary hover:bg-primary-hover text-white rounded text-[14px] font-medium px-5 py-2.5 cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={15} /> Create Notification
          </button>
        </div>

        {/* Table */}
        <div className="bg-surface rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-4 border-b border-border-soft gap-4">
            <div className="text-[18px] font-semibold leading-7 text-text">All Notifications</div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications…"
              className="border border-border rounded px-3 py-2 text-[13px] text-text outline-none focus:border-primary w-56"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-soft border-b border-border-soft">
                <tr className="text-[14px] font-semibold text-text">
                  <th className="py-4 px-6 text-left">Notification Name</th>
                  <th className="py-4 px-4 text-left">Channels</th>
                  <th className="py-4 px-6 text-left">Campaign</th>
                  <th className="py-4 px-4 text-left">Schedule Date</th>
                  <th className="py-4 px-4 text-left">Status</th>
                  <th className="py-4 px-6 text-center w-[80px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((n) => (
                  <tr key={n.id} className="border-b border-border-soft hover:bg-surface-soft/60">
                    <td className="py-4 px-6 text-[14px] font-medium text-text">{n.name}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1">
                        {n.channels.map((ch) => <ChannelPill key={ch} id={ch} />)}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[13px] text-text-secondary max-w-[180px] truncate">{campaignName(n.campaignId)}</td>
                    <td className="py-4 px-4 text-[13px] text-text-muted">{n.scheduleDate}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[12px] font-medium ${statusColor(n.status)}`}>
                        {n.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <button className="text-primary hover:bg-primary-soft p-1.5 rounded cursor-pointer" title="View">
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="py-12 text-center text-text-secondary text-[14px]">No notifications found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-border-soft px-6 py-3 flex items-center justify-end gap-6 text-[12px] text-text">
            <div className="flex items-center gap-2">
              <span className="text-text-secondary">Rows per page:</span>
              <button className="inline-flex items-center gap-1 px-1.5 py-0.5 hover:bg-surface-soft rounded cursor-pointer">
                10 <ChevronDown size={12} />
              </button>
            </div>
            <div>1–{filtered.length} of {filtered.length}</div>
            <div className="flex items-center gap-1 text-text-secondary">
              <button className="p-1 hover:bg-surface-soft rounded cursor-not-allowed opacity-40" disabled><ChevronLeft size={16} /></button>
              <button className="p-1 hover:bg-surface-soft rounded cursor-not-allowed opacity-40" disabled><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      </div>

      {showCreate && <CreateNotification onClose={() => setShowCreate(false)} />}
    </>
  );
}
