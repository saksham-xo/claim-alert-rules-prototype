import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Users, TrendingUp, BadgeCheck } from 'lucide-react';
import { CAMPAIGNS, segmentById } from '../data/engageData';

export default function ViewCampaign() {
  const { id } = useParams();
  const campaign = CAMPAIGNS.find((c) => c.id === id);

  if (!campaign) {
    return (
      <div className="bg-surface rounded-lg p-8 text-center text-text-secondary">
        Campaign not found. <Link to="/campaigns" className="text-primary">Go back</Link>
      </div>
    );
  }

  const seg = segmentById(campaign.segmentId);

  return (
    <div className="flex flex-col gap-6">
      {/* Back header */}
      <div className="bg-surface rounded-lg px-4 py-4 flex items-center gap-2">
        <Link to="/campaigns" className="text-text-secondary hover:text-text"><ArrowLeft size={20} /></Link>
        <span className="text-[20px] font-semibold text-text">View Campaign</span>
      </div>

      {/* Summary */}
      <div className="bg-surface rounded-lg p-6">
        <div className="flex items-start justify-between mb-1">
          <div className="text-[22px] font-semibold text-text">{campaign.name}</div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-medium ${
            campaign.status === 'Active'
              ? 'bg-[#E6F9EC] text-[#1A7F37]'
              : 'bg-surface-soft text-text-muted border border-border-soft'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${campaign.status === 'Active' ? 'bg-[#1A7F37]' : 'bg-text-muted'}`} />
            {campaign.status}
          </span>
        </div>

        {/* Metadata row */}
        <div className="flex flex-wrap gap-5 text-[13px] text-text-secondary mt-3">
          <MetaItem label="Segment" value={seg?.name ?? campaign.segmentId} />
          <span className="text-border">|</span>
          <MetaItem label="Start Date" value={campaign.startDate} />
          <span className="text-border">|</span>
          <MetaItem label="End Date" value={campaign.endDate} />
          <span className="text-border">|</span>
          <MetaItem label="Capping" value={campaign.capping} />
          <span className="text-border">|</span>
          <MetaItem label="Created On" value={campaign.createdOn} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-5">
          <StatCard
            icon={<Users size={18} className="text-primary" />}
            label="Total Enrolled"
            value={campaign.enrolledMembers !== null ? campaign.enrolledMembers.toLocaleString() : '—'}
          />
          <StatCard
            icon={<BadgeCheck size={18} className="text-[#1A7F37]" />}
            label="Qualified Members"
            value={campaign.qualifiedMembers.toLocaleString()}
          />
          <StatCard
            icon={<TrendingUp size={18} className="text-[#F86900]" />}
            label="New Points Issued"
            value={campaign.newPointsIssued.toLocaleString()}
          />
        </div>
      </div>

      {/* Campaign Rules */}
      <div className="bg-surface rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-border-soft">
          <div className="text-[16px] font-semibold text-text">Campaign Rules</div>
          <div className="text-[12px] text-text-secondary mt-0.5">Point accrual logic applied to qualifying transactions</div>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {campaign.rules.map((rule, idx) => (
            <div key={rule.id} className="border border-border-soft rounded-lg overflow-hidden">
              <div className="bg-surface-soft px-4 py-2 border-b border-border-soft flex items-center gap-2">
                <span className="text-[12px] font-semibold text-text-secondary uppercase tracking-wide">Rule {idx + 1}</span>
                <span className="ml-auto text-[12px] text-text-muted">Points: <span className="text-text font-medium">{rule.reward}</span></span>
              </div>
              <div className="p-4 font-mono text-[13px] leading-6 whitespace-pre-wrap">
                {rule.conditions.map((seg, i) => (
                  seg.highlight
                    ? <span key={i} className="text-primary font-semibold">{seg.text}</span>
                    : <span key={i} className="text-text">{seg.text}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetaItem({ label, value }) {
  return (
    <span>{label}: <span className="text-text font-medium">{value}</span></span>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="border border-border-soft rounded-lg p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-surface-soft flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-[12px] text-text-secondary">{label}</div>
        <div className="text-[18px] font-semibold text-text">{value}</div>
      </div>
    </div>
  );
}
