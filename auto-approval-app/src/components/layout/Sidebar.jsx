import { NavLink } from 'react-router-dom';
import { Home, Users, Settings, BarChart3, Layers, Megaphone, Mail, FileText, PieChart, QrCode, ClipboardCheck, Image, Video, Smartphone, Smile, UserCog, CheckCircle, Clock, ChevronRight, Bell, Globe } from 'lucide-react';
import { useState } from 'react';
const activeLinkClass = ({ isActive }) =>
  `flex items-center gap-2.5 px-5 py-2 text-[13px] border-l-[3px] transition-all cursor-pointer ${
    isActive
      ? 'border-primary bg-[rgba(63,81,181,0.06)] text-primary font-medium'
      : 'border-transparent text-text-secondary hover:bg-bg'
  }`;

const activeSubClass = ({ isActive }) =>
  `block py-1.5 pl-12 text-[12px] cursor-pointer ${
    isActive ? 'text-primary font-medium' : 'text-text-secondary hover:text-text'
  }`;

const inertClass = 'flex items-center gap-2.5 px-5 py-2 text-[13px] border-l-[3px] border-transparent text-text-secondary/50 cursor-default';
const inertSubClass = 'block py-1.5 pl-12 text-[12px] text-text-secondary/50 cursor-default';

export default function Sidebar() {
  const [claimsOpen, setClaimsOpen] = useState(true);
  return (
    <aside className="w-60 bg-surface flex flex-col shrink-0 rounded-[10px] shadow-[0_0_1px_1px_var(--color-border)]">
      <nav className="flex-1 py-2">
        <Section label="Main Menu" />
        <Inert icon={<Home size={16} />} label="Loyalty Overview" />
        <Inert icon={<Users size={16} />} label="Members" />
        <Inert icon={<Settings size={16} />} label="Rule Engine" />
        <Inert icon={<Layers size={16} />} label="Tiers" />

        <Section label="Engage" />
        <Inert icon={<BarChart3 size={16} />} label="Segments" />
        <Inert icon={<Megaphone size={16} />} label="Campaigns" />
        <Inert icon={<Mail size={16} />} label="Communications" />

        <Section label="Reports & Analytics" />
        <Inert icon={<FileText size={16} />} label="Data Exports" />
        <Inert icon={<PieChart size={16} />} label="Dashboards" />
        <NavLink to="/alert-dashboard" className={activeLinkClass}>
          <Bell size={16} /> Alert Dashboard
        </NavLink>

        <Section label="Partners & Promotions" />
        <Inert icon={<QrCode size={16} />} label="QR Code" />

        <button
          onClick={() => setClaimsOpen(!claimsOpen)}
          className="flex items-center gap-2.5 px-5 py-2 text-[13px] border-l-[3px] border-transparent text-text-secondary hover:bg-bg w-full cursor-pointer"
        >
          <ClipboardCheck size={16} />
          <span className="flex-1 text-left">Claims Management</span>
          <ChevronRight size={14} className={`transition-transform ${claimsOpen ? 'rotate-90' : ''}`} />
        </button>

        {claimsOpen && (
          <div>
            <NavLink to="/partner-promotions/invoice-management" className={activeSubClass}>Invoices</NavLink>
            <div className={inertSubClass}>Visibility</div>
          </div>
        )}

        <Inert icon={<Image size={16} />} label="Scheme Banner" />
        <Inert icon={<Video size={16} />} label="Video Management" />
        <Inert icon={<Smartphone size={16} />} label="Channel Partner Config" />
        <Inert icon={<Smile size={16} />} label="Gamification" />

        <Section label="Access Control" />
        <NavLink to="/role-permissions" className={activeLinkClass}>
          <UserCog size={16} /> Manage Team
        </NavLink>
        <Inert icon={<CheckCircle size={16} />} label="Approval Workflow" />
        <Inert icon={<Clock size={16} />} label="Audit Trail" />

        <Section label="Configuration" />
        <Inert icon={<Settings size={16} />} label="Program Settings" />
      </nav>

      <div className="border-t border-border px-5 py-3 text-[11px] text-text-secondary">
        <div className="flex items-center gap-1.5"><Globe size={12} /> English (En)</div>
      </div>
    </aside>
  );
}

function Section({ label }) {
  return <div className="px-5 pt-3 pb-1 text-[10px] font-bold uppercase text-text-secondary tracking-wider">{label}</div>;
}

function Inert({ icon, label }) {
  return <div className={inertClass}>{icon} {label}</div>;
}
