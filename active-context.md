# Active Context: Configurable Alert Rules for Invoice Claims
> Single source of truth for session start. Updated EOD via 3-part protocol.
> **Last updated:** 2026-04-20 (session 5)

---

## Status
**Phase:** Ship-prep — scoping down to a 5-day release. Cuts driven by "if it doesn't earn its keep by ship day, it goes."
**Ship target:** 2026-04-25 (5 days from 2026-04-20)
**Ticket:** GF-13430
**React app:** `projects/partners-promotions/alert-rules-app/` (Vite + React + Tailwind v4)
**Alerts Extended (frozen):** `AlertsExtended.jsx` — snapshot of Alerts page before simplification, saved at `/alerts-extended` for future scope
**HTML prototype:** `prototypes/loyalife-alert-rules-prototype.html` (outdated, React app is primary)
**Baseline commit for session 5:** `10313963a8e2b715dae0a7eda2a6fbb93337e44a` — everything after this SHA is ship-prep.

---

## What Was Last Built

React app with the following pages:

### Alerts (`/alerts`)
- Manage Alerts card header + Create Alert button
- Active / Inactive tabs with toggle per row
- Columns: Toggle, Alert Name, Alert ID, Created By, Date Created, Actions (⋯ menu)
- ⋯ menu: View, Edit, Duplicate
- Toggling a rule off/on dynamically reflects on Claims page alerts
- Archive removed — deferred to extended (on/off sufficient for v1)
- PM Notes + Dev Notes toggles in top bar (global, amber/green)

### Create Alert (`/alerts/create`)
- Full page (not modal), sidebar visible
- 3-step progress bar: Set Conditions → Alert Details → Review & Save
- Step 1: Field/Operator/Value condition builder with inline AND/OR picker between rows
- Live preview panel: donut chart + matching invoices table (updates dynamically as conditions change)
- "View examples" link opens modal with all field/operator/value combinations
- Step 2: Alert Name + Description (name comes after conditions — you name it after you know what it does)
- Step 3: Review summary + donut preview + activate toggle
- Duplicate name validation (case-insensitive, inline error)

### View Alert (`/alerts/:id`)
- Breadcrumb + page header with Active/Inactive badge
- Conditions card (read-only)
- Flagged Invoices card: donut chart + matching invoices table (live from store, clickable rows → invoice detail)
- No Edit button (RBAC-controlled, accessible via ⋯ menu on list page only)

### Edit Alert (`/alerts/:id/edit`)
- Same condition builder UI as Create (field/operator/value, inline AND/OR, disabled cascade)
- Alert Details section (name, description, alert ID read-only)
- No "Then" section (behavior deferred to extended)
- Back arrow navigation to View page

### Claims Management (`/claims`)
- Tabs: Pending Actions (count) / All Status / Flagged (count)
- Columns: Partner Name, Invoice Number, Amount, Claim Submitted On, Alerts, Actions
- Alerts column: red badge "N alerts" or "—" for clean invoices
- Alerts are dynamically computed from active rules — toggling a rule off removes alerts, creating a new rule flags matching invoices immediately
- ⋯ menu with View only

### View Invoice (`/claims/:index`)
- Two-column layout: Invoice Details + Line Items + Partner Details (left), Timeline + Alerts (right)
- Alerts section: red banners with alert name + description, no action buttons (behavior deferred)
- Alerts dynamically filtered by active rules
- Green "No alerts" banner for clean invoices

### Other pages (unchanged from earlier)
- Alert Dashboard, Approval Workflow, Role Permissions, Alerts Extended

---

## Key Decisions

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-15 | Behavior (flag/block) deferred to extended | For now all alerts just surface in the Alerts box on View Claim. No differential behavior yet. |
| 2026-04-15 | No hard delete — Active/Inactive/Archived lifecycle | Claims reference rules by ID for audit trail. Hard delete breaks the link. |
| 2026-04-15 | Archive deferred to extended | With ~5 alert types, on/off is sufficient. Archive solves a scale problem (30+ rules) — not needed day one. |
| 2026-04-15 | Archiving an active rule routes through approval workflow | Approver sees impact (claims flagged) before approving. |
| 2026-04-15 | Alert ↔ Claim linkage one-directional for now | Claim → Rule (claim.alerts[].ruleId). Reverse lookup deferred. |
| 2026-04-15 | View/Edit alert are separate full pages, not modals | View = read-only. Edit = full-page condition builder. Edit not on View page (RBAC). |
| 2026-04-15 | Alerts are forward-looking only | Evaluate at claim submission time. Retroactive scan deferred to extended. |
| 2026-04-15 | Date anchor is "Claim Submitted On", not Invoice Date | Invoice Date is from partner, can be months old. |
| 2026-04-15 | Duplicate alert name validation (case-insensitive) | Inline error on name field, Next button disabled. |
| 2026-04-15 | RBAC: 3 permissions — View, Edit, Create Alert Rules | Follows P&P pattern. Create depends on Edit + View. |
| 2026-04-16 | Create flow starts with conditions, not name | You think about what the alert does first, then name it. |
| 2026-04-16 | No IF/THEN labels in condition builder | Without behavior (Then), IF is noise. Conditions speak for themselves. |
| 2026-04-16 | 6 default self-serve fields for alert conditions | Invoice Amount, Invoice Number, Line Items Total Mismatch, Invoice Age, Scan Quality, Scanned Amount vs Entered. |
| 2026-04-16 | Supplier/Distributor field requires per-client config | Authorised distributor list is different per client (Alkem ≠ Lupin). Semi-configurable, not self-serve. |
| 2026-04-16 | Custom alerts beyond default fields are CRs | Need new data pipelines (product catalog, price master, etc.). Same framework, new field definitions. |
| 2026-04-16 | Alerts dynamically evaluate against existing invoices | Toggling off removes alerts from Claims. Creating new rule flags matching invoices immediately. |
| 2026-04-16 | Alert name shows on flagged invoices | Name = what reviewer sees at a glance. Description = admin context when managing rules. |
| 2026-04-16 | Archive fully removed from v1 | On/off is sufficient. Archive tab, confirmation modal, and archive action all removed. Deferred to extended. |
| 2026-04-16 | Alert permissions independent from invoice approval | A risk/compliance user can configure alerts without having claims approval access. Permissions are standalone toggles. |
| 2026-04-16 | Alerts should live under Claims Settings, not as a separate sidebar module | Alerts is a setting/configuration for claims processing, not a standalone module. Claims page should have a Settings button that opens a Claims Settings page (Alerts, Auto-approve, etc.). Next iteration. |
| 2026-04-17 | Only OCR-extractable fields are self-serve in v1 condition builders | Fields requiring platform/client metadata (Stockist Name authorised list, GSTIN verification status, Product Catalog match, PO Reference, Amount Variance) depend on per-client data Loyalife doesn't have a generic model for. Each client program has its own retailer base, authorised distributor network, and catalog. v1 ships with only the OCR-derived subset (Invoice Amount, Invoice Number, line-items-match, confidence score). |
| 2026-04-17 | Invoice Age removed from field list until backend contract is clear | Ambiguous reference date — is it days since invoice date or days since claim submission? Remove until engineering confirms. |
| 2026-04-17 | Custom member attributes → rule-field mapping is future scope | Each client program registers its own attributes (`member.gstin_verified`, `member.authorised_stockists[]`, etc.). A mapping layer makes those available as rule conditions, scoped per program. Unlocks the fields deferred above. |
| 2026-04-17 | Tagged Stockist added as auto-approval field | Needs the client to tag approved stockist(s) on each retailer in program config (`retailer.tagged_stockists[]`). Lighter infra than full custom member attrs — only one attribute type, scoped to the retailer record. Operators: Matches for this Retailer / Does Not Match. No value input. |
| 2026-04-17 (s4) | **Alerts split into Default vs Configurable** | Default = dataset-wide invariants (missing partner name, missing invoice number, duplicate invoice number) that either need cross-row checks or universal coverage — preconfigured backend, not editable in settings, only surface in the claim's alert box. Configurable = rule-engine-built thresholds and specific matches (high-value, specific invoice numbers, etc.) visible and editable in Claims Settings. Rationale: rule engine has no cross-row `is_duplicate` operator, and manual per-invoice duplicate rules don't scale past 15k claims. Transparency mitigation for the hidden defaults: consider a read-only "Default alerts" section in Claims Settings (toggle on/off only, no edit). |
| 2026-04-17 (s4) | `Is Duplicate` operator **not** added to configurable rule engine | Follows from the split above — duplicate detection lives in Default alerts only. Added then reverted during the same session. The evaluator branch in `ViewAlert.jsx` for `is_duplicate` (pre-existing) stays as dead code for now; clean up when Default alerts infra lands. |
| 2026-04-17 (s4) | `Scan Quality (%)` renamed to `Confidence Score (%)` | Product lead preference — "Confidence Score" reads as AI/ML output (which it is), "Scan Quality" over-indexed on the photo itself. Internal key `ocrConfidence` unchanged. "Minimum Confidence Score" is the label on the auto-approval gate input (already consistent). |
| 2026-04-17 (s4) | Rule name for RULE-002 made invoice-specific | `Duplicate Invoice Number` → `Duplicate Invoice Number - INV-2026-05201`. The rule uses `invoiceNo equals <fixed number>` (not a true duplicate-detection op), so the name needs to reflect *which* invoice it's guarding against. Once Default duplicate detection lands, this rule becomes redundant and can be retired. |
| 2026-04-17 (s4) | `IF` pill removed from View pages; kept in Create/Edit | View is read-only and the OR/AND pills between groups/rows carry enough of the boolean story. IF in the builder (Create/Edit) matches the original Loyalife rule-engine visual language and helps authors think in IF/THEN terms. |
| 2026-04-17 (s4) | Attribute dropdown categorised: **GLOBAL ATTRIBUTES** + **MEMBER ATTRIBUTES** | Mirrors the Loyalife rule engine (see `lbmsqa.xoxotest.net/rule-engine` — Global Attributes + Member Attributes optgroups). Tagged Stockist sits at the end of Member Attributes (no separate Retailer category). Applied to both Alert and Approval builders. Globals stay claim-specific (Invoice Amount, Invoice Number, etc.) — platform globals like Product Code / Sub Product Code / Transaction Type were skipped for v1 since they don't fit invoice claims. |
| 2026-04-17 (s4) | Member attributes visibility tied to platform toggle | Each custom member attribute in the platform's `Members → Manage Attributes` page has an **Include in member search & filters** toggle. When ON, the attribute surfaces in the rule-engine/alert/approval dropdown. Prototype hard-codes the full 9 "Include=ON" attributes (Relation Reference, Full Name, Email, Phone, Address, Gender, Date of Birth, Status, Preferred Language). Engineering: wire the existing toggle to the fields actually rendered by the condition builder's `fieldDefs` endpoint — no new toggle needed. |
| 2026-04-17 (s4) | THEN block is read-only visual, not configurable (approval only) | Approval rule has exactly one outcome — auto-approve. No "set action" feature. THEN is shown purely to complete the IF/THEN mental model for authors and reviewers: "Invoice claim will be **auto-approved instantly**." Styled with neutral bg (same as IF container) + green THEN pill + green inline emphasis on the outcome phrase. Appears in Create, Edit, and View approve-rule pages. |
| 2026-04-20 (s5) | **Ship in 5 days** — every change this session is a scope cut | Moving from open-ended prototype to a minimum releasable cut. Default rule: lock it, hide it, or delete it unless it's load-bearing for first release. Baseline for the cuts is commit `10313963a8e2b715dae0a7eda2a6fbb93337e44a`. |
| 2026-04-20 (s5) | **Alerts frozen at submission time** — no retroactive re-evaluation | Threshold edits only affect *future* invoices. Old invoices keep the alerts they were stamped with at submission. Removed dynamic `evaluateGroups` path from both `Claims.jsx` and `InvoiceDetail.jsx`; source of truth is now `inv.alerts[]` filtered by active rule IDs. Prevents surprise retro-flags and makes the audit trail for threshold changes coherent. |
| 2026-04-20 (s5) | **Built-in alerts are non-editable, non-toggleable** | Three defaults (Unable to fetch details, Line item sum mismatch, Duplicate invoice number) ship baked-in. Claims Settings shows them as locked cards with opacity 0.7 toggles and no edit path. Rationale: these either rely on cross-row checks (duplicate) or dataset-wide invariants the rule engine can't express cleanly. Leave self-serve for custom thresholds. |
| 2026-04-20 (s5) | **Custom alert field + operator locked after creation. Only value editable.** | The alert's identity is defined by `field + operator`; the threshold is the knob that needs tuning. Unlocking the operator was tried in-session and reverted — drift risk ("High value invoice" flipped to `<=` no longer matches its name) outweighs the flexibility. To change field or operator, create a new alert. |
| 2026-04-20 (s5) | **Condition value edits route through an audit confirm modal** | Explicit Save / Cancel buttons appear under the row once the draft differs from stored. Save (or Enter) prompts "This action will be recorded in the Audit Trail. Click 'Accept' to save your changes." Accept persists + toast; Cancel wipes the draft. On-blur does *not* commit — users were missing that the input saved silently. Applies on both the Claims Settings inline row and the standalone Edit page. |
| 2026-04-20 (s5) | **Alert-row indicator on Claims list is for custom alerts only** | Built-ins never show the red ⚠ next to the amount. Reasoning: built-ins fire frequently (every OCR hiccup, every missing field) and would make the indicator meaningless as a "review this carefully" signal. They still surface inside the claim detail view. |
| 2026-04-20 (s5) | **Alert banner colours = source coding** | Amber = built-in (info), red = custom (warning), green = none. Clear at a glance whether the flag is a platform-level check or a client-configured threshold. |
| 2026-04-20 (s5) | **Alert banner shows name only; message dropped** | Settings page and invoice detail both show the same string (alert `name` / `ruleName`). Avoids the "settings says X, banner says Y" inconsistency we had with free-form `msg` fields. |
| 2026-04-20 (s5) | **Naming standard: sentence case, everywhere user-visible** | Alert names, template titles, placeholders, dashboard rows. Matches the built-ins (which were already sentence case) and modern UI convention (Material, Apple HIG). User-created custom alert names are still free text, but demo/sample data enforces the convention. |
| 2026-04-20 (s5) | **Confidence Score stripped from visible UI** | Column in Claims list, card + ring in invoice detail, and score row in auto-approval banner all removed. `ocrConfidence` stays on the invoice data model so rules can still reference it as a condition attribute — just not displayed. Reduces surface area for ship. |
| 2026-04-20 (s5) | **Flagged tab removed from Claims list** | The red ⚠ row indicator + "All Status" tab cover the same need. Fewer tabs = less decision load on the reviewer. |

---

## Lupin Data Inventory — Real Fields Available for Rules
> Source: `/Users/saksham/Documents/loyalife/projects/lupin/OneDrive_2_14-04-2026/3. Data/`

Shipping real client data reframes what's "self-serve" vs "custom attr". Fields below are no longer hypothetical — they exist today in Lupin's operational spreadsheets and can be ingested into Loyalife as reference tables per program.

### Source files and their columns

| File | What it is | Key columns |
|---|---|---|
| `Outlet Dump File 2.xlsx` | Retailer master (119k rows) | `Outlet Erp Id`, `Outlets Name`, `Outlets Type`, `Region`, `Beats`, `Beat ERP Id`, `RSM/ASM/BE` hierarchy |
| `Stockist Tagging-LLSL-FY27.xlsx` | Authorised stockist master + territory tagging (2,325 rows) | `Customer no`, `Customer name`, `SAP HQ Code`, `To be tagged to`, `AM/BE (Tagging)`, `Active/Inactive`, `SM/RSM/AM` hierarchy |
| `LUPIN_SAMRUDDHI_CATALOGUE_DETAILS.xlsx` | Product catalogue (279 SKUs) | `Material Code`, `Description`, `Brand`, `Molecule` |
| `Q1, Q2 & Q3 uploaded statements.xlsx` | Claim history (3,995 invoices) | `Invoice File`, `Invoice Status`, `Rejection Reason`, `Uploaded Date` |

### New fields that become concrete

**Territory / retailer attributes** (from Outlet Dump):
- Retailer Region — `retailer.region`
- Retailer Beat — `retailer.beat_erp_id`
- Outlet Type — `retailer.outlet_type`
- Retailer BE/AM/RSM — `retailer.be_user_id`, `retailer.am_user_id`, `retailer.rsm_user_id`

**Stockist / supplier checks** (from Stockist Tagging):
- Tagged Stockist (corrected semantics) — supplier on invoice is tagged to the same AM/BE as the claiming retailer. `stockist.tagged_am == retailer.am_user_id`.
- Stockist Active — `stockist.active`
- Known Lupin Stockist — supplier appears in the stockist master at all.

**Product-level** (from catalogue):
- Line Items In Catalogue — every line item matches a Lupin Material Code or Brand.
- Line Items Brand — filter rules by brand (e.g. auto-approve only ACEMIZ).
- Line Items Molecule — useful for substitution / generic flags.

**Retailer claim history** (from uploaded statements):
- Past Claim Count — how many claims has this retailer submitted.
- Past Rejection Rate — % of this retailer's claims that were rejected.
- First Submission Date — new retailer vs. returning.

### Still gated on external service calls
- GSTIN Verified — needs GST portal / verification provider integration.
- PO Reference validation — only useful if the invoice prints one.

### Implication for the condition builder
The "custom member attributes" infra story now has a concrete first slice: **ingest these four Lupin spreadsheets as program-scoped reference tables**, then expose their columns as rule fields. This is lighter than a fully generic custom-attrs system — it's "import these specific tables per client". Good for v1.5 before building the general-purpose attr mapper.

---

## OCR Confidence Score — How It's Computed

**Data model:** `ocrConfidence` (0–100) stored on the invoice at submission time. The score is computed **once, when the retailer uploads the photo** — OCR runs at ingestion, not per rule. Auto-approval rules just read this pre-existing value and gate on it.

**Proposed composition** (weights are a starting point — tune against real claim data):

| Signal | Weight | What it measures |
|---|---|---|
| **Recognition confidence** | ~50% | OCR engine's native per-word/per-field confidence (Textract, Google Document AI, Azure Form Recognizer). Aggregate as the **minimum across critical fields** (invoice no, amount, date) — one unreadable rupee sign can tank a claim. |
| **Image quality** | ~25% | Resolution/DPI, blur/focus score, lighting & contrast, skew angle, glare or reflection detection, crop completeness (all 4 edges visible). |
| **Extraction completeness** | ~15% | Were all expected key fields extracted? (invoice no, invoice date, total amount, GSTIN, line items). Was a table detected? How many line items pulled vs. what the layout detector expected? |
| **Post-OCR validation** | ~10% | Amount in valid numeric format, date parseable and not in future, line items sum ≈ invoice total, invoice number matches expected format for that distributor. |

**Questions to validate with engineering:**
- [ ] Which OCR engine are we on (or planning to use)? Confidence semantics differ — Textract returns 0–100 per block, Google Document AI per token, Azure Form Recognizer per field.
- [ ] Can we expose sub-scores on invoice detail? Reviewers may want to know *why* a scan was flagged low (bad photo vs. partial extraction vs. validation fail).
- [ ] How often does OCR re-run? If partner re-uploads, does the score refresh?
- [ ] Does a mismatched line-item total reduce confidence, or is that already caught by the existing alert rule? (Don't double-penalise.)

**PM open question — duplicate invoice re-uploads:**

If the same invoice (same invoice number, same retailer, same amount) gets uploaded twice with different photo quality — e.g. 1st attempt OCR = 80%, retailer re-uploads a cleaner shot of the same invoice and OCR = 90% — how should the auto-approval rule behave?

- **Option A — Evaluate each submission independently:** the 2nd upload is treated as a fresh claim, OCR runs again, 90% passes the gate → auto-approve. *Risk:* lets retailers game the system by re-uploading beautified versions of an invoice that previously failed the confidence gate.
- **Option B — Lock the score to the first successful OCR:** once an invoice number is in the system, further uploads don't raise the stored confidence. *Risk:* punishes legitimate re-uploads (genuinely blurry first shot, partner re-took and got a better photo in good faith).
- **Option C — Let the duplicate-invoice alert fire first, score second:** if the Duplicate Invoice Number alert is active, the 2nd submission is flagged and routed to manual review regardless of OCR score. Alerts take precedence over auto-approval.

**Decision needed:** do alerts block auto-approval? If yes, Option C is effectively free. If no, we need an explicit policy — likely lean Option A but combine with a cap ("cannot auto-approve the same invoice number twice in N days"). **Ask engineering whether OCR is idempotent per invoice or runs fresh on every upload.**

---

## Alert Field Sources

Fields grounded in what OCR extracts from physical invoices + platform data.

**Default self-serve fields (in configurator):**

| Field (UI label) | Internal key | Type | Operators |
|---|---|---|---|
| Invoice Amount | totalAmount | numeric | >=, >, <=, <, Equals |
| Invoice Number | invoiceNo | text | Is Duplicate, Equals |
| Line Items Total Mismatch | totalsMismatch | numeric | Do Not Match, Differ By More Than |
| Invoice Age (days) | invoiceAge | numeric | >= |
| Confidence Score (%) | ocrConfidence | numeric | <=, >= |
| Scanned Amount vs Entered | ocrAmount | — | Does Not Match |

**Semi-configurable (needs per-client setup):**
- Supplier / Distributor — authorised list is client-specific (Alkem's network ≠ Lupin's)
- Claim frequency — what's "too many" varies by client

**Custom (CR territory):**
- Product-level checks, price deviations, geo/product mapping — needs new data sources

**Context:** Alkem's duplicate invoice was first alert (custom backend). Lupin requested ₹50K threshold. Building configurator so any client can self-serve.

**Sample invoices reviewed:** NEW GARODIA → SHREE MEDICAL, FOCUS MEDISALES, SADGURU AGENCY → HEALTH MART CHEMIST.

---

## PM Notes (product questions for manager)

- [ ] "Created By" field shows role (e.g. "Admin") — should it show person's name + role, or just the name?
- [ ] Supplier/Distributor not in default fields — requires per-client authorised distributor list as config input. How do we manage this list? Separate config page?
- [ ] Extended: should there be a date range option on conditions to run alert against existing claims? (Currently forward-looking only)
- [ ] Archive tab exists in prototype but deferred — with ~5 alert types, on/off is sufficient. Revisit when rule count grows.

---

## Dev Notes (validations & engineering requirements)

### Create Alert — Condition Builder
- [ ] Field → Operator → Value is a cascading dependency:
  - Operator dropdown **disabled** until field is selected
  - Value input **disabled** until operator is selected
  - Value input **hidden** for no-value operators: Is Duplicate, Do Not Match, Does Not Match, Not In Authorised List
- [ ] Numeric fields use `type="number"` input: Invoice Amount, Line Items Total Mismatch, Invoice Age, Scan Quality
- [ ] Commas in numeric input must be stripped before evaluation (e.g. "4,592.53" → 4592.53)
- [ ] All conditions must have field + operator filled before Next is enabled
- [ ] AND/OR toggle appears inline between condition rows (only when 2+ conditions exist)

### Create Alert — Alert Details
- [ ] Duplicate alert name check — case-insensitive against all existing rules
- [ ] Inline error: "An alert with this name already exists" + red border on input
- [ ] Next button disabled when name is empty or duplicate
- [ ] Description is optional
- [ ] Hint under name field (future): "This name will appear on flagged invoices"

### Create Alert — Review & Save
- [ ] Preview panel shows donut chart + matching invoices (same as Step 1)
- [ ] "Activate alert immediately" toggle (defaults to on)
- [ ] On save: auto-generate ID (RULE-XXX), set `by: currentUser`, set `at: currentDate`

### Edit Alert
- [ ] Same field definitions and condition builder as Create (keep in sync)
- [ ] Same cascading disabled state for field → operator → value
- [ ] Duplicate name check should exclude the current rule's own name
- [ ] Alert ID shown as read-only

### Alerts List
- [ ] Active/Inactive tabs with toggle per row
- [ ] Toggling off moves rule to Inactive tab, toggling on moves to Active
- [ ] ⋯ menu: View, Edit, Duplicate (no archive/delete in v1)

### Claims Page — Dynamic Alert Evaluation
- [ ] Alerts computed from active rules at render time (not hardcoded on invoices)
- [ ] Hardcoded alerts on invoices filtered by active rule IDs
- [ ] New rules dynamically evaluate against all existing invoices
- [ ] Toggling a rule off removes its alerts from Claims badges and invoice detail
- [ ] Flagged tab count reflects only alerts from active rules

### View Invoice — Alerts Section
- [ ] Alerts filtered by active rules (same logic as Claims page)
- [ ] No action buttons (Acknowledge/Override deferred to extended)
- [ ] Alert banner shows: rule name (bold) + rule description
- [ ] Green "No alerts" banner when no active alerts match

### View Alert — Flagged Invoices
- [ ] Donut chart: matched vs total invoices
- [ ] Invoice table: Invoice #, Partner, Amount, Date — each row clickable → invoice detail
- [ ] Data is live from store — updates as new invoices are added or rules change

---

## Extended Scope

- [ ] Reverse lookup: View Alert → "Claims flagged by this rule" with historical data
- [ ] Alert Dashboard — aggregate stats per rule (claims caught, resolution rate)
- [ ] Behavior (flag/block) — differential actions when alert triggers
- [ ] Archive workflow — approval flow for archiving active rules
- [ ] Retroactive alert scan — "Run against existing claims" with date range filter + preview
- [ ] **TBD:** Action items for archived alerts should have option to hard delete
- [ ] Supplier/Distributor as semi-configurable field with per-client authorised list

---

## Stakeholder

- [ ] Walk through prototype with engineering team for feasibility check
- [ ] Confirm alert types with specific client teams (Lupin threshold, Alkem needs)

---

## Completed This Session (Session 3 — 2026-04-17)
- Routes: `/partner-promotions/invoice-management` (claims), `/partner-promotions/invoice-management/settings` (settings)
- Claims Settings with tabs: Alerts / Auto-Approval / General
- Layout: header full-width, sidebar+content centered at 1440px, scroll together, Lupin branding
- Auto-Approval rules moved to global store — create persists to list
- Drag-to-reorder with "Change Sequence" confirmation modal
- Operators standardised across all files: Equals, Not Equals, Greater Than, Less Than, Greater Than or Equal To, Less Than or Equal To, Contains, Does Not Contain, Is Empty, Is Not Empty
- Example approval rules: Low Value Claims, Verified GSTIN, Recent Small Orders — all using standard operators
- View Approval Rule reads from global store
- OCR confidence score clarified with product lead: it's OCR output, not user-configured. Available as "Confidence Score (%)" in condition builder.
- **Minimum Scan Quality as dedicated field:** Auto-approval rules now have `minScanQuality` as a separate always-visible input on Step 1 of creation, displayed as a prominent card on View Approval Rule, and shown as a column on the rules list. Removed `ocrConfidence` from the auto-approval condition builder field list. AR-001 migrated (80%), AR-002 set to 85%.
- **Auto-approved invoice display:** `ViewInvoice` now shows a green success banner with rule name + rule ID + scan quality % + rule threshold on claims that were auto-approved. Invoice data model extended with `ocrConfidence` (all invoices) and `autoApprovedByRuleId` (on approved claim 1190).
- **Auto-approval preview (donut + claims table):** Create Approval Rule flow now shows a live preview below the condition builder (Step 1) and in Step 3 review — donut uses success green, list shows each matching claim's scan quality. Preview evaluates `totalAmount`, `invoiceNo`, `invoiceAge` against invoice data and applies the `minScanQuality` gate; fields without mock data (`stockistName`, `gstinVerified`, `poReference`, `lineItemsInCatalog`, `amountVariance`) are treated as non-matching for now.
- **RBAC update:** Added View / Edit / Create Auto-Approval permissions to Partners & Promotions group in RolePermissions. Updated dev notes table to show auto-approval role mapping (Program Manager = View only, Program Admin = full access — same pattern as alerts).
- **Rules list column:** Auto-approval tab in Claims Settings now shows a "Min Scan Quality" column with a green `≥ N%` pill or `—` if unset.

## Completed This Session (Session 5 — 2026-04-20)

> **Framing:** every edit in this session is a scope reduction aimed at shipping in 5 days (target 2026-04-25). Nothing net-new was added. Baseline for the cuts is commit `10313963a8e2b715dae0a7eda2a6fbb93337e44a`. The rule is simple: if a control, field, page section, or behaviour isn't load-bearing for the first release, it's gone or locked.

### Claims Settings page (`AlertRules.jsx`) — split into Built-in vs Custom
- **Built-in Alerts section** added. Three defaults, always-on, non-editable, no list icon on claims table:
  - *Unable to fetch details* — "Fires when invoice details are missing or unreadable by OCR."
  - *Line item sum mismatch* — existing description kept.
  - *Duplicate invoice number* — existing description kept.
- **Custom Alerts section** shows each configured rule as a card: toggle, name, description, and the condition row *inline*. Field label and operator are locked (read-only pills); only the value is editable.
- **Inline edit → audit flow.** The value input is disabled until the rule is toggled on. Once editable, typing updates a local draft (keyed `ruleId:gi:ci`) and surfaces Save / Cancel buttons beneath the row. Save (or Enter) fires the confirm modal when draft ≠ stored: "This action will be recorded in the Audit Trail. Click 'Accept' to save your changes." Accept → `saveRule` + toast + clear draft. Cancel (or Escape) → draft wiped; if the stored value was still empty, the toggle also reverts back off so the rule never sits in an "on but empty" limbo. On-blur no longer auto-commits. Drafts are per-field, so multiple rows can be in-flight independently.
- **Toggle-first activation, with pending state.** The threshold input is disabled until the rule is toggled on, and toggling on an *empty* rule flips silently (no audit modal). The subsequent threshold Save covers activation + threshold in one audit entry. Toggling a rule that already has a stored threshold still routes through the audit modal immediately.
- View/Edit popover **removed** from each custom-alert row. The `/alerts/:id` and `/alerts/:id/edit` routes still exist but are no longer linked from the main surface.
- RULE-002 (`Duplicate Invoice Number - INV-2026-05201`) retired; superseded by the built-in duplicate detection.

### Edit Alert (`EditAlert.jsx`) — now reachable only by URL
- Removed the **Alert ID** field from the details card.
- Removed the **IF / AND / OR pill capsules** and the add-condition buttons from the conditions card.
- Operator unlocked → immediately re-locked within the same session. Final state: **field locked, operator locked, only value editable.** Consistency with the main-page inline editor.
- Audit-trail confirm modal fires on Save when the value changed (name/description-only edits save without the prompt).
- **Description is now required** (label gets `*`, empty description blocks save with a toast).

### View Alert (`ViewAlert.jsx`)
- Entire **Flagged Invoices section** (donut + matched-invoices table) removed.
- The **Shield header icon** removed — title, Active/Inactive pill, and description render flush-left.
- Dead code cleared: `evaluateCond`, `DonutChart`, `evaluateGroups` import, `invoices`/`devNotes` destructure.

### Claims list (`Claims.jsx`)
- **Flagged tab removed.** Only *Pending Actions* and *All Status* remain.
- **Confidence Score column removed** (header tooltip + cell + `Info` import).
- Red ⚠ indicator on the amount cell appears **only for custom alerts** (`invAlerts.some(a => !a.system)`). Built-in alerts never show a row indicator.
- Settings button → **icon-only** (label "Settings" dropped; `title` / `aria-label` preserved for accessibility; padding tightened to `p-2`).

### Invoice detail (`InvoiceDetail.jsx`)
- **ConfidenceScoreCard + ConfidenceRing deleted.** `AutoApprovalBanner` no longer renders the confidence score (only rule name + threshold).
- **Alerts frozen at submission.** Dynamic re-evaluation (`evaluateGroups` + `evaluateCond`) removed here and in `Claims.jsx`. `allAlerts` now derives purely from `inv.alerts[]` filtered by `a.system || activeRuleIds.has(a.ruleId)`. Threshold edits no longer retroactively flag old invoices — a change from 50k → 20k leaves a pre-existing 40k invoice untouched.
- **AlertBanner colour-coded** by `alert.system`: built-ins get amber (`bg-flag-bg` + `Info` icon), customs get red (`bg-block-bg` + `AlertTriangle` icon). "No alerts" banner stays green. Message (`alert.msg`) removed — only `ruleName` renders.
- **Line Items empty state** — when `lineItems.length === 0`, the table header stays visible and the body is replaced with a `FileX` icon + **No Data Found** + "No records could be fetched during OCR process". Illustrates the "Unable to fetch details" built-in scenario.

### Sample data rebuilt (`store.jsx`)
Eight invoices now map 1:1 to the alert examples each page needs to demonstrate:

| Claim | Scenario | Alert surface |
|---|---|---|
| 1257 — ₹78,500 | Custom alert (High value invoice) | Red ⚠ on list, red banner in detail |
| 1209 — ₹5,200 | Built-in: Line item sum mismatch | Amber banner only |
| 1195 — INV-…05201 | Built-in: Duplicate invoice number | Amber banner only |
| 1190 — auto-approved | — | Green "No alerts" + auto-approval banner |
| 1185 — ₹62,350 | Custom alert (High value invoice) | Red ⚠ on list, red banner in detail |
| 1180 — INV-…05201 | Built-in: Duplicate invoice number (dup of 1195) | Amber banner only |
| 1175 — empty line items | Built-in: Unable to fetch details | Amber banner + Line Items empty state |
| 1170 — clean | — | Green "No alerts" |

Old "Missing Invoice Number" / "Missing Retailer Name" system-level alerts gone. Partner + number pulsing-dot hints stay in `Claims.jsx` as UI affordances but no longer trigger on the sample set (all rows have values).

### Design system nits
- `--color-toggle-on: #3e94ff` added to `index.css` (`@theme`). All seven toggles migrated from `peer-checked:bg-primary` / `peer-checked:bg-success` → `peer-checked:bg-toggle-on`. Consistent toggle treatment regardless of semantic context.
- Disabled/default-on toggles at **opacity 0.7** (was 0.8).

### Naming — sentence case is now the standard
Everywhere user-visible, alert and template names switched from Title Case to sentence case so the Claims Settings copy matches the invoice-view banners:
- Rule names: *High value invoice*, *Duplicate invoice detection*, *Mismatched totals*, *Unauthorised distributor*, *OCR confidence low*, *Duplicate invoice number*.
- RuleBuilder template titles: *Amount threshold*, *Duplicate detection*, *Distributor verification*, *Total mismatch*, *OCR quality check*, *Custom rule*.
- Input placeholders + AlertDashboard sample rows updated in lockstep.
- Built-in alert names (already sentence case) untouched.

### Bugs squashed during the session
- Importing `FileOff` from `lucide-react@1.8.0` (icon doesn't exist in this version) crashed the whole router. Swapped for `FileX`.
- `Info` was removed from imports while still used by `AlertBanner` for built-in alerts — caused `/partner-promotions/invoice-management/6` (the empty-line-items invoice) to blank out. Re-added.

---

## Completed Previous Session (Session 4 — 2026-04-17, continued)

### Framework shift
- **Alerts split into Default vs Configurable** (see Key Decisions). Default alerts cover dataset-wide invariants (missing fields, duplicate invoice number) that either need cross-row checks or universal coverage. Configurable alerts use the rule engine for thresholds and specific matches. Mental model now clearer for the tech handover.

### Rule engine UI
- **Attribute dropdown categorised** using native `<optgroup>`: **GLOBAL ATTRIBUTES** + **MEMBER ATTRIBUTES**. Applied to CreateAlert, EditAlert, CreateApproveRule, EditApproveRule. `ViewAlert`/`ViewApproveRule` `fieldMeta` extended in lockstep.
- **`ConditionBuilder` extended** to accept either flat `[{v, l, ops}]` or grouped `[{group, fields: [...]}]` shape. Helper `flattenFieldDefs` + `renderFieldOptions` render `<optgroup>` blocks. Backward-compat for alert builders that haven't migrated.
- **Member Attributes expanded** from 5 → full 9 fields matching Loyalife platform (Relation Reference, Full Name, Email, Phone, Address, Gender, Date of Birth, Status, Preferred Language). `Tagged Stockist` moved under Member Attributes (end) for Approve Rule only.
- **`Scan Quality (%)` → `Confidence Score (%)`** across all 5 files where the label appeared. Internal key `ocrConfidence` unchanged.
- **`IF` pill removed** from `ViewAlert` and `ViewApproveRule` condition cards (read-only context). Retained in Create/Edit builders and in `ConditionBuilder`.

### Approve-rule THEN block
- Added static **THEN** block under the IF conditions in `CreateApproveRule`, `EditApproveRule`, and `ViewApproveRule`. Copy: "Invoice claim will be **auto-approved instantly**." Container uses neutral `bg-bg/40` (matches IF); only the THEN pill and outcome phrase are success-green.

### Claims table walkthrough annotations
- Added pulsing primary dots with hover tooltips on the two "Missing" rows in the Claims table:
  - Missing partner-name row → tooltip: **"Default alert example for the missing name claim"**
  - Missing invoice-number row → tooltip: **"Configurable alert example"**
- These are stakeholder-facing demo cues; only render when the respective field is falsy.

### Other
- **RULE-002 renamed** to `Duplicate Invoice Number - INV-2026-05201` (matches the rule's actual `equals` semantics; flagged for retirement once Default duplicate detection ships).
- **Experimental `PresenterNote` component** built and reverted in-session — Saksham opted to keep the prototype UI uncluttered. Pattern is available in git history if a future dry-run / walkthrough needs it.
- **`Is Duplicate` operator** added to rule-engine dropdown then removed in same session, following the Default-vs-Configurable decision.

## Next Actions (ordered) — ship-prep for 2026-04-25

1. **Update RBAC (`RolePermissions.jsx`) to match the new alert model.** Current role matrix still encodes the old "Create/Edit/View alerts" verbs, which assumed users author arbitrary rules with full operator/field freedom. Under the locked-field model, the useful permissions collapse to *View claims settings* and *Edit alert thresholds* (plus the existing auto-approval perms). Audit the permission list, drop Create-alert (no longer a supported action on the ship-cut UI), and reframe descriptions around threshold edits + audit logging. Double-check the "View Alerts" description still talks about flagged invoices even though the ViewAlert page has been stripped down.
2. **Tech handover walkthrough.** Post the session-5 summary to GF-13430 so engineering knows what to build: built-in alerts (amber, locked), custom alerts (inline threshold edit + audit modal), frozen-at-submission alert evaluation, sentence-case naming, removed surfaces (Confidence Score UI, Flagged tab, View-page stats, dynamic eval, Create-alert page).
3. **Stakeholder walkthrough.** Demo the ship cut end-to-end (Claims list → invoice detail → Claims Settings → threshold edit with audit modal). Capture any last blockers before freeze.
4. **Invoice Age — resolve backend contract.** Still unresolved from session 4. Needed for re-adding to the field list post-ship.

### Post-ship backlog (parked)
- Design the Default-alerts surface with richer metadata (session 4 item — partially addressed by built-in cards but full PM transparency view deferred).
- Ingest the 4 Lupin reference tables → program-scoped rule fields.
- Custom member attributes → rule-field mapping (full infra story).
- Revisit whether Create-alert flow gets reinstated (currently the only way to add a new custom rule is via the seed data / direct route).
- Retire dead code: `CreateAlert.jsx`, route entries for `/alerts/create`, `/alerts/:id`, `/alerts/:id/edit` once we confirm no URLs are bookmarked.
- Clean up the dead `is_duplicate` branch in `ViewAlert.jsx` evaluator (carry-over).

---

## Quick Technical Reference

**React app structure:**
```
alert-rules-app/src/
├── data/store.jsx            — Shared state (rules, invoices, alerts) + pmNotes/devNotes toggles
├── components/
│   ├── layout/Sidebar.jsx    — Sidebar with Alerts, Alerts Extended, Claims nav links
│   ├── layout/Topbar.jsx     — PM Notes + Dev Notes toggles + user info
│   ├── shared/               — PageHeader, ActionCard, BehaviorPill, StatusPill, Popover, Toast
│   ├── RuleBuilder.jsx       — Legacy modal builder (kept for AlertsExtended)
│   ├── ApprovalWorkflow.jsx  — Full-screen overlay
│   ├── ActionModal.jsx       — Approve/Reject confirmation
│   └── shared/InvoiceDetail.jsx — 2-col layout with dynamic alert filtering
├── pages/
│   ├── AlertRules.jsx        — Alert rules list (/alerts)
│   ├── CreateAlert.jsx       — 3-step create flow (/alerts/create)
│   ├── ViewAlert.jsx         — Alert detail with flagged invoices (/alerts/:id)
│   ├── EditAlert.jsx         — Edit alert conditions (/alerts/:id/edit)
│   ├── AlertsExtended.jsx    — Frozen snapshot for future scope (/alerts-extended)
│   ├── Claims.jsx            — Invoice list with dynamic alerts (/claims)
│   ├── ViewInvoice.jsx       — Invoice detail (/claims/:index)
│   ├── AlertDashboard.jsx    — Dashboard (/alert-dashboard)
│   └── RolePermissions.jsx   — RBAC mock (/role-permissions)
└── App.jsx                   — Router
```

**Routes:**
- `/alerts` — Alert rules list
- `/alerts/create` — Create new alert (3-step)
- `/alerts/:id` — View alert detail
- `/alerts/:id/edit` — Edit alert
- `/alerts-extended` — Frozen snapshot
- `/claims` — Invoice list
- `/claims/:index` — Invoice detail
- `/alert-dashboard` — Dashboard
- `/role-permissions` — RBAC mock

**Data model — Rule:**
```js
{ id, name, desc, behavior: 'flag', conds: [{f, op, val}], logic: 'AND'|'OR', acts: ['flag_invoice'], on: boolean, archived: boolean, by: string, at: string }
```

**Data model — Invoice alert (hardcoded):**
```js
{ ruleId, ruleName, msg }
```

**Data model — Invoice alert (dynamic, computed at render):**
```js
{ ruleId: rule.id, ruleName: rule.name, msg: rule.desc }
```

**Data model — Auto-approval rule:**
```js
{ id, name, desc, priority, on, logic: 'AND'|'OR', minScanQuality: string, conds: [{f, op, val}] }
```

**Data model — Invoice (additions for auto-approval):**
```js
{ ...existing, ocrConfidence: number /* 0-100 */, autoApprovedByRuleId?: string /* AR-XXX */ }
```

**Key Loyalife colors:** Primary #3F51B5, Text #303E67, Border #E3EBF6, BG #F6FAFC, Flag #FF9800, Block #F44336, Success #4CAF50

**RBAC permission keys (session-5 ship cut — single consolidated toggle):**
- `editClaimsSettings` — Edit custom alert thresholds and toggle alerts on/off. Will also cover auto-approval settings when that feature ships in a later release (no new permission key needed then).

*Removed in session 5:* separate `viewClaimsSettings`, `editAlertThresholds`, and `createAlerts` keys. One consolidated toggle replaces them. Custom alerts are seeded; only threshold value + on/off state are tunable. Built-in alerts are always on and can't be edited or toggled by any role.

**Default role mapping:**

| Permission | Client | Customer Executive | Program Manager | Program Admin |
|---|---|---|---|---|
| Edit Claims Settings | — | — | — | Yes |

- **Client / Customer Executive** — No claims-settings access.
- **Program Manager** — No. Threshold edits affect claim processing and need Program Admin oversight. Follows Approval Workflow pattern (Program Manager = Verify, Program Admin = Approve).
- **Program Admin** — Full access.
