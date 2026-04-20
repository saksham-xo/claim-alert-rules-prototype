# GF-13430 — Feature Details (ship cut 2026-04-25)

> Draft ticket comment for [GF-13430](https://giftxoxo.atlassian.net/browse/GF-13430). Not yet posted.
> Flow / visual reference lives in the React prototype (`alert-rules-app/`). This document covers validations and edge cases only.

---

Scope has grown beyond the original ₹50,000 red-flag story into a **configurable alerts framework**. Capturing the ship-cut decisions here so engineering has everything in one place. For flow and visual reference, use the React prototype (`alert-rules-app/`, routes `/partner-promotions/invoice-management` and `/partner-promotions/invoice-management/settings`). Toggle "Dev Notes" in the top-bar to see inline implementation hints on each screen. This comment covers validations and edge cases only.

**Ship target:** 2026-04-25.

## Scope at a glance
- **Built-in alerts (3, baked-in, always on):** *Unable to fetch details*, *Line item sum mismatch*, *Duplicate invoice number*. Cannot be toggled off or edited from any UI — backend-only to disable.
- **Custom alerts:** seed rule(s) provisioned by admin. User-editable: threshold value + on/off only. Field and operator are **locked** post-creation.
- **Dropped from this release:** Create-alert authoring, auto-approval rules (entire subsystem), alert duplicate/archive, dynamic rule re-evaluation, Confidence Score UI, Flagged tab on Claims list.

## Behaviour — alert evaluation
- **Alerts are frozen at submission.** Rules evaluate *only* when a claim is first submitted; the result is stamped on the invoice. Subsequent rule edits never retroactively re-flag or un-flag old claims.
- **Threshold increase** (50k → 100k): old 75k claims stay flagged (snapshot intact). New claims at 75k no longer flag.
- **Threshold decrease** (50k → 20k): old 40k claims stay unflagged. Only claims submitted after the change are evaluated at 20k.
- **Rule toggled off:** existing claim alerts with that `ruleId` disappear from the list / detail view (filtered by `activeRuleIds`). If toggled back on, they reappear. Snapshot is preserved on the invoice either way.
- **Rule deleted:** pre-existing alerts stamped with its `ruleId` are filtered out (rule no longer in `activeRuleIds`). Stored snapshot remains on the invoice for audit history.

## Behaviour — audit flow (threshold edit *and* toggle)
Both threshold edits and on/off toggles route through the same "Save Alert Changes" confirmation modal.

- **Threshold edits — explicit Save / Cancel.** The value input is disabled until the rule is toggled on. Once editable, typing updates a client-side draft; Save and Cancel buttons appear below the row as soon as the draft differs from the stored value. **Save** (or Enter) opens the audit modal if draft ≠ stored. **Cancel** (or Escape) wipes the draft. On-blur does *not* commit.
- **Pending activation.** Toggling on a rule that has no stored threshold is a pending state — the toggle flips silently (no audit modal). The threshold Save commits activation + threshold as a single audit entry. Cancel in the pending state reverts the toggle back off, leaving no audit trace.
- **On/off toggle (configured rule).** When a rule already has a stored threshold, clicking the toggle opens the modal first. Accept applies the toggle; Cancel leaves it in its pre-click state.
- **Modal copy:** "This action will be recorded in the Audit Trail. Click 'Accept' to save your changes."
- **Accept (either kind):** persist + toast + write audit entry.
  - Threshold: `"<rule name>" threshold updated — logged to audit trail`
  - Toggle: `"<rule name>" activated|deactivated — logged to audit trail`
- **Cancel / backdrop / X:** draft/intent wiped. No audit entry.
- **Silent revert on threshold:** user types then restores the original value → Save button disappears once the draft matches stored again. No modal, no audit entry.
- **Audit entry shape** (follow existing platform pattern, e.g. Members → View Member): user, timestamp, entity = `alert_rule`, entityId, action = `threshold_updated` | `rule_toggled`, `before`, `after`, IP.
- **Name / description edits** (if an Edit page is re-exposed later): do NOT trigger the audit modal. Those are metadata, not behavioural.

## Built-in alert specifics — engineering please confirm
- **Unable to fetch details:** fires when OCR returns empty line items OR key fields missing (invoice number, invoice amount, retailer name). Please confirm the exact field set that trips this alert.
- **Line item sum mismatch:** tolerance in prototype is `|Σ lineItems.amount − invoice.amount| > 0.01` (1 paisa). Confirm the production tolerance (currency-unit floor, percentage-based, etc.).
- **Duplicate invoice number:** cross-row check. Prototype assumes the scope is *all claims in the program*, not just same-retailer. Confirm: is duplicate scoped to retailer, to program, or global?
- **Duplicate re-flagging direction:** when a duplicate is detected at submission, only the *new* claim gets the alert — the previously-submitted claim is not retroactively flagged. Snapshot semantics hold.
- **Backend-only disable:** there's no UI path to turn a built-in alert off. If a client asks to suppress one, it needs a config change at the backend. Please confirm where that config lives (program-scoped flag? tenant-scoped?).

## Custom alert specifics
- Custom alerts remain editable for **threshold value** and **on/off** only. To change field or operator, admin must create a new rule and disable the old one (a later phase will add an authoring UI; for now, provision via backend).
- Seed rule for Lupin: `RULE-001` / *High value invoice* / `totalAmount >= 50000`.
- Multiple conditions per rule (AND/OR groups) are supported in the data model; prototype shows a single condition per rule. Preserve group/condition plurality in the schema.

## Claims list (queue)
- **Red ⚠** next to the amount only for rows with a non-system alert (`alerts.some(a => !a.system)`). Built-in alerts never produce a row indicator.
- Tabs: *Pending Actions*, *All Status*. No Flagged tab.
- Confidence Score column removed from the table. `ocrConfidence` stays on the invoice data model for rule eligibility — just not displayed.

## Invoice detail view
- **Alerts section (right column):**
  - No alerts → green *No discrepancies found* banner.
  - 1+ alert → stacked banners. Built-in = amber (`bg #FFF3E0 / border #FFE0B2`, `Info` icon `#FF9800`). Custom = red (`bg #FFEBEE / border #FFCDD2`, `AlertTriangle` icon `#F44336`). Banner shows alert title only (no message sub-line).
- **Line Items section:** when `lineItems.length === 0`, retain the table header and show a *No Data Found* empty state with "No records could be fetched during OCR process". Illustrates the *Unable to fetch details* case.
- ConfidenceScoreCard removed.

## Claims Settings (`/invoice-management/settings`)
- **Built-in Alerts** section: three locked cards. Toggle is display-only (always on, opacity 0.7). No edit path.
- **Custom Alerts** section: one card per custom rule. Toggle + name + description + inline condition row (field locked, operator locked, value editable). Toggle click and threshold blur both route through the "Save Alert Changes" modal described above.
- Alert title in Claims Settings must match the alert banner title in the invoice view **1:1** (e.g. *Unable to fetch details*, not *OCR extraction failure*). Sentence case everywhere.

## RBAC
- **Single permission: `Edit Claims Settings`.** Controls writing only (toggle + threshold edit).
- **Viewing Claims Settings is open** to anyone with Partners & Promotions access. No separate "View" permission. Rationale: the claim detail view shows alert titles only, so reviewers need settings visibility to understand what each alert actually checks.
- Default mapping: Program Admin = Yes; Program Manager / Customer Exec / Client = No.
- **Future:** when auto-approval ships, it lives under the same `Edit Claims Settings` toggle — no new permission key planned.

## Naming / copy
- **Sentence case** for all alert / rule / template names (user-visible). Matches existing built-ins and modern UI convention.
- Alert banner title and Settings page title must be identical strings.
- No-alerts banner reads **"No discrepancies found"** (not "No alerts for this invoice").

## Data-model contract (prototype uses this shape)
```js
// Rule
{ id, name, desc, groups: [[{ f, op, val }]], on: boolean, archived?: boolean, by, at }

// Invoice.alerts[] — stamped at submission
{ ruleId?, ruleName, system: boolean, msg? }
//   system === true → built-in (no ruleId)
//   system !== true → custom (has ruleId)

// Invoice (additions carried forward)
{ ocrConfidence: 0–100, autoApprovedByRuleId?: string }
```

## Explicit out-of-scope (for this ship)
- Create/Duplicate/Archive alert flows.
- Auto-approval rules (entire subsystem). Will reuse the same RBAC toggle when it lands.
- Alert Dashboard, reverse lookup (View Alert → flagged invoices).
- Dynamic rule re-evaluation against existing claims.
- Retroactive scan (run against historical claims with date range).
- Behaviour differentiation (flag vs block) — all alerts surface identically.

## Open items needing engineering answers (flagged above)
1. Exact field set that triggers *Unable to fetch details*.
2. Line-item sum mismatch tolerance (1 paisa? percentage?).
3. Duplicate invoice number scope (retailer / program / global).
4. Audit log entry schema — reuse existing pattern or new table?
5. Where the "disable a built-in alert" backend config lives (program-scoped, tenant-scoped).
6. Who provisions custom alert rules pre-authoring UI (backend admin API, DB seed, config file)?

cc @Prarthana Sampath, @Anushree — please flag anything I've mis-scoped before handover.
