import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { X, Info, ChevronDown } from 'lucide-react';
import { useStore, EVENTS, CHANNELS } from '../data/store';
import ChannelCard from '../components/shared/ChannelCard';
import SetupChannelModal from '../components/shared/SetupChannelModal';
import SetupPushPage from '../components/shared/SetupPushPage';
import Modal from '../components/shared/Modal';

const blank = {
  name: '',
  type: 'Transactional',
  event: '',
  sensitive: false,
  enabled: true,
  channels: { email: false, sms: false, whatsapp: false, push: true },
  email: { subject: '', body: '' },
  sms: { body: '' },
  whatsapp: { body: '' },
  push: { title: '', body: '', deepLink: '', image: '' },
};

export default function CreateTemplate({ mode = 'create' }) {
  const navigate = useNavigate();
  const params = useParams();
  const { templates, upsertTemplate, showToast } = useStore();

  const seed = useMemo(() => {
    if (mode === 'edit') {
      const found = templates.find((t) => t.id === params.id);
      return found ? { ...blank, ...found } : blank;
    }
    return blank;
  }, [mode, params.id, templates]);

  const [form, setForm] = useState(seed);
  const [setupChannel, setSetupChannel] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [eventOpen, setEventOpen] = useState(false);

  useEffect(() => { setForm(seed); }, [seed]);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const updateChannelEnabled = (id, v) => setForm((f) => ({ ...f, channels: { ...f.channels, [id]: v } }));
  const updateChannelData = (id, data) => setForm((f) => ({ ...f, [id]: { ...f[id], ...data } }));

  const isConfigured = (id) => {
    const d = form[id] ?? {};
    if (id === 'push') return !!d.title || !!d.body;
    if (id === 'email') return !!d.subject || !!d.body;
    return !!d.body;
  };

  const eventRequired = form.type === 'Transactional';
  const canSubmit = form.name.trim() && (!eventRequired || form.event) && CHANNELS.some((c) => form.channels[c.id]);

  const handleSubmit = () => setConfirmOpen(true);

  const handleSendForApproval = () => {
    upsertTemplate({ ...form, id: form.id });
    setConfirmOpen(false);
    showToast(mode === 'edit' ? 'Template updated and sent for approval.' : 'Template created and sent for approval.');
    navigate('/communication');
  };

  return (
    <div className="fixed inset-0 z-40 bg-page flex flex-col">
      {/* Header */}
      <div className="bg-surface border-b border-border-soft h-[68px] flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-3">
          <Link to="/communication" className="text-text-secondary hover:text-text" aria-label="Close">
            <X size={20} />
          </Link>
          <span className="text-[20px] font-semibold text-text">{mode === 'edit' ? 'Edit Template' : 'Create New Template'}</span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto scroll-thin">
        <div className="p-6 flex flex-col gap-4">
          {/* Template Details */}
          <Section title="Template Details">
            <Field label="Template Name" required hint={`${form.name.length}/100`}>
              <input
                maxLength={100}
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Enter Template name"
                className="input"
              />
            </Field>

            <Field label="Template Type" required>
              <div className="flex items-center gap-6 pt-2">
                {['Promotional', 'Transactional'].map((t) => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={form.type === t}
                      onChange={() => { update('type', t); if (t === 'Promotional') update('event', ''); }}
                      className="accent-[var(--color-primary)] w-4 h-4"
                    />
                    <span className="text-[14px] text-text">{t}</span>
                  </label>
                ))}
              </div>
            </Field>

            {form.type === 'Transactional' && (
              <Field label="Event" required>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <button
                      type="button"
                      onClick={() => setEventOpen((o) => !o)}
                      className="input flex items-center justify-between text-left w-full"
                    >
                      <span className={form.event ? 'text-text' : 'text-text-secondary'}>
                        {form.event ? EVENTS.find((e) => e.value === form.event)?.label : 'Select Event'}
                      </span>
                      <ChevronDown size={16} className="text-text-secondary" />
                    </button>
                    {eventOpen && (
                      <div className="absolute left-0 top-full mt-1 w-full bg-surface border border-border rounded-lg shadow-lg z-10 max-h-[260px] overflow-y-auto">
                        <div
                          onClick={() => { setEventOpen(false); showToast('Add new event coming soon.'); }}
                          className="px-3 py-2 text-[14px] text-primary font-medium hover:bg-surface-soft cursor-pointer border-b border-border-soft"
                        >
                          + Add New Event
                        </div>
                        {EVENTS.map((e) => (
                          <div
                            key={e.value}
                            onClick={() => { update('event', e.value); setEventOpen(false); }}
                            className="px-3 py-2 text-[14px] hover:bg-surface-soft text-text cursor-pointer"
                          >
                            <div>{e.label}</div>
                            <div className="text-[11px] text-text-secondary">{e.group}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast('Manage Events coming soon.')}
                    className="border border-primary text-primary text-[13px] font-medium px-4 py-2 rounded cursor-pointer hover:bg-primary-soft shrink-0"
                  >
                    Manage Events
                  </button>
                </div>
              </Field>
            )}

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={form.sensitive}
                onChange={(e) => update('sensitive', e.target.checked)}
                className="accent-[var(--color-primary)] w-4 h-4"
              />
              <span className="text-[13px] text-text">Sensitive Data</span>
              <Info size={11} className="text-text-secondary" />
            </label>
          </Section>

          {/* Channels */}
          <Section title="Setup Communication Channels">
            <div className="grid grid-cols-2 gap-4">
              {CHANNELS.map((c) => (
                <ChannelCard
                  key={c.id}
                  id={c.id}
                  label={c.label}
                  enabled={form.channels[c.id]}
                  configured={isConfigured(c.id)}
                  onToggle={(v) => updateChannelEnabled(c.id, v)}
                  onSetup={() => setSetupChannel(c.id)}
                />
              ))}
            </div>
          </Section>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-surface border-t border-border-soft px-8 py-4 flex justify-end gap-3 shrink-0">
        <Link to="/communication" className="border border-primary text-primary rounded px-5 py-2.5 text-[14px] font-medium cursor-pointer">
          Cancel
        </Link>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`rounded px-5 py-2.5 text-[14px] font-medium ${
            canSubmit ? 'bg-primary hover:bg-primary-hover text-white cursor-pointer' : 'bg-primary-tint text-white cursor-not-allowed'
          }`}
        >
          Send for Approval
        </button>
      </div>

      <SetupChannelModal
        open={!!setupChannel && setupChannel !== 'push'}
        channel={setupChannel}
        value={setupChannel ? form[setupChannel] : null}
        onClose={() => setSetupChannel(null)}
        onSave={(data) => {
          updateChannelData(setupChannel, data);
          setSetupChannel(null);
          showToast(`${setupChannel.toUpperCase()} content saved.`);
        }}
      />

      {setupChannel === 'push' && (
        <SetupPushPage
          value={form.push}
          onClose={() => setSetupChannel(null)}
          onSave={(data) => {
            updateChannelData('push', data);
            setSetupChannel(null);
            showToast('Push notification content saved.');
          }}
        />
      )}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={mode === 'edit' ? 'Edit Template' : 'Add Template'}
        size="sm"
        footer={
          <>
            <button onClick={() => setConfirmOpen(false)} className="border border-primary text-primary rounded px-5 py-2.5 text-[14px] font-medium cursor-pointer">Cancel</button>
            <button
              onClick={handleSendForApproval}
              disabled={!reason.trim()}
              className={`rounded px-5 py-2.5 text-[14px] font-medium ${
                reason.trim() ? 'bg-primary hover:bg-primary-hover text-white cursor-pointer' : 'bg-primary-tint text-white cursor-not-allowed'
              }`}
            >
              Send for Approval
            </button>
          </>
        }
      >
        <div className="px-6 py-5 flex flex-col gap-3">
          <p className="text-[14px] text-text">
            {mode === 'edit'
              ? 'Editing this template would require an Approval-Workflow process. Please enter a brief reason below for this action.'
              : 'Creating a new template would require an Approval-Workflow process. Please enter a brief reason below for this action.'}
          </p>
          <Field label="Reason" required hint={`${reason.length}/100`}>
            <textarea
              rows={3}
              maxLength={100}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Template required as per loyalty program."
              className="input resize-none"
            />
          </Field>
        </div>
      </Modal>

      <style>{`
        .input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid var(--color-border);
          border-radius: 6px;
          font-size: 14px;
          color: var(--color-text);
          background: var(--color-surface);
          outline: none;
        }
        .input:focus { border-color: var(--color-primary); }
      `}</style>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-surface rounded-lg">
      <div className="px-4 py-4 border-b border-border-soft text-[16px] font-semibold text-text">{title}</div>
      <div className="px-4 py-5 flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[12px] tracking-[0.15px]">
        <span className="text-text-secondary">
          {label}{required && <span className="text-danger">*</span>}{' '}
          <Info size={11} className="inline-block text-text-secondary -mt-0.5" />
        </span>
        {hint && <span className="text-text-secondary">{hint}</span>}
      </div>
      {children}
    </label>
  );
}
