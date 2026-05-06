import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal, Download, ChevronDown, Pencil, Trash2, X } from 'lucide-react';
import { useStore, eventLabel, CHANNELS } from '../data/store';
import ChannelPill from '../components/shared/ChannelPill';
import PushPreview from '../components/shared/PushPreview';
import Modal from '../components/shared/Modal';

const RANGE_OPTIONS = ['Past 7 Days', 'Past 30 Days', 'Past 3 Months', 'Past 6 Months'];

const SAMPLE_LOGS_BY_CHANNEL = {
  push: [
    { ts: '04/05/2026 at 09:14:22', kind: 'push', status: 'successful', user: 'Gopal Jha' },
    { ts: '04/05/2026 at 09:14:19', kind: 'push', status: 'successful', user: 'Raqib Hussain' },
    { ts: '04/05/2026 at 09:14:17', kind: 'push', status: 'failed',     user: 'Farah Shah' },
    { ts: '04/05/2026 at 09:14:14', kind: 'push', status: 'successful', user: 'Kunal Shah' },
    { ts: '04/05/2026 at 09:13:58', kind: 'push', status: 'successful', user: 'Rahul Kumar' },
    { ts: '04/05/2026 at 09:13:51', kind: 'push', status: 'successful', user: 'Ajeet Singh' },
    { ts: '04/05/2026 at 09:13:44', kind: 'push', status: 'successful', user: 'Sneha Sharma' },
    { ts: '04/05/2026 at 09:13:37', kind: 'push', status: 'successful', user: 'Anjali Dutt' },
    { ts: '04/05/2026 at 09:13:29', kind: 'push', status: 'failed',     user: 'Yash Mehta' },
  ],
  sms: [
    { ts: '04/05/2026 at 09:14:22', kind: 'sms', status: 'successful', user: 'Gopal Jha' },
    { ts: '04/05/2026 at 09:14:17', kind: 'sms', status: 'failed',     user: 'Farah Shah' },
    { ts: '04/05/2026 at 09:13:58', kind: 'sms', status: 'successful', user: 'Rahul Kumar' },
    { ts: '04/05/2026 at 09:13:44', kind: 'sms', status: 'successful', user: 'Sneha Sharma' },
    { ts: '04/05/2026 at 09:13:37', kind: 'sms', status: 'successful', user: 'Anjali Dutt' },
  ],
  email: [
    { ts: '04/05/2026 at 09:14:22', kind: 'email', status: 'successful', user: 'Gopal Jha' },
    { ts: '04/05/2026 at 09:14:17', kind: 'email', status: 'failed',     user: 'Raqib Hussain' },
    { ts: '04/05/2026 at 09:13:58', kind: 'email', status: 'successful', user: 'Rahul Kumar' },
    { ts: '04/05/2026 at 09:13:44', kind: 'email', status: 'successful', user: 'Sneha Sharma' },
  ],
  whatsapp: [
    { ts: '04/05/2026 at 09:14:22', kind: 'whatsapp', status: 'successful', user: 'Gopal Jha' },
    { ts: '04/05/2026 at 09:14:17', kind: 'whatsapp', status: 'failed',     user: 'Raqib Hussain' },
    { ts: '04/05/2026 at 09:13:58', kind: 'whatsapp', status: 'successful', user: 'Farah Shah' },
  ],
};

function buildLogs(activeChannels) {
  const all = activeChannels.flatMap((c) => SAMPLE_LOGS_BY_CHANNEL[c.id] ?? []);
  return all.sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 9);
}

export default function ViewTemplate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { templates, deleteTemplate, showToast } = useStore();
  const t = templates.find((x) => x.id === id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [previewChannel, setPreviewChannel] = useState(null);

  if (!t) {
    return (
      <div className="bg-surface rounded-lg p-8 text-center text-text-secondary">
        Template not found. <Link to="/communication" className="text-primary">Go back</Link>
      </div>
    );
  }

  const activeChannels = CHANNELS.filter((c) => t.channels[c.id]);
  const logs = buildLogs(activeChannels);

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-surface rounded-lg px-4 py-4 flex items-center gap-2">
        <Link to="/communication" className="text-text-secondary hover:text-text" aria-label="Back">
          <ArrowLeft size={20} />
        </Link>
        <span className="text-[20px] font-semibold text-text">View Template</span>
      </div>

      {/* Summary */}
      <div className="bg-surface rounded-lg p-5">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <div className="text-[20px] font-semibold text-text">{t.name}</div>
            <div className="flex items-center gap-2 text-[13px] text-text-secondary">
              <span>{t.type}</span>
              <span className="px-2 py-0.5 rounded bg-surface-soft border border-border-soft text-text-muted text-[12px]">{eventLabel(t.event)}</span>
            </div>
            <div className="flex flex-wrap gap-1 pt-1">
              {activeChannels.map((c) => <ChannelPill key={c.id} id={c.id} />)}
            </div>
            <div className="text-[12px] text-text-muted">Sensitive Data: {t.sensitive ? 'True' : 'False'}</div>
          </div>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="text-text-secondary hover:text-text p-1.5 rounded hover:bg-surface-soft cursor-pointer">
              <MoreHorizontal size={18} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-10">
                <button
                  onClick={() => { setMenuOpen(false); navigate(`/communication/${t.id}/edit`); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[14px] text-text hover:bg-surface-soft cursor-pointer"
                >
                  <Pencil size={14} /> Edit
                </button>
                <button
                  onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-[14px] text-danger hover:bg-surface-soft cursor-pointer"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 mt-5 pt-4 border-t border-border-soft text-[13px]">
          <Meta label="Template ID" value={t.id} />
          <Meta label="Created On" value={t.createdOn} />
          <Meta label="Last Edited On" value={t.lastEdited} />
          <Meta label="Last Edited By" value={t.lastEditedBy} />
        </div>
      </div>

      {/* Performance grid */}
      <div className="grid grid-cols-2 gap-6">
        {CHANNELS.map((c) => (
          <PerfCard
            key={c.id}
            channel={c}
            data={t.perf?.[c.id]}
            active={t.channels[c.id]}
          />
        ))}
      </div>

      {/* Communication Channels */}
      <div className="bg-surface rounded-lg">
        <div className="px-5 py-4 border-b border-border-soft">
          <div className="text-[16px] font-semibold text-text">Communication Channels</div>
          <div className="text-[12px] text-text-secondary mt-0.5">
            Preview the configured Email, SMS and Whatsapp templates
          </div>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {CHANNELS.map((c) => (
            <PreviewRow
              key={c.id}
              channel={c}
              active={t.channels[c.id]}
              onPreview={() => setPreviewChannel(c.id)}
            />
          ))}
        </div>
      </div>

      {previewChannel && (
        <ChannelPreview
          channel={previewChannel}
          data={t[previewChannel]}
          templateName={t.name}
          onClose={() => setPreviewChannel(null)}
        />
      )}

      {/* Logs */}
      <div className="bg-surface rounded-lg">
        <div className="px-5 py-4 border-b border-border-soft flex items-center justify-between">
          <div className="text-[16px] font-semibold text-text">Template Logs</div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-1 text-[13px] text-primary cursor-pointer">
              <Download size={14} /> Download Logs
            </button>
            <RangeSelect />
          </div>
        </div>
        {logs.length === 0 ? (
          <div className="px-5 py-8 text-center text-[13px] text-text-secondary italic">No delivery logs yet.</div>
        ) : (
          <>
            <div className="divide-y divide-border-soft">
              {logs.map((l, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_auto] px-5 py-3 text-[13px] items-center">
                  <div className="text-text">
                    {LABEL[l.kind]} delivery{' '}
                    <span className={l.status === 'successful' ? 'text-success font-medium' : 'text-danger font-medium'}>
                      {l.status}
                    </span>{' '}
                    for <span className="text-primary">{l.user}</span>
                  </div>
                  <div className="text-text-secondary text-[12px]">{l.ts}</div>
                </div>
              ))}
            </div>
            <div className="px-5 py-3 border-t border-border-soft text-[12px] text-text text-right">
              Showing 1–{logs.length} of {logs.length} rows
            </div>
          </>
        )}
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete Template"
        size="sm"
        footer={
          <>
            <button onClick={() => setConfirmDelete(false)} className="border border-primary text-primary rounded px-5 py-2.5 text-[14px] font-medium cursor-pointer">Cancel</button>
            <button
              onClick={() => {
                deleteTemplate(t.id);
                showToast(`Template "${t.name}" deleted.`);
                navigate('/communication');
              }}
              className="bg-danger text-white rounded px-5 py-2.5 text-[14px] font-medium cursor-pointer"
            >
              Delete
            </button>
          </>
        }
      >
        <div className="px-6 py-5 text-[14px] text-text">
          Are you sure you want to delete <strong>{t.name}</strong>?
        </div>
      </Modal>
    </div>
  );
}

const LABEL = {
  email: 'Email',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  push: 'Push Notification',
};

const SENT_LABEL = {
  email:    'Total Emails Sent',
  sms:      'Total SMS Sent',
  whatsapp: 'Total WhatsApp Sent',
  push:     'Total Push Sent',
};

function Meta({ label, value }) {
  return (
    <div>
      <div className="text-text-secondary text-[12px]">{label}</div>
      <div className="text-text font-medium">{value}</div>
    </div>
  );
}

function PerfCard({ channel, data, active }) {
  const [range, setRange] = useState('Past 7 Days');
  const [open, setOpen] = useState(false);
  const sent = data?.sent ?? 0;
  const successRate = data?.successRate ?? 0;

  return (
    <div className="bg-surface rounded-lg p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-[15px] font-semibold text-text">{LABEL[channel.id]} Performance</div>
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border-soft rounded text-[12px] text-text cursor-pointer min-w-[130px] justify-between"
          >
            {range} <ChevronDown size={12} />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-1 bg-surface border border-border rounded-lg shadow-lg z-10 w-[160px] overflow-hidden">
              {RANGE_OPTIONS.map((o) => (
                <button
                  key={o}
                  onClick={() => { setRange(o); setOpen(false); }}
                  className={`w-full text-left px-3 py-2 text-[13px] hover:bg-surface-soft cursor-pointer ${o === range ? 'text-primary font-medium' : 'text-text'}`}
                >
                  {o}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {active ? (
        <>
          <div className="flex justify-center py-2">
            <SolidPie successRate={sent > 0 ? successRate : 50} size={200} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1 border border-border-soft rounded-lg p-3">
              <div className="text-[12px] text-text-secondary">{SENT_LABEL[channel.id]}</div>
              <div className="text-[20px] font-semibold text-text">{sent.toLocaleString()}</div>
              <div className="text-[12px] text-text-muted">{sent.toLocaleString()}</div>
            </div>
            <div className="flex-1 border border-border-soft rounded-lg p-3">
              <div className="text-[12px] text-text-secondary">Success Rate</div>
              <div className="text-[20px] font-semibold text-success">{successRate.toFixed(1)}%</div>
            </div>
          </div>
          <div className="flex items-center gap-4 text-[12px] text-text-muted">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#7DC97D] inline-block" /> Sent Successfully</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#7B93CA] inline-block" /> Failed to Send</span>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-[180px] text-[13px] text-text-secondary italic">
          Channel not active for this template
        </div>
      )}
    </div>
  );
}

function SolidPie({ successRate = 50, size = 200 }) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 2;
  const pct = Math.min(Math.max(successRate, 0.5), 99.5);
  const toXY = (deg) => {
    const rad = (deg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  };
  const angle = (pct / 100) * 360;
  const [sx, sy] = toXY(0);
  const [ex, ey] = toXY(angle);
  const large = angle > 180 ? 1 : 0;
  const successPath = `M ${cx} ${cy} L ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey} Z`;
  const failPath = `M ${cx} ${cy} L ${ex} ${ey} A ${r} ${r} 0 ${1 - large} 1 ${sx} ${sy} Z`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={failPath} fill="#7B93CA" />
      <path d={successPath} fill="#7DC97D" />
    </svg>
  );
}

const CHANNEL_DESC = {
  email:    'Email communication on the execution of event',
  sms:      'SMS communication on the execution of event',
  whatsapp: 'WhatsApp communication on the execution of event',
  push:     'Push notification communication on the execution of event',
};

function PreviewRow({ channel, active, onPreview }) {
  return (
    <div className="border border-border-soft rounded-lg px-4 py-3 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-[14px] font-semibold text-text">{LABEL[channel.id]}</div>
        <div className="text-[12px] text-text-secondary mt-0.5">{CHANNEL_DESC[channel.id]}</div>
      </div>
      {active && (
        <button onClick={onPreview} className="text-primary text-[13px] font-medium hover:underline cursor-pointer shrink-0">
          Preview
        </button>
      )}
    </div>
  );
}

function ChannelPreview({ channel, data, templateName, onClose }) {
  return (
    <div className="fixed inset-0 z-50 bg-page flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 h-[60px] flex items-center justify-between shrink-0">
        <span className="text-[16px] font-semibold text-gray-800">Preview of {templateName}</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20} /></button>
      </div>
      {/* Phone centered on page */}
      <div className="flex-1 flex items-center justify-center py-8">
        <PhoneMockup channel={channel} data={data} />
      </div>
    </div>
  );
}

function PhoneMockup({ channel, data }) {
  return (
    <div style={{ width: 300 }}>
      <div className="rounded-[44px] border-[10px] border-[#2a2a2a] bg-[#2a2a2a] shadow-2xl overflow-hidden flex flex-col" style={{ minHeight: 600 }}>
        {/* Notch bar */}
        <div className="relative shrink-0" style={{ background: '#fff' }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#2a2a2a] rounded-b-3xl z-10" />
          <div className="px-5 pt-6 pb-1 flex items-center justify-between text-[10px] text-[#111] font-semibold">
            <span>9:41</span>
            <div className="flex items-center gap-1 text-[9px]">
              <svg width="14" height="10" viewBox="0 0 14 10"><rect x="0" y="3" width="2" height="7" rx="0.5" fill="#111"/><rect x="3" y="2" width="2" height="8" rx="0.5" fill="#111"/><rect x="6" y="1" width="2" height="9" rx="0.5" fill="#111"/><rect x="9" y="0" width="2" height="10" rx="0.5" fill="#111"/></svg>
              <svg width="12" height="10" viewBox="0 0 12 10"><path d="M6 2C8.2 2 10.2 2.9 11.6 4.4L13 3C11.2 1.1 8.7 0 6 0S0.8 1.1-1 3l1.4 1.4C1.8 2.9 3.8 2 6 2z" fill="#111"/><path d="M6 5c1.1 0 2.1.5 2.8 1.2L10.2 4.8C9.1 3.7 7.6 3 6 3S2.9 3.7 1.8 4.8L3.2 6.2C3.9 5.5 4.9 5 6 5z" fill="#111"/><circle cx="6" cy="8.5" r="1.5" fill="#111"/></svg>
              <svg width="20" height="10" viewBox="0 0 20 10"><rect x="0" y="1" width="17" height="8" rx="2" stroke="#111" strokeWidth="1" fill="none"/><rect x="1" y="2" width="13" height="6" rx="1" fill="#111"/><path d="M18 3.5v3a1.5 1.5 0 000-3z" fill="#111"/></svg>
            </div>
          </div>
        </div>

        {/* Screen content */}
        {channel === 'push' && (
          <div className="flex-1 px-3 pt-2 pb-4" style={{ background: '#f5f5f7' }}>
            <PushPreview title={data?.title} body={data?.body} image={data?.image} />
          </div>
        )}
        {channel === 'sms' && (
          <div className="flex-1 flex flex-col" style={{ background: '#fff' }}>
            {/* Sender header */}
            <div className="flex flex-col items-center pt-4 pb-2">
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center mb-1">
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="8" r="4" fill="#999"/><path d="M3 19c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke="#999" strokeWidth="1.5" fill="none"/></svg>
              </div>
              <div className="text-[11px] text-gray-500 font-medium">Lupin Loyalty <span className="text-gray-400">›</span></div>
            </div>
            {/* Message bubble */}
            <div className="flex-1 px-3 pt-2">
              <div className="bg-gray-200 rounded-2xl rounded-tl-sm px-3 py-2 max-w-[85%] text-[13px] text-gray-800 leading-snug">
                {data?.body || 'Add body text to preview your SMS communication'}
              </div>
            </div>
            {/* iMessage bar */}
            <div className="border-t border-gray-200 px-2 py-2 flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="#888" strokeWidth="1.2"/><path d="M4.5 8.5C5 9.3 5.9 9.8 7 9.8s2-.5 2.5-1.3" stroke="#888" strokeWidth="1" fill="none" strokeLinecap="round"/><circle cx="5" cy="6" r="0.8" fill="#888"/><circle cx="9" cy="6" r="0.8" fill="#888"/></svg>
              </div>
              <div className="flex-1 border border-gray-300 rounded-full px-3 py-1 text-[11px] text-gray-400">iMessage</div>
              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="#888" strokeWidth="1.2"/><path d="M4 6h4M6 4v4" stroke="#888" strokeWidth="1" strokeLinecap="round"/></svg>
              </div>
            </div>
          </div>
        )}
        {(channel === 'email' || channel === 'whatsapp') && (
          <div className="flex-1 flex items-center justify-center px-4 py-6" style={{ background: channel === 'whatsapp' ? '#e5ddd5' : '#fff' }}>
            <div className={`rounded-xl p-4 text-[13px] leading-relaxed w-full ${channel === 'whatsapp' ? 'bg-[#dcf8c6] text-gray-800' : 'bg-gray-50 border border-gray-200 text-gray-700'}`}>
              {channel === 'email'
                ? (data?.body || 'Email body will appear here.')
                : (data?.body || 'WhatsApp message will appear here.')}
            </div>
          </div>
        )}

        {/* Home bar */}
        <div className="shrink-0 flex items-center justify-center py-2" style={{ background: channel === 'push' ? '#f5f5f7' : '#fff' }}>
          <div className="w-20 h-1 rounded-full bg-gray-400/40" />
        </div>
      </div>
    </div>
  );
}

function RangeSelect() {
  return (
    <button className="flex items-center gap-1.5 px-2.5 py-1 border border-border-soft rounded text-[12px] text-text cursor-pointer">
      Past 7 Days <ChevronDown size={12} />
    </button>
  );
}
