# Push Notification — Communication Module Prototype

Click-through prototype for the Lupin **Push Notification** configuration UI, sitting alongside SMS / Email / WhatsApp inside the Loyalife Communication module.

Cloned from `auto-approval-app` and re-skinned to the Figma design (https://figma.com/proto/cno3Al4vgEe6in4eF8maJO).

## What this shows
- **Manage Templates** list with Push as a first-class active-channel pill
- **Create / Edit Template** with 4 channel cards (Email, SMS, WhatsApp, Push) — toggle + setup CTA
- **Setup Channel** modal with channel-specific form + live preview (lock-screen mock for Push, message bubble for SMS/WhatsApp, inbox card for Email)
- **Approval-Workflow** confirmation dialog before saving
- **View Template** with per-channel performance donuts and delivery logs

## Lupin events seeded
The starting templates cover the 5 events the Lupin backend currently triggers push for:
- Claim Approved
- Claim Rejected
- User Approved
- User Rejected
- New Scheme Launched

## Run
```bash
npm install
npm run dev
```
Open http://localhost:5173/
