import { Mail, Smartphone, MessageCircle, Bell, ChevronRight } from 'lucide-react';
import Toggle from './Toggle';

const ICONS = {
  email:    Mail,
  sms:      Smartphone,
  whatsapp: MessageCircle,
  push:     Bell,
};

const HINTS = {
  email:    'Customise your email template',
  sms:      'Customise your SMS template',
  whatsapp: 'Customise your WhatsApp template',
  push:     'Customise your push notification template',
};

const SETUP_LABEL = {
  email:    'Email',
  sms:      'SMS',
  whatsapp: 'WhatsApp',
  push:     'Push Notification',
};

export default function ChannelCard({ id, label, enabled, configured, onToggle, onSetup }) {
  const Icon = ICONS[id];
  return (
    <div className="border border-border-soft rounded-lg p-4 flex flex-col gap-3 bg-surface">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-full bg-primary-soft text-primary flex items-center justify-center">
            <Icon size={16} />
          </span>
          <span className="text-[14px] font-semibold text-text">{label}</span>
        </div>
        <Toggle size="sm" checked={enabled} onChange={onToggle} />
      </div>
      <div className="text-[13px] text-text-muted tracking-[0.25px]">{HINTS[id]}</div>
      <div>
        <button
          type="button"
          onClick={onSetup}
          disabled={!enabled}
          className={`flex items-center gap-1 text-[13px] font-medium px-3 py-2 rounded ${
            enabled
              ? 'bg-primary hover:bg-primary-hover text-white cursor-pointer'
              : 'bg-primary-tint text-white cursor-not-allowed'
          }`}
        >
          {configured ? `Update ${SETUP_LABEL[id]}` : `Setup ${SETUP_LABEL[id]}`}
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
