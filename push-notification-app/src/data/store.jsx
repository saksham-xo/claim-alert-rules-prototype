import { createContext, useContext, useState, useCallback } from 'react';

/**
 * Mirrors the events Lupin's Communication module currently exposes.
 * Labels match production exactly (Title Case of the underlying slug,
 * including production typos like "Lbms Member Otp").
 */
export const EVENTS = [
  { value: 'credit_points_via_rule_engine', label: 'Credit Points Via Rule Engine', group: 'Points' },
  { value: 'user_approval_approved',        label: 'User Approval Approved',         group: 'User' },
  { value: 'user_approval_rejected',        label: 'User Approval Rejected',         group: 'User' },
  { value: 'claim_approved',                label: 'Claim Approved',                 group: 'Claims' },
  { value: 'claim_rejected',                label: 'Claim Rejected',                 group: 'Claims' },
  { value: 'new_schemes_launched',          label: 'New Schemes Launched',           group: 'Schemes' },
  { value: 'lbms_member_otp',               label: 'Lbms Member Otp',                group: 'OTP' },
];

export const CHANNELS = [
  { id: 'email',    label: 'Email',             color: 'email' },
  { id: 'sms',      label: 'SMS',               color: 'sms' },
  { id: 'whatsapp', label: 'WhatsApp',          color: 'whatsapp' },
  { id: 'push',     label: 'Push Notification', color: 'push' },
];

const blankChannelData = {
  email:    { subject: '', body: '' },
  sms:      { body: '' },
  whatsapp: { body: '' },
  push:     { title: '', body: '', deepLink: '', image: '' },
};

const blankPerf = {
  email:    { sent: 0, successRate: 0 },
  sms:      { sent: 0, successRate: 0 },
  whatsapp: { sent: 0, successRate: 0 },
  push:     { sent: 0, successRate: 0 },
};

/**
 * Seeded to match the actual Lupin Communication > Manage Templates state
 * (snapshot 2026-05). Push is unsupported in production today —
 * this prototype shows what enabling it would look like.
 * Claim Approved, Claim Rejected, and New Scheme Launched have push
 * pre-configured to demo the full view-template experience.
 */
const initialTemplates = [
  {
    id: 'TPL-CPR-001',
    name: 'Credit points via rule engine',
    type: 'Transactional',
    event: 'credit_points_via_rule_engine',
    sensitive: false,
    enabled: true,
    channels: { email: false, sms: false, whatsapp: false, push: false },
    totalSent: 0,
    successRate: 0,
    ...blankChannelData,
    perf: { ...blankPerf },
    createdOn: '12 Jul, 2022',
    lastEdited: '13 May, 2024',
    lastEditedBy: 'Purushotham',
  },
  {
    id: 'TPL-USA-002',
    name: 'User Approval Approved',
    type: 'Transactional',
    event: 'user_approval_approved',
    sensitive: false,
    enabled: false,
    channels: { email: false, sms: false, whatsapp: false, push: true },
    totalSent: 312,
    successRate: 99,
    ...blankChannelData,
    push: {
      title: 'Account Approved!',
      body: 'Hi {{member_name}}, your Lupin Loyalty account has been approved. Start earning points today!',
      deepLink: '/home',
      image: '',
    },
    perf: {
      ...blankPerf,
      push: { sent: 312, successRate: 99.0 },
    },
    createdOn: '12 Jul, 2022',
    lastEdited: '02 Apr, 2024',
    lastEditedBy: 'Purushotham',
  },
  {
    id: 'TPL-USR-003',
    name: 'User Approval Rejected',
    type: 'Transactional',
    event: 'user_approval_rejected',
    sensitive: false,
    enabled: false,
    channels: { email: false, sms: false, whatsapp: false, push: true },
    totalSent: 58,
    successRate: 96,
    ...blankChannelData,
    push: {
      title: 'Account Update',
      body: 'Hi {{member_name}}, your account application could not be approved at this time. Please contact support for assistance.',
      deepLink: '/support',
      image: '',
    },
    perf: {
      ...blankPerf,
      push: { sent: 58, successRate: 96.6 },
    },
    createdOn: '12 Jul, 2022',
    lastEdited: '02 Apr, 2024',
    lastEditedBy: 'Purushotham',
  },
  {
    id: 'TPL-CLA-004',
    name: 'Claim Approved',
    type: 'Transactional',
    event: 'claim_approved',
    sensitive: false,
    enabled: true,
    channels: { email: false, sms: false, whatsapp: false, push: true },
    totalSent: 1240,
    successRate: 97,
    ...blankChannelData,
    push: {
      title: 'Claim Approved!',
      body: 'Hi {{member_name}}, your claim of ₹{{amount}} has been approved. Points will be credited within 24 hours.',
      deepLink: '/claims/{{claim_id}}',
      image: '',
    },
    perf: {
      ...blankPerf,
      push: { sent: 1240, successRate: 97.2 },
    },
    createdOn: '04 Sep, 2022',
    lastEdited: '11 Mar, 2025',
    lastEditedBy: 'Purushotham',
  },
  {
    id: 'TPL-CLR-005',
    name: 'Claim Rejected',
    type: 'Transactional',
    event: 'claim_rejected',
    sensitive: false,
    enabled: true,
    channels: { email: false, sms: false, whatsapp: false, push: true },
    totalSent: 847,
    successRate: 94,
    ...blankChannelData,
    push: {
      title: 'Claim Update',
      body: 'Hi {{member_name}}, your claim of ₹{{amount}} could not be processed. Reason: {{reason}}. Visit the app for details.',
      deepLink: '/claims/{{claim_id}}',
      image: '',
    },
    perf: {
      ...blankPerf,
      push: { sent: 847, successRate: 94.1 },
    },
    createdOn: '04 Sep, 2022',
    lastEdited: '11 Mar, 2025',
    lastEditedBy: 'Purushotham',
  },
  {
    id: 'TPL-NSL-006',
    name: 'New Scheme Launched',
    type: 'Promotional',
    event: 'new_schemes_launched',
    sensitive: false,
    enabled: true,
    channels: { email: false, sms: false, whatsapp: false, push: true },
    totalSent: 2150,
    successRate: 99,
    ...blankChannelData,
    push: {
      title: 'New Scheme Available!',
      body: 'Hi {{member_name}}, {{scheme_name}} is now live until {{end_date}}. Start earning extra points today!',
      deepLink: '/schemes/{{scheme_id}}',
      image: '',
    },
    perf: {
      ...blankPerf,
      push: { sent: 2150, successRate: 98.6 },
    },
    createdOn: '20 Apr, 2024',
    lastEdited: '02 May, 2025',
    lastEditedBy: 'Purushotham',
  },
  {
    id: 'TPL-OTP-007',
    name: 'LBMS Member OTP',
    type: 'Transactional',
    event: 'lbms_member_otp',
    sensitive: true,
    enabled: true,
    channels: { email: false, sms: true, whatsapp: false, push: false },
    totalSent: 33,
    successRate: 100,
    ...blankChannelData,
    sms: { body: 'Hi {{member_name}}, your OTP is {{otp}}. Do not share with anyone.' },
    perf: {
      ...blankPerf,
      sms: { sent: 33, successRate: 100 },
    },
    createdOn: '15 Jan, 2023',
    lastEdited: '04 May, 2026',
    lastEditedBy: 'Purushotham',
  },
];

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, kind = 'success') => {
    setToast({ message, kind });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const toggleEnabled = useCallback((id) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)));
  }, []);

  const upsertTemplate = useCallback((tpl) => {
    setTemplates((prev) => {
      const exists = prev.some((t) => t.id === tpl.id);
      if (exists) return prev.map((t) => (t.id === tpl.id ? { ...t, ...tpl } : t));
      return [{
        totalSent: 0,
        successRate: 0,
        perf: { ...blankPerf },
        ...tpl,
        id: tpl.id || `TPL-${Math.floor(Math.random() * 90000 + 10000)}`,
      }, ...prev];
    });
  }, []);

  const deleteTemplate = useCallback((id) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <StoreContext.Provider
      value={{ templates, toggleEnabled, upsertTemplate, deleteTemplate, toast, showToast }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}

export function eventLabel(value) {
  return EVENTS.find((e) => e.value === value)?.label ?? value;
}
