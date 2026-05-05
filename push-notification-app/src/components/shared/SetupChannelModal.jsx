import { useState, useEffect } from 'react';
import { Info, Bell, Mail, Smartphone, MessageCircle } from 'lucide-react';
import Modal from './Modal';
import PushPreview from './PushPreview';

const VARIABLES = [
  '{{member_name}}',
  '{{points}}',
  '{{amount}}',
  '{{claim_id}}',
  '{{scheme_name}}',
  '{{scheme_id}}',
  '{{end_date}}',
  '{{reason}}',
];

export default function SetupChannelModal({ open, channel, value, onClose, onSave }) {
  const [draft, setDraft] = useState(value || {});

  useEffect(() => {
    if (open) setDraft(value || {});
  }, [open, value]);

  if (!channel) return null;

  const handleField = (key, val) => setDraft((d) => ({ ...d, [key]: val }));

  const insertVar = (target, variable) => {
    setDraft((d) => ({ ...d, [target]: `${d[target] ?? ''}${variable}` }));
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Setup ${TITLES[channel]}`}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="border border-primary text-primary rounded px-5 py-2.5 text-[14px] font-medium cursor-pointer">Cancel</button>
          <button
            onClick={() => onSave(draft)}
            className="bg-primary hover:bg-primary-hover text-white rounded px-5 py-2.5 text-[14px] font-medium cursor-pointer"
          >
            Save
          </button>
        </>
      }
    >
      <div className="grid grid-cols-[1fr_360px] gap-6 px-6 py-5">
        <div className="flex flex-col gap-4">
          {channel === 'push' && (
            <>
              <Field label="Notification Title" required hint={`${(draft.title ?? '').length}/50`}>
                <input
                  type="text"
                  maxLength={50}
                  value={draft.title ?? ''}
                  onChange={(e) => handleField('title', e.target.value)}
                  placeholder="e.g. Claim Approved"
                  className="input"
                />
              </Field>
              <Field label="Notification Body" required hint={`${(draft.body ?? '').length}/178`}>
                <textarea
                  rows={4}
                  maxLength={178}
                  value={draft.body ?? ''}
                  onChange={(e) => handleField('body', e.target.value)}
                  placeholder="Hi {{member_name}}, your claim of ₹{{amount}} has been approved."
                  className="input resize-none"
                />
              </Field>
              <VariablePicker onPick={(v) => insertVar('body', v)} />
              <Field label="Deep Link (optional)" hint="In-app route to open when tapped">
                <input
                  type="text"
                  value={draft.deepLink ?? ''}
                  onChange={(e) => handleField('deepLink', e.target.value)}
                  placeholder="/claims/{{claim_id}}"
                  className="input"
                />
              </Field>
              <Field label="Image URL (optional)" hint="Banner shown with the notification on supported devices">
                <input
                  type="text"
                  value={draft.image ?? ''}
                  onChange={(e) => handleField('image', e.target.value)}
                  placeholder="https://…"
                  className="input"
                />
              </Field>
            </>
          )}

          {channel === 'email' && (
            <>
              <Field label="Subject" required>
                <input
                  type="text"
                  value={draft.subject ?? ''}
                  onChange={(e) => handleField('subject', e.target.value)}
                  placeholder="e.g. Your claim has been approved"
                  className="input"
                />
              </Field>
              <Field label="Email Body" required hint="HTML supported">
                <textarea
                  rows={10}
                  value={draft.body ?? ''}
                  onChange={(e) => handleField('body', e.target.value)}
                  placeholder="Dear {{member_name}}, …"
                  className="input resize-none font-mono text-[13px]"
                />
              </Field>
              <VariablePicker onPick={(v) => insertVar('body', v)} />
            </>
          )}

          {channel === 'sms' && (
            <>
              <Field label="SMS Body" required hint={`${(draft.body ?? '').length}/160`}>
                <textarea
                  rows={5}
                  maxLength={160}
                  value={draft.body ?? ''}
                  onChange={(e) => handleField('body', e.target.value)}
                  placeholder="Hi {{member_name}}, your claim of Rs.{{amount}} is approved."
                  className="input resize-none"
                />
              </Field>
              <VariablePicker onPick={(v) => insertVar('body', v)} />
            </>
          )}

          {channel === 'whatsapp' && (
            <>
              <Field label="WhatsApp Body" required hint={`${(draft.body ?? '').length}/1024 — DLT-approved template`}>
                <textarea
                  rows={6}
                  maxLength={1024}
                  value={draft.body ?? ''}
                  onChange={(e) => handleField('body', e.target.value)}
                  placeholder="Hi {{member_name}}, …"
                  className="input resize-none"
                />
              </Field>
              <VariablePicker onPick={(v) => insertVar('body', v)} />
            </>
          )}
        </div>

        {/* Preview pane */}
        <div className="flex flex-col gap-2">
          <div className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">Preview</div>
          {channel === 'push' && <PushPreview title={draft.title} body={draft.body} image={draft.image} />}
          {channel === 'email' && <EmailPreview subject={draft.subject} body={draft.body} />}
          {channel === 'sms' && <SmsPreview body={draft.body} />}
          {channel === 'whatsapp' && <WhatsAppPreview body={draft.body} />}
        </div>
      </div>

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
    </Modal>
  );
}

const TITLES = {
  email: 'Email',
  sms: 'SMS',
  whatsapp: 'WhatsApp',
  push: 'Push Notification',
};

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

function VariablePicker({ onPick }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[12px] text-text-secondary">Available variables</div>
      <div className="flex flex-wrap gap-2">
        {VARIABLES.map((v) => (
          <button
            type="button"
            key={v}
            onClick={() => onPick(v)}
            className="px-2 py-1 rounded bg-primary-soft text-primary text-[12px] font-medium hover:bg-primary-tint cursor-pointer"
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

function EmailPreview({ subject, body }) {
  return (
    <div className="bg-surface border border-border-soft rounded-lg overflow-hidden">
      <div className="px-3 py-2 bg-surface-soft border-b border-border-soft flex items-center gap-2">
        <Mail size={14} className="text-email" />
        <span className="text-[12px] font-medium text-text truncate">{subject || 'Subject preview'}</span>
      </div>
      <div className="p-3 text-[12px] text-text-muted whitespace-pre-wrap break-words min-h-[120px]">
        {body || 'Email body will appear here.'}
      </div>
    </div>
  );
}

function SmsPreview({ body }) {
  return (
    <div className="bg-[#f0f4f8] rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2 text-text-secondary">
        <Smartphone size={14} />
        <span className="text-[11px]">SMS · Lupin Loyalty</span>
      </div>
      <div className="bg-white rounded-2xl rounded-tl-sm p-3 max-w-[260px] text-[13px] text-text whitespace-pre-wrap break-words">
        {body || 'Your SMS body preview.'}
      </div>
    </div>
  );
}

function WhatsAppPreview({ body }) {
  return (
    <div className="bg-[#e5ddd5] rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2 text-text-secondary">
        <MessageCircle size={14} className="text-whatsapp" />
        <span className="text-[11px]">WhatsApp · Lupin</span>
      </div>
      <div className="bg-[#dcf8c6] rounded-lg p-3 max-w-[260px] text-[13px] text-text whitespace-pre-wrap break-words">
        {body || 'Your WhatsApp message preview.'}
      </div>
    </div>
  );
}
