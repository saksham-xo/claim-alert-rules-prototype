import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, Eye, ChevronLeft, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { CAMPAIGNS, SEGMENTS } from '../data/engageData';
import CreateCampaign from './CreateCampaign';

export default function Campaigns() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const filtered = CAMPAIGNS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const segName = (id) => SEGMENTS.find((s) => s.id === id)?.name ?? id;

  return (
    <>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="bg-surface rounded-lg p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center text-primary">
            <Megaphone size={22} />
          </div>
          <div className="flex-1">
            <div className="text-[24px] font-semibold leading-9 text-text">Campaigns</div>
            <div className="text-[14px] text-text tracking-[0.25px]">Create and manage loyalty campaigns linked to member segments</div>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="bg-primary hover:bg-primary-hover text-white rounded text-[14px] font-medium px-5 py-2.5 cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={15} /> Create Campaign
          </button>
        </div>

        {/* Table */}
        <div className="bg-surface rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-4 border-b border-border-soft gap-4">
            <div className="text-[18px] font-semibold leading-7 text-text">All Campaigns</div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns…"
              className="border border-border rounded px-3 py-2 text-[13px] text-text outline-none focus:border-primary w-56"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-soft border-b border-border-soft">
                <tr className="text-[14px] font-semibold text-text">
                  <th className="py-4 px-6 text-left">Campaign Name</th>
                  <th className="py-4 px-4 text-left">Status</th>
                  <th className="py-4 px-6 text-left">Segment</th>
                  <th className="py-4 px-4 text-left">Period</th>
                  <th className="py-4 px-4 text-left">Qualified</th>
                  <th className="py-4 px-4 text-left">Points Issued</th>
                  <th className="py-4 px-6 text-center w-[80px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border-soft hover:bg-surface-soft/60 cursor-pointer"
                    onClick={() => navigate(`/campaigns/${c.id}`)}
                  >
                    <td className="py-4 px-6 text-[14px] font-medium text-text">{c.name}</td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[12px] font-medium ${
                        c.status === 'Active'
                          ? 'bg-[#E6F9EC] text-[#1A7F37]'
                          : 'bg-surface-soft text-text-muted border border-border-soft'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[13px] text-text-secondary max-w-[180px] truncate">{segName(c.segmentId)}</td>
                    <td className="py-4 px-4 text-[13px] text-text-muted whitespace-nowrap">
                      {c.period.start} – {c.period.end}
                    </td>
                    <td className="py-4 px-4 text-[14px] text-text">{c.qualifiedMembers.toLocaleString()}</td>
                    <td className="py-4 px-4 text-[14px] text-text">{c.newPointsIssued.toLocaleString()}</td>
                    <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/campaigns/${c.id}`)}
                        className="text-primary hover:bg-primary-soft p-1.5 rounded cursor-pointer"
                        title="View"
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-text-secondary text-[14px]">No campaigns found.</td></tr>
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

      {showCreate && <CreateCampaign onClose={() => setShowCreate(false)} />}
    </>
  );
}
