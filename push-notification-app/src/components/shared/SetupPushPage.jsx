import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Loader } from 'lucide-react';
import PushPreview from './PushPreview';

const MEMBER_LOOKUP = {
  '919876543210': 'Gopal Jha',
  '919123456789': 'Raqib Hussain',
  '919000000001': 'Farah Shah',
  '919000000002': 'Kunal Shah',
  '919000000003': 'Rahul Kumar',
  '919000000004': 'Sneha Sharma',
  '919000000005': 'Anjali Dutt',
};

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

export default function SetupPushPage({ value, onClose, onSave }) {
  const [draft, setDraft] = useState(value || {});

  useEffect(() => { setDraft(value || {}); }, [value]);

  const set = (key, val) => setDraft((d) => ({ ...d, [key]: val }));
  const insertVar = (variable) => setDraft((d) => ({ ...d, body: `${d.body ?? ''}${variable}` }));

  return (
    <div className="fixed inset-0 z-50 bg-page flex flex-col">
      {/* Header */}
      <div className="bg-surface border-b border-border-soft h-[68px] flex items-center gap-3 px-8 shrink-0">
        <button
          onClick={onClose}
          className="text-text-secondary hover:text-text cursor-pointer flex items-center gap-1"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="text-[20px] font-semibold text-text">
          {(draft.title || draft.body) ? 'Update Push Notification' : 'Setup Push Notification'}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-8 py-6">
          <div className="grid grid-cols-[1fr_400px] gap-6 items-start">
            {/* Left — form */}
            <div className="flex flex-col gap-4">
              {/* Push Details card */}
              <div className="bg-surface rounded-lg p-6 flex flex-col gap-5">
                <div>
                  <div className="text-[16px] font-semibold text-text">Push Notification Details</div>
                  <div className="text-[13px] text-text-secondary mt-0.5">Configure the push notification sent to your members' devices</div>
                </div>
                <hr className="border-border-soft" />

                <Field label="Notification Title" required hint={`${(draft.title ?? '').length}/50`}>
                  <input
                    type="text"
                    maxLength={50}
                    value={draft.title ?? ''}
                    onChange={(e) => set('title', e.target.value)}
                    placeholder="e.g. Claim Approved"
                    className="input"
                  />
                </Field>

                <Field label="Body" hint={`${(draft.body ?? '').length}/120`}>
                  <div className="text-[12px] text-text-muted mb-1">Concise message content for the notification.</div>
                  <textarea
                    rows={5}
                    maxLength={120}
                    value={draft.body ?? ''}
                    onChange={(e) => set('body', e.target.value)}
                    placeholder="Hi {{full_name}}, your claim of ₹{{amount}} has been approved."
                    className="input resize-none"
                  />
                  <div className="text-[12px] text-text-muted mt-1">You can use "[[" to see all variable fields</div>
                </Field>


              </div>

              {/* Test push card */}
              <TestPushCard />
            </div>

            {/* Right — phone preview */}
            <div className="sticky top-6 flex flex-col gap-3">
              <div className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">Preview</div>
              <PhoneMockup>
                <PushPreview title={draft.title} body={draft.body} image={draft.image} />
              </PhoneMockup>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-surface border-t border-border-soft px-8 py-4 flex justify-end gap-3 shrink-0">
        <button
          onClick={onClose}
          className="border border-primary text-primary rounded px-5 py-2.5 text-[14px] font-medium cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(draft)}
          className="bg-primary hover:bg-primary-hover text-white rounded px-5 py-2.5 text-[14px] font-medium cursor-pointer"
        >
          Save
        </button>
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
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-text">
        {label}{required && <span className="text-danger">*</span>}
      </span>
      {children}
      {hint && (
        <div className="flex justify-end text-[12px] text-primary">{hint}</div>
      )}
    </div>
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

function TestPushCard() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div className="bg-surface rounded-lg p-5 flex items-center justify-between gap-6">
        <div>
          <div className="text-[15px] font-semibold text-text">Test Push Notification</div>
          <div className="text-[13px] text-text-secondary mt-0.5">Use this feature to confirm push delivery and check how it appears on device.</div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="border border-primary text-primary text-[13px] font-medium px-4 py-2 rounded cursor-pointer hover:bg-primary-soft shrink-0"
        >
          Send a Test Notification
        </button>
      </div>

      {modalOpen && <TestPushModal onClose={() => setModalOpen(false)} />}
    </>
  );
}

function TestPushModal({ onClose }) {
  const [phone, setPhone] = useState('');
  const [looking, setLooking] = useState(false);
  const [memberName, setMemberName] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [sent, setSent] = useState(false);
  const timerRef = useRef(null);

  const handlePhoneChange = (val) => {
    setPhone(val);
    setMemberName(null);
    setNotFound(false);
    clearTimeout(timerRef.current);
    if (val.trim().length >= 6) {
      setLooking(true);
      timerRef.current = setTimeout(() => {
        const found = MEMBER_LOOKUP[val.trim()] ?? null;
        setMemberName(found);
        setNotFound(!found);
        setLooking(false);
      }, 800);
    }
  };

  const handleSend = () => {
    if (!memberName) return;
    setSent(true);
    setTimeout(() => { setSent(false); onClose(); }, 1500);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/40 flex items-center justify-center">
      <div className="bg-surface rounded-xl shadow-xl w-[480px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border-soft">
          <span className="text-[17px] font-semibold text-text">Send a Test Push Notification</span>
          <button onClick={onClose} className="text-text-secondary hover:text-text cursor-pointer">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] text-text">Send a test notification to *</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="eg: 919876543210"
              className="input"
              autoFocus
            />
          </div>

          {looking && (
            <div className="flex items-center gap-1.5 text-[12px] text-text-secondary">
              <Loader size={12} className="animate-spin" /> Looking up member…
            </div>
          )}
          {memberName && !looking && (
            <div className="flex items-center gap-2 text-[13px]">
              <div className="w-6 h-6 rounded-full bg-primary-soft text-primary text-[11px] font-bold flex items-center justify-center shrink-0">
                {memberName[0]}
              </div>
              <span className="text-text font-medium">{memberName}</span>
              <span className="text-[#1A7F37] text-[12px]">✓ Member found</span>
            </div>
          )}
          {notFound && !looking && (
            <div className="text-[12px] text-danger">No member found for this number</div>
          )}
          {sent && (
            <div className="text-[13px] text-[#1A7F37] font-medium">✓ Test notification sent to {memberName}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-soft">
          <button onClick={onClose} className="border border-border text-text rounded-lg px-5 py-2 text-[14px] font-medium cursor-pointer hover:bg-surface-soft">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!memberName}
            className={`rounded-lg px-5 py-2 text-[14px] font-medium ${
              memberName ? 'bg-primary text-white hover:bg-primary-hover cursor-pointer' : 'bg-primary-soft text-primary/40 cursor-not-allowed'
            }`}
          >
            Send
          </button>
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
    </div>
  );
}

function PhoneMockup({ children }) {
  return (
    <div className="relative mx-auto" style={{ width: 280 }}>
      {/* Phone shell */}
      <div className="relative rounded-[36px] border-[8px] border-[#1a1a1a] bg-[#1a1a1a] shadow-2xl overflow-hidden" style={{ minHeight: 560 }}>
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#1a1a1a] rounded-b-2xl z-10" />
        {/* Status bar */}
        <div className="bg-[#f5f5f7] px-5 pt-8 pb-2 flex items-center justify-between text-[10px] text-[#1a1a1a] font-medium">
          <span>9:41</span>
          <div className="flex items-center gap-1">
            <span>●●●</span>
            <span>WiFi</span>
            <span>■</span>
          </div>
        </div>
        {/* Screen content */}
        <div className="bg-[#f5f5f7] px-3 py-3 min-h-[440px]">
          {children}
        </div>
        {/* Home indicator */}
        <div className="bg-[#f5f5f7] flex items-center justify-center py-2">
          <div className="w-24 h-1 rounded-full bg-[#1a1a1a]/30" />
        </div>
      </div>
    </div>
  );
}
