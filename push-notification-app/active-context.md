# Push Notification Prototype — Active Context

**Last updated:** 2026-05-05

## Why this exists
Lupin's backend currently fires push notifications from the custom mobile
app for: claim approval/rejection, user approval/rejection, and new scheme
launches. The Loyalife admin Communication module exposes SMS, Email and
WhatsApp templates today but has **no Push configuration UI**. This
prototype mocks adding Push as a 4th channel alongside the others so we
can walk Manoj/Ankit through the flow before sending it to engineering.

## Where it lives
`projects/partners-promotions/push-notification-app/` — sits next to
`auto-approval-app` and `alert-rules-app`.

## Stack
- Vite 8 + React 19 + Tailwind v4 + react-router-dom + lucide-react
- Cloned from `auto-approval-app` (same stack), re-skinned to Figma tokens:
  - Primary `#0070FF`, page bg `#EBF1F4`, Inter font, Comet/Base palette
- Run: `npm install && npm run dev` → http://localhost:5173/

## Source of truth — Figma
https://figma.com/proto/cno3Al4vgEe6in4eF8maJO/Engage--Communication
- Starting frame: `2798:3696` (Communication / Manage Templates)
- Add-Template flow frames: `2798:3891` → `2808:4424` → `2791:14051` →
  `2798:333` → `2808:3955` (dialog) → `2829:4970` (View Template)
- Frame `2792:38054` is the **language picker**, not row actions —
  no Figma frame found for the 3-dot row menu, so we built a generic one
- Reference screenshots saved in `figma-screenshots/01-list.png` …
  `07-row-options.png` and `_built-*.png`
- Figma copy says "In App Notification" — Saksham confirmed to relabel as
  "Push Notification" throughout

## What was built (5 routes)
| Route | Page | Notes |
|---|---|---|
| `/communication` | Manage Templates list | toggle, 6 cols (Name, Events, Active Channels, Total Sent, Success Rate, Actions), Sensitive Data inline badge, empty-channel cream pill, Rows-per-page pagination |
| `/communication/new` | Create New Template | Template Details + 4 channel cards (Email, SMS, WhatsApp, Push); Push toggled on by default per Figma |
| `/communication/:id` | View Template | header card, 4 performance donuts, channel preview row, sample logs, ⋯ menu |
| `/communication/:id/edit` | Edit Template | reuses Create form, prefilled |
| (modal) | Setup Channel | per-channel form + live preview pane |

### Push setup form
Title (50ch), Body (178ch), Deep Link, Image URL, clickable variable
chips (`{{member_name}}`, `{{points}}`, `{{amount}}`, `{{claim_id}}`,
`{{scheme_name}}`, `{{scheme_id}}`, `{{end_date}}`, `{{reason}}`).
Lock-screen preview alongside the form (dark bg, white card, bell icon).

### Approval-Workflow gate
Send-for-Approval triggers the "Add Template" reason dialog (max 100
chars) — mirrors Figma frame `2808:3955`. On submit, returns to list with
toast.

## Seeded data (matches current Lupin production)
After the user reset 2026-05-05, templates are:
1. Credit points via rule engine — Credit Points Via Rule Engine — on — — 0/0
2. User Approval Approved — User Approval Approved — off — — 0/0
3. User Approval Rejected — User Approval Rejected — off — — 0/0
4. Claim Approved — Claim Approved — on — — 0/0
5. Claim Rejected — Claim Rejected — on — — 0/0
6. New Scheme Launched — New Schemes Launched — on — — 0/0
7. LBMS Member OTP `[Sensitive Data]` — Lbms Member Otp — on — sms — 33/100%

Push only appears when the user creates/edits a template through the
prototype — that's the demo: before/after.

## Repo
- **GitHub:** https://github.com/saksham-xo/partner-promotions-prototypes (public)
- This is the umbrella repo (was named `claim-alert-rules-prototype`,
  renamed 2026-05-05 by Saksham) that holds all Loyalife Partners &
  Promotions prototypes — `alert-rules-app/`, `auto-approval-app/`, and
  now `push-notification-app/` as siblings.
- Local clone: `~/Documents/loyalife/projects/partners-promotions/`
- Initial commit for this app: `69dd5df` on `main`.
- Per-app `.gitignore` matches the existing app convention
  (`node_modules`, `dist`, etc.).

## Open questions for next session
- Is there a parent monorepo? If yes, where? (`Documents/loyalife/`
  itself is not git-init'd)
- Confirm the production event slugs — the screenshot showed
  `User Approval Approved` and `New Schemes Launched` (likely typos in
  prod). Prototype matches the typos verbatim — flag to engineering when
  they consume these.
- Push setup currently has only Title / Body / Deep Link / Image. Should
  it also support: scheduling (immediate vs. scheduled), priority
  (default vs. high), audience targeting (all / segment / program), or
  per-platform overrides (iOS APNS sound, Android channel)? Not in Figma
  — would need a follow-up if scope expands.
