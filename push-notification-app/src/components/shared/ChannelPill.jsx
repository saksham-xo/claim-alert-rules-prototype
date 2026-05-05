const STYLES = {
  sms:      { bg: 'bg-sms-bg',      text: 'text-sms' },
  email:    { bg: 'bg-email-bg',    text: 'text-email' },
  whatsapp: { bg: 'bg-whatsapp-bg', text: 'text-whatsapp' },
  push:     { bg: 'bg-push-bg',     text: 'text-push' },
};

const LABEL = {
  sms: 'SMS',
  email: 'Email',
  whatsapp: 'WhatsApp',
  push: 'Push',
};

export default function ChannelPill({ id, compact = false }) {
  const style = STYLES[id] ?? STYLES.sms;
  if (compact) {
    return (
      <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[11px] font-medium tracking-[0.25px] lowercase ${style.bg} ${style.text}`}>
        {id}
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-lg text-[12px] font-semibold tracking-[0.25px] ${style.bg} ${style.text}`}>
      {LABEL[id]}
    </span>
  );
}

export function EmptyChannelsPill() {
  return <span className="inline-block w-12 h-2 rounded-full bg-accent-yellow" aria-label="No channels active" />;
}
