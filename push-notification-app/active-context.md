# Push Notification Prototype — Active Context

**Last updated:** 2026-05-06

## Why this exists
Lupin's backend currently fires push notifications from the custom mobile
app for: claim approval/rejection, user approval/rejection, and new scheme
launches. The Loyalife admin Communication module exposes SMS, Email and
WhatsApp templates today but has **no Push configuration UI**. This
prototype mocks adding Push as a 4th channel alongside the others, and
also builds out the full Engage module (Segments, Campaigns, Notifications)
so we can walk Manoj/Ankit through the flow before sending it to engineering.

## Where it lives
`projects/partners-promotions/push-notification-app/` — sits next to
`auto-approval-app` and `alert-rules-app`.

## Stack
- Vite 8 + React 19 + Tailwind v4 + react-router-dom + lucide-react
- Cloned from `auto-approval-app` (same stack), re-skinned to Figma tokens:
  - Primary `#0070FF`, page bg `#EBF1F4`, Inter font, Comet/Base palette
- Run: `npm install && npm run dev` → http://localhost:5173/

## Routes

### Engage module (new)
| Route | Page |
|---|---|
| `/segments` | Segments list — search, behaviour pills, click to view |
| `/segments/:id` | View Segment — filter cards, member/campaign stats, SVG line chart |
| `/campaigns` | Campaigns list — status, period, qualified members, points |
| `/campaigns/:id` | View Campaign — status badge, stats, rules with colored attribute names |
| `/campaigns` (modal) | Create Campaign — 3-step wizard: Segment Selection (donut) → Rules + Capping + Period → Review & Save |
| `/notifications` | Notifications list — channel pills, campaign, schedule date, status |
| `/notifications` (modal) | Create Notification — 3-step wizard: Channel cards (Email + Push) → Campaign + date → Review |

### Communication module
| Route | Page |
|---|---|
| `/communication` | Manage Templates list |
| `/communication/new` | Create New Template — 4 channel cards; Push opens full-screen setup page |
| `/communication/:id` | View Template |
| `/communication/:id/edit` | Edit Template |

## Key design decisions

### Push setup — full-screen page (not modal)
When "Setup Push Notification" is clicked in Create/Edit Template, it opens
a `fixed inset-0 z-50` full-screen page (SetupPushPage.jsx) matching the
production SMS setup UI pattern. Other channels (email, sms, whatsapp) still
use the modal. Fields: Title (50ch), Body (120ch).

### Test Push Notification
Card with "Send a Test Notification" button → opens small modal. Input is
`mobile_number` (string, no country code separation per member attribute
schema). Phone number lookup simulates member resolution with 800ms delay.
Test numbers: `919876543210` → Gopal Jha, `919123456789` → Raqib Hussain, etc.

### Push success definition (per tech discussion)
**Success** = FCM token valid, notification accepted by FCM (regardless of
user notification preference at OS level).
**Failure** = FCM token handshake fails — app uninstalled (`UNREGISTERED`)
or user logged out/token expired (`INVALID_REGISTRATION`).

### Performance charts
Solid filled pie chart (green = sent successfully, blue `#7B93CA` = failed).
Each card has a "Past 7 Days" dropdown (Past 7 Days / 30 Days / 3 Months /
6 Months). Shows even when data is 0.

### Channel previews (View Template)
All 4 channels have a "Preview" button that opens a full-screen overlay
("Preview of {name}" header + ✕) with a full iPhone mockup:
- **Push** — dark lock screen with notification card
- **SMS** — iMessage UI (sender "Lupin Loyalty ›", gray bubble, compose bar)
- **Email / WhatsApp** — styled message bubble

### Communication Channels section
Renamed from "Communication Templates". Each channel is a bordered card:
name + description | Preview (link). Subtitle: "Preview the configured
Email, SMS and Whatsapp templates".

## Seeded data

### Templates (matches current Lupin production)
1. Credit Points Via Rule Engine — no channels active — 0/0
2. User Approval Approved — push — 312/99%
3. User Approval Rejected — push — 58/96.6%
4. Claim Approved — push — 1240/97.2%
5. Claim Rejected — push — 847/94.1%
6. New Scheme Launched — push — 2150/98.6%
7. LBMS Member OTP `[Sensitive Data]` — sms — 33/100%

### Segments (engageData.js)
4 segments: Members who joined in last 30 days (Dynamic), New joined (Static),
shivam goyal (Static), testing segment (Dynamic)

### Campaigns (engageData.js)
5 campaigns with rule arrays using `{ text, highlight }` segments for
colored attribute rendering (attributes shown in primary blue).

### Notifications (engageData.js)
2 seeded: email-only (Scheduled), email+sms+push (Scheduled)

## Repo
- **GitHub:** https://github.com/saksham-xo/partner-promotions-prototypes (public)
- Local clone: `~/Documents/loyalife/projects/partners-promotions/`
- Initial commit for push-notification-app: `69dd5df` on `main`

## Open questions
- Confirm production event slugs — prototype matches prod typos verbatim
  (e.g. `New Schemes Launched`) — flag to engineering.
- Push setup: scheduling (immediate vs. scheduled), priority (default/high),
  audience targeting — not in scope yet; would need follow-up.
- Campaign create wizard currently saves to local state only (no engageData
  mutation) — for demo purposes only.
