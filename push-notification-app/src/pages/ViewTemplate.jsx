import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MoreHorizontal, Download, ChevronDown, Pencil, Trash2 } from 'lucide-react';
import { useStore, eventLabel, CHANNELS } from '../data/store';
import ChannelPill from '../components/shared/ChannelPill';
import Donut from '../components/shared/Donut';
import Modal from '../components/shared/Modal';

const PERF = {
  email:    { sent: 750, success: 91.2, fail: 8.8 },
  sms:      { sent: 750, success: 90.4, fail: 9.6 },
  whatsapp: { sent: 412, success: 94.9, fail: 5.1 },
  push:     { sent: 1240, success: 97.2, fail: 2.8 },
};

const SAMPLE_LOGS = [
  { ts: '04/04/2023 at 14:12:36', kind: 'push',     status: 'successful', user: 'Gopal Jhla' },
  { ts: '04/04/2023 at 14:12:36', kind: 'whatsapp', status: 'failed',     user: 'Gopal Jhla' },
  { ts: '04/04/2023 at 14:12:36', kind: 'whatsapp', status: 'successful', user: 'Raqib Hussain' },
  { ts: '04/04/2023 at 14:12:36', kind: 'whatsapp', status: 'successful', user: 'Faruh Shah' },
  { ts: '04/04/2023 at 14:12:36', kind: 'sms',      status: 'failed',     user: 'Kunal Shah' },
  { ts: '04/04/2023 at 14:12:36', kind: 'email',    status: 'failed',     user: 'Rahul Kumar' },
  { ts: '04/04/2023 at 14:12:36', kind: 'email',    status: 'successful', user: 'Ajeet Singh' },
  { ts: '04/04/2023 at 14:12:36', kind: 'sms',      status: 'successful', user: 'Sneha Sharma' },
  { ts: '04/04/2023 at 14:12:36', kind: 'sms',      status: 'successful', user: 'Anjali Dutt' },
  { ts: '04/04/2023 at 14:12:36', kind: 'push',     status: 'successful', user: 'Yash Mehta' },
];

export default function ViewTemplate() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { templates, deleteTemplate, showToast } = useStore();
  const t = templates.find((x) => x.id === id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  if (!t) {
    return (
      <div className="bg-surface rounded-lg p-8 text-center text-text-secondary">
        Template not found. <Link to="/communication" className="text-primary">Go back</Link>
      </div>
    );
  }

  const activeChannels = CHANNELS.filter((c) => t.channels[c.id]);

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
            data={PERF[c.id]}
            active={t.channels[c.id]}
          />
        ))}
      </div>

      {/* Communication Templates preview */}
      <div className="bg-surface rounded-lg">
        <div className="px-5 py-4 border-b border-border-soft">
          <div className="text-[16px] font-semibold text-text">Communication Templates</div>
          <div className="text-[12px] text-text-secondary">Preview the configured Email, SMS, WhatsApp and Push templates</div>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border-soft">
          {CHANNELS.map((c) => (
            <PreviewRow key={c.id} channel={c} data={t[c.id]} active={t.channels[c.id]} />
          ))}
        </div>
      </div>

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
        <div className="divide-y divide-border-soft">
          {SAMPLE_LOGS.map((l, idx) => (
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
          Showing 1-{SAMPLE_LOGS.length} of {SAMPLE_LOGS.length} rows
        </div>
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

function Meta({ label, value }) {
  return (
    <div>
      <div className="text-text-secondary text-[12px]">{label}</div>
      <div className="text-text font-medium">{value}</div>
    </div>
  );
}

function PerfCard({ channel, data, active }) {
  return (
    <div className="bg-surface rounded-lg p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="text-[15px] font-semibold text-text">{LABEL[channel.id]} Performance</div>
        <RangeSelect />
      </div>
      {active ? (
        <>
          <div className="flex justify-center">
            <Donut success={data.success} fail={data.fail} />
          </div>
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border-soft">
            <Stat label={`Total ${LABEL[channel.id]}s Sent`} value={data.sent.toLocaleString()} />
            <Stat label="Success Rate" value={`${data.success.toFixed(1)}%`} valueClass="text-success" />
          </div>
          <Legend />
        </>
      ) : (
        <div className="flex items-center justify-center h-[180px] text-[13px] text-text-secondary italic">
          Channel not active for this template
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, valueClass = 'text-text' }) {
  return (
    <div>
      <div className="text-[12px] text-text-secondary">{label}</div>
      <div className={`text-[18px] font-semibold ${valueClass}`}>{value}</div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-4 text-[12px] text-text-muted">
      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#7DC97D]" /> Sent Successfully</span>
      <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-[#ED6E6E]" /> Failed to Send</span>
    </div>
  );
}

function PreviewRow({ channel, data, active }) {
  return (
    <div className="px-5 py-4 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-[14px] font-semibold text-text">{LABEL[channel.id]}</div>
        <div className="text-[12px] text-text-secondary truncate">
          {active
            ? channel.id === 'push'
              ? data?.title || 'Push notification configured'
              : channel.id === 'email'
                ? data?.subject || 'Email configured'
                : 'Configured'
            : 'Channel disabled for this template'}
        </div>
      </div>
      <button className="text-primary text-[12px] font-medium hover:underline cursor-pointer shrink-0">Preview</button>
    </div>
  );
}

function RangeSelect() {
  return (
    <button className="flex items-center gap-1.5 px-2.5 py-1 border border-border-soft rounded text-[12px] text-text cursor-pointer">
      Last 3 months <ChevronDown size={12} />
    </button>
  );
}
