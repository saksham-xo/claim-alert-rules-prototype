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

/**
 * Seeded to match the actual Lupin Communication > Manage Templates state
 * (snapshot 2026-05). All channels currently empty/inactive; only LBMS
 * Member OTP has SMS configured. Push is unsupported in production today —
 * this prototype shows what enabling it would look like.
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
    channels: { email: false, sms: false, whatsapp: false, push: false },
    totalSent: 0,
    successRate: 0,
    ...blankChannelData,
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
    channels: { email: false, sms: false, whatsapp: false, push: false },
    totalSent: 0,
    successRate: 0,
    ...blankChannelData,
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
    channels: { email: false, sms: false, whatsapp: false, push: false },
    totalSent: 0,
    successRate: 0,
    ...blankChannelData,
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
    channels: { email: false, sms: false, whatsapp: false, push: false },
    totalSent: 0,
    successRate: 0,
    ...blankChannelData,
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
    channels: { email: false, sms: false, whatsapp: false, push: false },
    totalSent: 0,
    successRate: 0,
    ...blankChannelData,
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
