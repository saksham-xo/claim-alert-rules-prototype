import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Loader, ChevronDown } from 'lucide-react';
import PushPreview from './PushPreview';

const SCREENS = [
  { value: '/home',           label: 'Home' },
  { value: '/claims',         label: 'Claims' },
  { value: '/scan',           label: 'Scan' },
  { value: '/redeem',         label: 'Redeem' },
  { value: '/profile',        label: 'Profile' },
  { value: '/catalogue',      label: 'Catalogue' },
  { value: '/schemes',        label: 'Schemes' },
  { value: '/current-scheme', label: 'Current Scheme' },
  { value: '/points-history', label: 'Points History' },
  { value: '/video-gallery',  label: 'Video Gallery' },
  { value: '/tools',          label: 'My Tools' },
  { value: '/stores',         label: 'Stores Near Me' },
];

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
  const [screenOpen, setScreenOpen] = useState(false);

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

      {/* Body — split: left scrolls, right fixed */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left — scrollable form (60%) */}
        <div className="w-[60%] overflow-y-auto">
          <div className="px-8 py-6 flex flex-col gap-4">
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

              <Field label="Body" required hint={`${(draft.body ?? '').length}/120`}>
                <div className="text-[12px] text-text-muted mb-1">Concise message content for the notification.</div>
                <textarea
                  rows={5}
                  maxLength={120}
                  value={draft.body ?? ''}
                  onChange={(e) => set('body', e.target.value)}
                  placeholder="e.g. Hi {{full_name}}, your claim of ₹{{amount}} has been approved."
                  className="input resize-none"
                />
                <div className="text-[12px] text-text-muted mt-1">You can use "[[" to see all variable fields</div>
              </Field>

              <Field label="Redirect to Screen">
                <div className="text-[12px] text-text-muted mb-1">When tapped, the notification will open this screen in the app.</div>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setScreenOpen((o) => !o)}
                    className="input flex items-center justify-between text-left w-full"
                  >
                    <span className={draft.redirectScreen ? 'text-text' : 'text-text-secondary'}>
                      {draft.redirectScreen
                        ? SCREENS.find((s) => s.value === draft.redirectScreen)?.label
                        : 'Select a screen (optional)'}
                    </span>
                    <ChevronDown size={16} className="text-text-secondary" />
                  </button>
                  {screenOpen && (
                    <div className="absolute left-0 top-full mt-1 w-full bg-surface border border-border rounded-lg shadow-lg z-10 max-h-[260px] overflow-y-auto">
                      <div
                        onClick={() => { set('redirectScreen', ''); setScreenOpen(false); }}
                        className="px-3 py-2 text-[14px] hover:bg-surface-soft text-text-secondary cursor-pointer italic"
                      >
                        None — open app to default screen
                      </div>
                      {SCREENS.map((s) => (
                        <div
                          key={s.value}
                          onClick={() => { set('redirectScreen', s.value); setScreenOpen(false); }}
                          className="px-3 py-2 text-[14px] hover:bg-surface-soft text-text cursor-pointer"
                        >
                          {s.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-[12px] text-text-muted mt-1">Screens are configured in <span className="text-primary">Channel Partner Config → App Config</span>.</div>
              </Field>
            </div>

            {/* Test push card */}
            <TestPushCard title={draft.title} body={draft.body} />
          </div>
        </div>

        {/* Right — full-height preview panel (40%) */}
        <div className="w-[40%] shrink-0 flex flex-col border-l border-border-soft overflow-y-auto">
          <div className="flex items-center gap-1.5 px-8 pt-6 pb-4 shrink-0">
            <div className="text-[12px] font-semibold text-text-secondary uppercase tracking-wider">Preview</div>
            <PreviewInfoTip />
          </div>
          <div className="flex justify-center px-6 pb-8">
            <IPhoneLockScreen title={draft.title} body={draft.body} />
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
          disabled={!draft.title?.trim() || !draft.body?.trim()}
          className={`rounded px-5 py-2.5 text-[14px] font-medium ${
            draft.title?.trim() && draft.body?.trim()
              ? 'bg-primary hover:bg-primary-hover text-white cursor-pointer'
              : 'bg-primary-soft text-primary/40 cursor-not-allowed'
          }`}
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
        <div className="flex justify-end text-[12px]" style={{ color: '#868ccc' }}>{hint}</div>
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

function extractVars(title = '', body = '') {
  const matches = [...`${title} ${body}`.matchAll(/\{\{(\w+)\}\}/g)];
  return [...new Set(matches.map((m) => m[1]))];
}

function TestPushCard({ title, body }) {
  const [modalOpen, setModalOpen] = useState(false);
  const vars = extractVars(title, body);

  return (
    <>
      <div className="bg-surface rounded-lg p-5 flex items-center justify-between gap-6">
        <div>
          <div className="text-[15px] font-semibold text-text">Test Push Notification</div>
          <div className="text-[13px] text-text-secondary mt-0.5">Use this feature to confirm delivery and check how it appears on device.</div>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="border border-primary text-primary text-[13px] font-medium px-4 py-2 rounded cursor-pointer hover:bg-primary-soft shrink-0"
        >
          Send a Test Notification
        </button>
      </div>

      {modalOpen && <TestPushModal vars={vars} onClose={() => setModalOpen(false)} />}
    </>
  );
}

function TestPushModal({ vars = [], onClose }) {
  const [phone, setPhone] = useState('');
  const [looking, setLooking] = useState(false);
  const [memberName, setMemberName] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [sent, setSent] = useState(false);
  const [varValues, setVarValues] = useState({});
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
        if (found) {
          setVarValues((v) => ({ ...v, full_name: found }));
        }
      }, 800);
    }
  };

  const setVar = (key, val) => setVarValues((v) => ({ ...v, [key]: val }));

  const handleSend = () => {
    if (!memberName) return;
    setSent(true);
    setTimeout(() => { setSent(false); onClose(); }, 1500);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/40 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-7 pt-7 pb-5">
          <span className="text-[22px] font-bold" style={{ color: '#1a2456' }}>Send a Test Push Notification</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 cursor-pointer mt-1">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M14 4L4 14M4 4l10 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div className="border-t border-gray-100" />

        {/* Body */}
        <div className="px-7 py-6 flex flex-col gap-4">
          {/* Phone input */}
          <div className="flex flex-col gap-2">
            <label className="text-[14px] font-medium" style={{ color: '#1a2456' }}>Send a test notification to <span className="text-danger">*</span></label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="Enter the registered phone number"
              autoFocus
              style={{ border: '1px solid #c8cfe8', borderRadius: 8, padding: '13px 14px', fontSize: 14, color: '#1a2456', outline: 'none', width: '100%', background: '#fff' }}
              onFocus={e => e.target.style.borderColor = '#0070FF'}
              onBlur={e => e.target.style.borderColor = '#c8cfe8'}
            />
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
                <span style={{ color: '#1a2456' }} className="font-medium">{memberName}</span>
                <span className="text-[#1A7F37] text-[12px]">✓ Member found</span>
              </div>
            )}
            {notFound && !looking && (
              <div className="text-[12px] text-danger">No member found for this number</div>
            )}
          </div>

          {/* Payload */}
          {vars.length > 0 && (
            <div className="flex flex-col gap-4 pt-2">
              <div className="text-[20px] font-bold" style={{ color: '#1a2456' }}>Payload</div>
              {vars.map((v) => (
                <div key={v} className="flex flex-col gap-2">
                  <label className="text-[13px] font-medium" style={{ color: '#1a2456' }}>{v}<span className="text-danger">*</span></label>
                  <input
                    type="text"
                    value={varValues[v] ?? ''}
                    onChange={(e) => setVar(v, e.target.value)}
                    style={{ border: '1px solid #c8cfe8', borderRadius: 8, padding: '13px 14px', fontSize: 14, color: '#1a2456', outline: 'none', width: '100%', background: '#fff' }}
                    onFocus={e => e.target.style.borderColor = '#0070FF'}
                    onBlur={e => e.target.style.borderColor = '#c8cfe8'}
                  />
                </div>
              ))}
            </div>
          )}

          {sent && (
            <div className="text-[13px] text-[#1A7F37] font-medium">✓ Test notification sent to {memberName}</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-gray-100">
          <button onClick={onClose} className="border border-gray-300 text-gray-600 rounded-lg px-6 py-2.5 text-[14px] font-medium cursor-pointer hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={!memberName}
            className={`rounded-lg px-6 py-2.5 text-[14px] font-medium ${
              memberName ? 'bg-primary text-white hover:bg-primary-hover cursor-pointer' : 'bg-primary-soft text-primary/40 cursor-not-allowed'
            }`}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewInfoTip() {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {/* Loyalife-style ⓘ icon: blue outlined circle */}
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="cursor-default">
        <circle cx="8" cy="8" r="7" stroke="#0070FF" strokeWidth="1.5"/>
        <path d="M8 7v4.5" stroke="#0070FF" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="8" cy="4.8" r="0.85" fill="#0070FF"/>
      </svg>
      {show && (
        <div className="absolute top-[calc(100%+8px)] left-[-70px] z-[200] w-[270px]">
          {/* Caret pointing up — aligned to icon (~70px from box left) */}
          <div className="flex justify-start pl-[67px] mb-[-1px]">
            <svg width="14" height="7" viewBox="0 0 14 7" className="block">
              <path d="M0 7 L7 0 L14 7Z" fill="#111827"/>
            </svg>
          </div>
          {/* Tooltip body */}
          <div className="bg-[#111827] text-white rounded-lg shadow-xl px-4 py-3 text-[13px] leading-snug">
            The app icon will be the same as the Program Logo set in Program Settings.
          </div>
        </div>
      )}
    </div>
  );
}

function IPhoneLockScreen({ title, body }) {
  const displayTitle = title || 'Notification Title';
  const displayBody  = body  || 'Add body text to preview your notification message.';

  return (
    <div className="relative mx-auto select-none" style={{ width: 300 }}>
      {/* Side buttons */}
      <div className="absolute left-[-6px] top-[120px] w-[3px] h-[28px] bg-[#3a3a3a] rounded-l" />
      <div className="absolute left-[-6px] top-[160px] w-[3px] h-[44px] bg-[#3a3a3a] rounded-l" />
      <div className="absolute left-[-6px] top-[216px] w-[3px] h-[44px] bg-[#3a3a3a] rounded-l" />
      <div className="absolute right-[-6px] top-[160px] w-[3px] h-[60px] bg-[#3a3a3a] rounded-r" />

      {/* Phone shell */}
      <div className="rounded-[50px] border-[10px] border-[#1c1c1e] overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.7)]" style={{ minHeight: 620 }}>
        <div className="flex flex-col" style={{
          minHeight: 600,
          background: 'radial-gradient(ellipse at 50% 30%, #4a3f8a 0%, #2d1f6e 30%, #1a0f4f 60%, #0a0520 100%)',
        }}>

          {/* Date + Time */}
          <div className="text-center mt-10">
            <div className="text-white/80 text-[15px] font-light tracking-wide">Wednesday, May 7</div>
            <div className="text-white font-normal mt-1" style={{ fontSize: 78, lineHeight: 1, letterSpacing: -3 }}>9:41</div>
          </div>

          {/* Spacer pushes notification down */}
          <div className="flex-1" />

          {/* Notification card — bottom, above controls */}
          <div className="mx-3 mb-4">
            <div className="rounded-2xl px-2.5 py-2.5 flex gap-2 items-center" style={{ background: 'rgba(235,235,245,0.22)', backdropFilter: 'blur(20px)' }}>
              <div className="w-[38px] h-[38px] rounded-[9px] bg-[#0070FF] flex items-center justify-center shrink-0">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="white"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-white font-semibold leading-tight" style={{ fontSize: 11 }}>{displayTitle}</div>
                  <span className="text-white/50 shrink-0" style={{ fontSize: 9, marginTop: 1 }}>now</span>
                </div>
                <div className="text-white/80 mt-0.5 leading-snug line-clamp-3" style={{ fontSize: 10 }}>{displayBody}</div>
              </div>
            </div>
          </div>

          {/* Home indicator */}
          <div className="flex justify-center pb-4 pt-6">
            <div className="w-28 h-[5px] rounded-full bg-white/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
