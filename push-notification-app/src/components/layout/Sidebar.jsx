import { NavLink } from 'react-router-dom';
import {
  LayoutGrid, Users, SlidersHorizontal, Trophy, FileSearch,
  PieChart, Megaphone, MessageSquareText,
  FileText, BarChart3,
  UserCog, ShieldCheck, ScrollText,
  Settings,
  Sparkles,
  Globe, ChevronDown,
} from 'lucide-react';

const SECTIONS = [
  {
    label: 'Main Menu',
    items: [
      { icon: LayoutGrid,         label: 'Loyalty Overview' },
      { icon: Users,              label: 'Members' },
      { icon: SlidersHorizontal,  label: 'Rule Engine' },
      { icon: Trophy,             label: 'Tiers' },
      { icon: FileSearch,         label: 'Anomaly Detection' },
    ],
  },
  {
    label: 'Engage',
    items: [
      { icon: PieChart,           label: 'Segments' },
      { icon: Megaphone,          label: 'Campaigns' },
      { icon: MessageSquareText,  label: 'Communication', to: '/communication', active: true },
    ],
  },
  {
    label: 'Insights',
    items: [
      { icon: FileText,           label: 'Reports' },
      { icon: BarChart3,          label: 'Analytics' },
    ],
  },
  {
    label: 'Access Control',
    items: [
      { icon: UserCog,            label: 'Manage Team' },
      { icon: ShieldCheck,        label: 'Approval Workflow' },
      { icon: ScrollText,         label: 'Audit Trail' },
    ],
  },
  {
    label: 'Configuration',
    items: [
      { icon: Settings,           label: 'Program Settings' },
    ],
  },
  {
    label: 'Marketplace',
    items: [
      { icon: Sparkles,           label: 'Plum' },
    ],
  },
];

export default function Sidebar() {
  return (
    <aside className="w-[280px] shrink-0 bg-surface rounded-lg p-5 flex flex-col gap-3 self-start">
      {SECTIONS.map((section, idx) => (
        <div key={section.label}>
          <div className="px-2 py-1 text-[12px] text-text-secondary tracking-[0.15px]">{section.label}</div>
          <div className="flex flex-col gap-1">
            {section.items.map((item) => {
              const Icon = item.icon;
              if (item.to) {
                return (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    end={false}
                    className={({ isActive }) =>
                      `flex items-center gap-2 h-8 px-2 rounded text-[16px] tracking-[0.15px] ${
                        isActive
                          ? 'bg-accent-yellow text-text font-medium'
                          : 'text-text-secondary hover:bg-surface-soft'
                      }`
                    }
                  >
                    <Icon size={16} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              }
              return (
                <div
                  key={item.label}
                  className="flex items-center gap-2 h-8 px-2 rounded text-[16px] text-text-secondary tracking-[0.15px] cursor-default select-none"
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
          {idx !== SECTIONS.length - 1 && <div className="border-t border-border-soft mt-3" />}
        </div>
      ))}

      <div className="flex items-center justify-between pt-3 px-2">
        <div className="flex items-center gap-1 text-[12px] text-text-secondary">
          <Globe size={14} />
          <span>English (UK)</span>
        </div>
        <ChevronDown size={16} className="text-text-secondary" />
      </div>
      <div className="px-2 pt-1 text-[10px] text-text-secondary leading-tight">
        <div>Version 7.14.0</div>
        <div>Release Date: 07 March 2025</div>
      </div>
    </aside>
  );
}
