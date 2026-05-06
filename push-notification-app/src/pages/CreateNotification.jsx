import { useState } from 'react';
import { X, Mail, Bell, ChevronDown, Check, Calendar } from 'lucide-react';
import { CAMPAIGNS } from '../data/engageData';

const STEPS = ['Template', 'Delivery', 'Review & Save'];

const CHANNEL_CONFIG = {
  email: {
    id: 'email',
    label: 'Email',
    icon: Mail,
    color: 'text-[#F86900]',
    bg: 'bg-[#FFF4ED]',
    border: 'border-[#F86900]',
    desc: 'Send rich HTML email to members',
  },
  push: {
    id: 'push',
    label: 'Push Notification',
    icon: Bell,
    color: 'text-primary',
    bg: 'bg-primary-soft',
    border: 'border-primary',
    desc: 'Send push alert to the mobile app',
  },
};

export default function CreateNotification({ onClose }) {
  const [step, setStep] = useState(0);
  const [channels, setChannels] = useState({ email: false, push: false });
  const [campaignId, setCampaignId] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [saved, setSaved] = useState(false);

  const selectedCampaign = CAMPAIGNS.find((c) => c.id === campaignId);
  const activeChannels = Object.entries(channels).filter(([, v]) => v).map(([k]) => k);

  const autoName = selectedCampaign
    ? `${selectedCampaign.name.replace(/\s+/g, '_')}_template_${Date.now()}`
    : '';

  const canProceed = () => {
    if (step === 0) return activeChannels.length > 0;
    if (step === 1) return !!campaignId && !!scheduleDate;
    return true;
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => onClose(), 1200);
  };

  const toggleChannel = (id) => setChannels((prev) => ({ ...prev, [id]: !prev[id] }));

  if (saved) {
    return (
      <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center">
        <div className="bg-surface rounded-xl p-10 flex flex-col items-center gap-4 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-[#E6F9EC] flex items-center justify-center">
            <Check size={32} className="text-[#1A7F37]" />
          </div>
          <div className="text-[18px] font-semibold text-text">Notification Scheduled!</div>
          <div className="text-[13px] text-text-secondary">{autoName || 'Notification created'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[760px] w-full mx-auto my-8 bg-surface rounded-xl shadow-xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-soft">
            <span className="text-[18px] font-semibold text-text">Create Notification</span>
            <button onClick={onClose} className="text-text-secondary hover:text-text cursor-pointer"><X size={20} /></button>
          </div>

          {/* Stepper */}
          <div className="px-6 py-5 border-b border-border-soft">
            <div className="flex items-center gap-0">
              {STEPS.map((label, i) => {
                const done = i < step;
                const active = i === step;
                return (
                  <div key={i} className="flex items-center flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-semibold border-2 shrink-0 ${
                        done ? 'bg-primary border-primary text-white' :
                        active ? 'border-primary text-primary bg-white' :
                        'border-border text-text-muted bg-white'
                      }`}>
                        {done ? <Check size={14} /> : i + 1}
                      </div>
                      <span className={`text-[13px] ${active ? 'text-primary font-medium' : done ? 'text-text' : 'text-text-muted'}`}>{label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-px mx-3 ${done ? 'bg-primary' : 'bg-border-soft'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 flex-1">
            {step === 0 && (
              <StepChannels channels={channels} toggle={toggleChannel} />
            )}
            {step === 1 && (
              <StepDelivery
                campaignId={campaignId}
                setCampaignId={setCampaignId}
                scheduleDate={scheduleDate}
                setScheduleDate={setScheduleDate}
                activeChannels={activeChannels}
              />
            )}
            {step === 2 && (
              <StepReview
                autoName={autoName}
                activeChannels={activeChannels}
                selectedCampaign={selectedCampaign}
                scheduleDate={scheduleDate}
              />
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border-soft flex items-center justify-between">
            <button
              onClick={() => step > 0 ? setStep(step - 1) : onClose()}
              className="border border-border text-text-secondary rounded px-5 py-2 text-[14px] cursor-pointer hover:bg-surface-soft"
            >
              {step === 0 ? 'Cancel' : 'Back'}
            </button>
            <button
              disabled={!canProceed()}
              onClick={() => step < STEPS.length - 1 ? setStep(step + 1) : handleSave()}
              className={`rounded px-6 py-2 text-[14px] font-medium cursor-pointer ${
                canProceed()
                  ? 'bg-primary text-white hover:bg-primary-hover'
                  : 'bg-border text-text-muted cursor-not-allowed'
              }`}
            >
              {step === STEPS.length - 1 ? 'Save & Schedule' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepChannels({ channels, toggle }) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-[15px] font-semibold text-text mb-1">Select Notification Channels</div>
        <div className="text-[13px] text-text-secondary">Choose how to reach members for this notification</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Object.values(CHANNEL_CONFIG).map((ch) => {
          const Icon = ch.icon;
          const active = channels[ch.id];
          return (
            <button
              key={ch.id}
              onClick={() => toggle(ch.id)}
              className={`relative border-2 rounded-xl p-5 text-left flex flex-col gap-3 transition-all cursor-pointer ${
                active ? `${ch.border} ${ch.bg}` : 'border-border-soft hover:border-border'
              }`}
            >
              {active && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${active ? ch.bg : 'bg-surface-soft'}`}>
                <Icon size={20} className={active ? ch.color : 'text-text-muted'} />
              </div>
              <div>
                <div className={`text-[14px] font-semibold ${active ? 'text-text' : 'text-text-secondary'}`}>{ch.label}</div>
                <div className="text-[12px] text-text-muted mt-0.5">{ch.desc}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepDelivery({ campaignId, setCampaignId, scheduleDate, setScheduleDate, activeChannels }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="text-[15px] font-semibold text-text mb-1">Delivery Settings</div>
        <div className="text-[13px] text-text-secondary">Select the campaign and when to deliver this notification</div>
      </div>

      {/* Selected channels summary */}
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-text-secondary">Sending via:</span>
        {activeChannels.map((ch) => {
          const cfg = CHANNEL_CONFIG[ch];
          const Icon = cfg.icon;
          return (
            <span key={ch} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[12px] font-medium ${cfg.bg} ${cfg.color}`}>
              <Icon size={11} /> {cfg.label}
            </span>
          );
        })}
      </div>

      {/* Campaign */}
      <div>
        <label className="text-[13px] font-medium text-text block mb-1.5">Campaign</label>
        <div className="relative">
          <select
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            className="w-full border border-border rounded px-3 py-2.5 text-[14px] text-text outline-none focus:border-primary appearance-none bg-surface pr-8 cursor-pointer"
          >
            <option value="">Select a campaign…</option>
            {CAMPAIGNS.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
        </div>
      </div>

      {/* Schedule Date */}
      <div>
        <label className="text-[13px] font-medium text-text block mb-1.5">
          <span className="inline-flex items-center gap-1.5"><Calendar size={13} /> Schedule Date</span>
        </label>
        <input
          type="date"
          value={scheduleDate}
          onChange={(e) => setScheduleDate(e.target.value)}
          className="w-full border border-border rounded px-3 py-2.5 text-[14px] text-text outline-none focus:border-primary"
        />
        <div className="text-[12px] text-text-muted mt-1">Notification will be sent at 09:00 AM on the selected date</div>
      </div>
    </div>
  );
}

function StepReview({ autoName, activeChannels, selectedCampaign, scheduleDate }) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="text-[15px] font-semibold text-text mb-1">Review Notification</div>
        <div className="text-[13px] text-text-secondary">Confirm the details before scheduling</div>
      </div>

      {/* Auto-generated name */}
      <div className="border border-border-soft rounded-lg p-4 bg-surface-soft">
        <div className="text-[12px] text-text-secondary mb-1">Auto-generated Notification Name</div>
        <div className="text-[14px] font-mono font-medium text-text break-all">{autoName || '—'}</div>
      </div>

      {/* Summary */}
      <div className="border border-border-soft rounded-lg overflow-hidden">
        <div className="bg-surface-soft px-4 py-3 border-b border-border-soft text-[14px] font-semibold text-text">Notification Details</div>
        <div className="px-4 py-4 flex flex-col gap-3 text-[13px]">
          <ReviewRow label="Channels">
            <div className="flex items-center gap-1">
              {activeChannels.map((ch) => {
                const cfg = CHANNEL_CONFIG[ch];
                const Icon = cfg.icon;
                return (
                  <span key={ch} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[12px] font-medium ${cfg.bg} ${cfg.color}`}>
                    <Icon size={11} /> {cfg.label}
                  </span>
                );
              })}
            </div>
          </ReviewRow>
          <ReviewRow label="Campaign" value={selectedCampaign?.name ?? '—'} />
          <ReviewRow label="Schedule Date" value={scheduleDate || '—'} />
          <ReviewRow label="Status" value="Scheduled" />
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value, children }) {
  return (
    <div className="flex items-start gap-4">
      <span className="text-text-secondary w-32 shrink-0">{label}</span>
      {children || <span className="text-text font-medium">{value}</span>}
    </div>
  );
}
