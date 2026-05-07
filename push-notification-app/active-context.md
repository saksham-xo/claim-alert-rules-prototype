# Push Notification Prototype — Active Context

**Last updated:** 2026-05-08

## Why this exists
Loyalife backend currently fires push notifications from the custom mobile
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
- Run: `npm install && npm run dev`

## Routes

### Engage module (new)
| Route | Page |
|---|---|
| `/segments` | Segments list — search, behaviour pills, click to view |
| `/segments/:id` | View Segment — filter cards, member/campaign stats, SVG line chart |
| `/campaigns` | Campaigns list — status, period, qualified members, points |
| `/campaigns/:id` | View Campaign — status badge, stats, rules with colored attribute names |
| `/campaigns` (modal) | Create Campaign — 3-step wizard |
| `/notifications` | Notifications list — channel pills, campaign, schedule date, status |
| `/notifications` (modal) | Create Notification — 3-step wizard |

### Communication module
| Route | Page |
|---|---|
| `/communication` | Manage Templates list |
| `/communication/new` | Create New Template — 4 channel cards; Push opens full-screen setup page |
| `/communication/:id` | View Template |
| `/communication/:id/edit` | Edit Template |

## Key design decisions

### Push setup — full-screen page, 60/40 split
When "Setup Push Notification" is clicked in Create/Edit Template, it opens
a `fixed inset-0 z-50` full-screen page (SetupPushPage.jsx) matching the
production SMS setup UI pattern. Layout is **60% form (left, scrollable)
+ 40% preview panel (right, fixed)** with full-height border separator.
Other channels (email, sms, whatsapp) still use the modal.

**Fields:**
- **Notification Title** (required, 50ch) — shown with `*`
- **Body** (required, 120ch) — supports `{{variables}}`
- **Redirect to Screen** (optional dropdown) — sourced from screens defined
  in Channel Partner Config → App Config (e.g. `/home`, `/claims`, `/scan`,
  `/redeem`, `/profile`, `/catalogue`, `/schemes`, `/current-scheme`,
  `/points-history`, `/video-gallery`, `/tools`, `/stores`)

Save button is **disabled until both Title and Body are filled**.

### Create Template — Promotional vs Transactional
- **Promotional** type → Event field is hidden entirely; not required to save.
- **Transactional** type → Event dropdown shown, with "Manage Events"
  outline button on right and "+ Add New Event" affordance at top of dropdown.
- Section card no longer has `overflow-hidden` so dropdown extends past card edge.

### iPhone Lock Screen mockup (simplified)
Pure CSS, no images or libraries. Final version is intentionally minimal:
- Phone shell: 300px wide, dark `#1c1c1e` border, side buttons (volume, power)
- Background: radial gradient (purple → deep navy → near-black)
- Date "Wednesday, May 7" → large time "9:41" (78px, font-normal, matches iOS default weight)
- `flex-1` spacer pushes notification card to the bottom
- Notification card: frosted glass `rgba(235,235,245,0.22)` with `backdropFilter: blur(20px)`
  - Icon: 38×38, `rounded-[9px]` squircle, blue `#0070FF` bell
  - Title: 11px font-semibold (was 13px — reduced to match real iOS proportions where "Your Account Has Been Approved" fits one line)
  - Body: 10px font-normal, `line-clamp-3`
  - "now" timestamp: 9px, top-right
  - `items-center` alignment (icon vertically centered with content stack)
- Home indicator bar at bottom

**Removed for clarity:** status bar (signal/wifi/battery SVGs), dynamic island,
flashlight/camera quick-action buttons. They added visual noise without
communicating anything about the notification.

### Test Push Notification — modal redesigned to match production
Card with "Send a Test Notification" button → opens 520px modal. Title:
"Send a Test Push Notification" (22px bold, dark navy `#1a2456`).
Inputs use `#c8cfe8` border, blue `#0070FF` on focus, larger padding.

**Flow:**
1. Phone input labelled "Send a test notification to *", placeholder "Enter the registered phone number"
2. After 800ms debounce, member lookup runs (string match — no country code separation per member attribute schema)
3. If found, member name + green checkmark; auto-fills `full_name` variable
4. **Payload section** (heading "Payload", 20px bold) — variables from title/body parsed via regex `/\{\{(\w+)\}\}/g` and surfaced as labelled inputs (`{var}*` plain label, no monospace)
5. Send button enabled only when member resolved

Test numbers: `919876543210` → Gopal Jha, `919123456789` → Raqib Hussain, etc.

### Preview panel — Loyalife-style info tooltip
Top-left of preview panel shows "PREVIEW" + small ⓘ icon (blue outlined
circle with blue "i"). Hover shows dark tooltip (`#111827`) **opening
downward** with upward caret. Tooltip box is left-aligned to start from
"P" of PREVIEW (offset `left-[-70px]`, caret at `pl-[67px]`).

Copy: *"The app icon will be the same as the Program Logo set in Program Settings."*

The notification card on the lock screen has **no program name text** —
matches real iOS where the notification card is just `[App icon] | [bold title + timestamp] | [body]`.

### Push success definition (per tech discussion)
**Success** = FCM token valid, notification accepted by FCM (regardless of
user notification preference at OS level).
**Failure** = FCM token handshake fails — app uninstalled (`UNREGISTERED`)
or user logged out/token expired (`INVALID_REGISTRATION`).

### Performance charts
Solid filled pie chart (green `#7DC97D` = sent successfully, blue
`#7B93CA` = failed). Each card has a "Past 7 Days" dropdown (Past 7 Days /
30 Days / 3 Months / 6 Months). Shows even when data is 0.

### Channel previews (View Template)
All 4 channels have a "Preview" button that opens a full-screen overlay
("Preview of {name}" header + ✕) with a full iPhone mockup:
- **Push** — uses the same simplified lock screen as Setup page
- **SMS** — iMessage UI (sender header, gray bubble, compose bar)
- **Email / WhatsApp** — styled message bubble

### Communication Channels section
Renamed from "Communication Templates". Each channel is a bordered card:
name + description | Preview (link). Subtitle: "Preview the configured
Email, SMS and Whatsapp templates".

## Seeded data

### Templates (matches current Loyalife production)
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

## JIRA

**Ticket:** [GF-12956 — Custom In app notification](https://giftxoxo.atlassian.net/browse/GF-12956)
- Status: To Be Done
- Parent epic: GF-13218 (Lupin)
- Customers: Lupin, SBD (Stanley Black & Decker)
- Description rewritten on 2026-05-07 to reflect actual scope (Push channel
  in Communication module, including Title/Body/Redirect-to-Screen,
  test flow, FCM success/failure definition, App Config integration).
- **Discrepancy to fix:** description still says Body is "optional" in
  Expected Behaviour and Acceptance Criteria #4 — code now requires it.
- **Suggested title rename:** "Push notification channel in Communication module"
  (current "Custom In app notification" is from old draft and ambiguous
  with in-app banners).

## Repo
- **GitHub:** https://github.com/saksham-xo/partner-promotions-prototypes (public)
- Local clone: `~/Documents/loyalife/projects/partners-promotions/`
- Latest commit on `main`: `c1cb4c6` (README cleanup; setup UX refinement is `b854b1a`)

## Open questions
- Confirm production event slugs — prototype matches prod typos verbatim
  (e.g. `New Schemes Launched`) — flag to engineering.
- App Config ↔ Push integration: confirm API/data shape for fetching
  available screens dynamically; should the Redirect dropdown filter out
  screens not present in the active config?
- Variable resolution: where does `{{full_name}}`, `{{amount}}`, etc. come
  from at send time?
- Push setup: scheduling (immediate vs. scheduled), priority (default/high),
  audience targeting — not in Phase 1 scope; would need follow-up.
- Campaign create wizard currently saves to local state only (no engageData
  mutation) — for demo purposes only.
- Body required in code but JIRA description still says optional — sync up.
