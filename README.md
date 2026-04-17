# Claim Alert Rules — Prototype

React prototype for the **Loyalife Partners & Promotions** alert & auto-approval rule system. Built for the GF-13430 tech handover.

## What's in this repo

- **`alert-rules-app/`** — Vite + React + Tailwind app with the full flow.
- **`active-context.md`** — Source-of-truth PM document: decisions, open questions, data model, next actions, field catalogue.

## Features covered

### Claims workflow
- **Claims Management** — Pending Actions / All Status / Flagged tabs over a mock invoice dataset.
- **Invoice detail** — two-column layout with timeline + dynamic alert banner.
- **Approval Workflow** — one-by-one review overlay.

### Alert rules (manual review triggers)
- **List / Create / Edit / View** pages for alert rules.
- 3-step create flow: Set Conditions → Alert Details → Review & Save.
- Live preview with donut chart + matched invoice list that updates as you edit.
- Toggle on/off; dynamic evaluation against existing invoices.

### Auto-approval rules
- **List / Create / Edit / View** pages with drag-to-reorder priority.
- **Minimum Confidence Score** gate as a dedicated input (≥ N%).
- **THEN** block (read-only) stating the fixed outcome: *Invoice claim will be auto-approved instantly.*
- Live preview of which pending claims the rule would approve.

### Rule engine (shared condition builder)
- IF groups with nested AND / OR composition (OR-of-ANDs).
- Attribute dropdown categorised into **GLOBAL ATTRIBUTES** and **MEMBER ATTRIBUTES** (`<optgroup>`), mirroring the Loyalife platform.
- 9 member attributes available: Relation Reference, Full Name, Email, Phone, Address, Gender, Date of Birth, Status, Preferred Language.
- Tagged Stockist as a per-retailer attribute under Member Attributes (approval rules only).
- Operators per field type: numeric `=/!=/>/>=/</<=`, string `Equals/Contains/Doesn't contain/Is empty/Is not empty`, boolean `Yes/No`, tagged `Matches for the Retailer / Does Not Match`.

### Alert framework concept (Default vs Configurable)
- **Default alerts** — preconfigured backend (missing partner name, missing invoice number, duplicate invoice number). Always on, not editable.
- **Configurable alerts** — built via the rule engine. Thresholds and specific matches.
- See `active-context.md` for the full rationale.

### Other surfaces
- Claims Settings hub with Alerts / Auto-Approval / General tabs.
- RBAC mock page showing permission matrix (View / Edit / Create) for alerts and auto-approval.
- PM Notes + Dev Notes toggles that reveal open product questions and engineering contracts inline.

## Running locally

```bash
cd alert-rules-app
npm install
npm run dev
```

## Tech

Vite 5, React 18, Tailwind v4, React Router, Lucide icons. No backend — all state lives in a React context store seeded with mock invoices and rules.
