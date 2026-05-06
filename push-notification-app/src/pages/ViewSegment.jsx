import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Users, TrendingUp, ChevronDown } from 'lucide-react';
import { SEGMENTS, CAMPAIGNS } from '../data/engageData';

const CHART_DAYS = ['30 Apr', '1 May', '2 May', '3 May', '4 May', '5 May', '6 May'];
const CHART_VALUES = [0.05, 0.12, 0.08, 0.18, 0.09, 0.22, 0.14];

export default function ViewSegment() {
  const { id } = useParams();
  const [rangeTab, setRangeTab] = useState('Past 7 Days');
  const seg = SEGMENTS.find((s) => s.id === id);

  if (!seg) {
    return (
      <div className="bg-surface rounded-lg p-8 text-center text-text-secondary">
        Segment not found. <Link to="/segments" className="text-primary">Go back</Link>
      </div>
    );
  }

  const segCampaigns = CAMPAIGNS.filter((c) => c.segmentId === id);

  return (
    <div className="flex flex-col gap-6">
      {/* Back header */}
      <div className="bg-surface rounded-lg px-4 py-4 flex items-center gap-2">
        <Link to="/segments" className="text-text-secondary hover:text-text"><ArrowLeft size={20} /></Link>
        <span className="text-[20px] font-semibold text-text">View Segment</span>
      </div>

      {/* Summary */}
      <div className="bg-surface rounded-lg p-6">
        <div className="text-[22px] font-semibold text-text mb-2">{seg.name}</div>
        <div className="flex flex-wrap gap-6 text-[13px] text-text-secondary">
          <span>Date Created: <span className="text-text font-medium">{seg.createdOn}</span></span>
          <span>|</span>
          <span>Last Edited by: <span className="text-text font-medium">{seg.lastEditedBy}</span></span>
          <span>|</span>
          <span>Last Edited on: <span className="text-text font-medium">{seg.lastEditedOn}</span></span>
          <span>|</span>
          <span>Segment Behaviour: <span className="text-text font-medium">{seg.behaviour}</span></span>
        </div>

        {/* Filter cards */}
        <div className="grid grid-cols-2 gap-4 mt-5">
          <FilterCard
            title="Member Attributes Selection"
            filters={seg.memberFilters}
            color="blue"
          />
          <FilterCard
            title="Transaction Attributes Selection"
            filters={seg.transactionFilters}
            color="orange"
          />
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 mt-4">
          <StatCard
            icon={<Users size={20} className="text-primary" />}
            value={`${seg.memberCount} of ${seg.totalMembers} Members in This Segment`}
          />
          <StatCard
            icon={<TrendingUp size={20} className="text-[#F86900]" />}
            value={`${seg.campaignCount} Total Campaigns`}
          />
        </div>
      </div>

      {/* Analytics chart */}
      <div className="bg-surface rounded-lg overflow-hidden">
        {/* Tab bar */}
        <div className="border-b border-border-soft px-6">
          <div className="flex gap-0">
            {['Point', ...segCampaigns.slice(0, 3).map((c) => c.name.slice(0, 8))].map((tab, i) => (
              <button
                key={i}
                className={`px-4 py-3 text-[13px] border-b-2 -mb-px transition-colors cursor-pointer ${
                  i === 0 ? 'border-primary text-primary font-medium' : 'border-transparent text-text-secondary hover:text-text'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="text-[16px] font-semibold text-text">Total Transaction Value</div>
              <div className="text-[12px] text-text-secondary mt-0.5">Analyze total transaction value per member in this segment</div>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border-soft rounded text-[12px] text-text cursor-pointer">
              {rangeTab} <ChevronDown size={12} />
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mb-4 text-[12px] text-text-secondary">
            <span className="inline-block w-10 h-1 rounded bg-primary" />
            <span>Total Amount</span>
          </div>

          {/* SVG line chart */}
          <LineChart days={CHART_DAYS} values={CHART_VALUES} />
        </div>
      </div>
    </div>
  );
}

function FilterCard({ title, filters, color }) {
  const tagBg = color === 'blue' ? 'bg-primary-soft text-primary' : 'bg-[#FFF1E5] text-[#F86900]';
  return (
    <div className="border border-border-soft rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${tagBg}`}>FILTER</span>
        <span className="text-[14px] font-semibold text-text">{title}</span>
      </div>
      {filters.length === 0 ? (
        <span className="text-[13px] text-text-muted italic">No {title.toLowerCase().split(' ')[0].toLowerCase()} filters</span>
      ) : (
        <div className="flex flex-wrap gap-2">
          {filters.map((f, i) => (
            <span key={i} className="inline-flex items-center px-3 py-1 rounded-full border border-border text-[12px] text-text bg-surface-soft">
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, value }) {
  return (
    <div className="border border-border-soft rounded-lg p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-surface-soft flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="text-[14px] font-medium text-text">{value}</span>
    </div>
  );
}

function LineChart({ days, values }) {
  const W = 800, H = 180, PAD = { top: 16, right: 16, bottom: 28, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;
  const max = Math.max(...values, 1);
  const xStep = chartW / (days.length - 1);

  const pts = values.map((v, i) => ({
    x: PAD.left + i * xStep,
    y: PAD.top + chartH - (v / max) * chartH,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length - 1].x},${PAD.top + chartH} L ${pts[0].x},${PAD.top + chartH} Z`;

  const yTicks = [0, 0.2, 0.4, 0.6, 0.8, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 180 }}>
      {/* Y grid lines */}
      {yTicks.map((t) => {
        const y = PAD.top + chartH - (t / 1) * chartH;
        return (
          <g key={t}>
            <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#E5F3FF" strokeWidth={1} />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" fontSize={10} fill="#607A9F">{t}</text>
          </g>
        );
      })}
      {/* Area fill */}
      <path d={areaPath} fill="#0070FF" fillOpacity={0.08} />
      {/* Line */}
      <path d={linePath} fill="none" stroke="#0070FF" strokeWidth={2} strokeLinejoin="round" />
      {/* Dots */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3.5} fill="#0070FF" />
      ))}
      {/* X labels */}
      {days.map((d, i) => (
        <text key={i} x={PAD.left + i * xStep} y={H - 4} textAnchor="middle" fontSize={10} fill="#607A9F">{d}</text>
      ))}
    </svg>
  );
}
