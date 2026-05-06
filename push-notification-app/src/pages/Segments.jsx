import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Eye, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { SEGMENTS } from '../data/engageData';

export default function Segments() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const filtered = SEGMENTS.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-surface rounded-lg p-4 flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary-soft flex items-center justify-center text-primary">
          <Users size={22} />
        </div>
        <div className="flex-1">
          <div className="text-[24px] font-semibold leading-9 text-text">Segments</div>
          <div className="text-[14px] text-text tracking-[0.25px]">Define and manage member segments to target campaigns effectively</div>
        </div>
        <button className="bg-primary hover:bg-primary-hover text-white rounded text-[14px] font-medium px-5 py-2.5 cursor-pointer">
          + Create Segment
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border-soft gap-4">
          <div className="text-[18px] font-semibold leading-7 text-text">All Segments</div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search segments…"
            className="border border-border rounded px-3 py-2 text-[13px] text-text outline-none focus:border-primary w-56"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-soft border-b border-border-soft">
              <tr className="text-[14px] font-semibold text-text">
                <th className="py-4 px-6 text-left">Segment Name</th>
                <th className="py-4 px-6 text-left">Behaviour</th>
                <th className="py-4 px-4 text-left">Members</th>
                <th className="py-4 px-4 text-left">Campaigns</th>
                <th className="py-4 px-6 text-left">Created On</th>
                <th className="py-4 px-6 text-center w-[80px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-border-soft hover:bg-surface-soft/60 cursor-pointer"
                  onClick={() => navigate(`/segments/${s.id}`)}
                >
                  <td className="py-4 px-6 text-[14px] font-medium text-text">{s.name}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[12px] font-medium ${
                      s.behaviour === 'Dynamic'
                        ? 'bg-primary-soft text-primary'
                        : 'bg-surface-soft text-text-muted border border-border-soft'
                    }`}>
                      {s.behaviour}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[14px] text-text">{s.memberCount.toLocaleString()} <span className="text-text-secondary text-[12px]">of {s.totalMembers}</span></td>
                  <td className="py-4 px-4 text-[14px] text-text">{s.campaignCount}</td>
                  <td className="py-4 px-6 text-[14px] text-text-muted">{s.createdOn}</td>
                  <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/segments/${s.id}`)}
                      className="text-primary hover:bg-primary-soft p-1.5 rounded cursor-pointer"
                      title="View"
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-text-secondary text-[14px]">No segments found.</td></tr>
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
  );
}
