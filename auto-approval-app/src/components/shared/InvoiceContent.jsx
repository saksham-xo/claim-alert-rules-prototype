import { Fragment, useMemo, useState } from 'react';
import { Pencil, CheckCircle2, FileText, ExternalLink, Image as ImageIcon, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { deriveOutcome, VALIDATION_META, VALIDATION_CATEGORIES, useStore } from '../../data/store';
import StatusPill, { RiskPill } from './StatusPill';

/**
 * Reusable invoice body — renders the cards used by both:
 *   - the View Invoice page
 *   - the Approval Workflow modal
 *
 * Layout (top → bottom):
 *   1. Auto-Approval (2/3) + Alerts (1/3)   ← at-a-glance, sits right under the page-level
 *                                              header so the reviewer sees it next to
 *                                              the Reject/Approve buttons
 *   2. Invoice Details (full-width)
 *   2.5 QR Details (full-width — Warranty only)
 *   3. Line Items (full-width, paginated)
 *   4. Timeline (full-width)
 *   5. Partner Details (full-width)
 */
export default function InvoiceContent({ inv }) {
  const { autoApprovalSettings, autoApprovalEnabled } = useStore();

  // Filter the pre-baked failures to only those whose validation is currently
  // enabled in settings, then re-derive the outcome from that filtered set.
  // This way every count and verdict on the card responds live to the toggles
  // on the settings page.
  const enabledIds = useMemo(
    () => new Set(autoApprovalSettings.filter(s => s.on).map(s => s.id)),
    [autoApprovalSettings]
  );
  const outcome = useMemo(() => {
    if (!inv.validationResults) return deriveOutcome(null);
    let failures = inv.validationResults.failures || [];
    // Filter only when the master is on — same rule as derivePresentationStatus.
    if (autoApprovalEnabled) {
      failures = failures.filter(f => enabledIds.has(f.id));
    }
    return deriveOutcome({ ...inv.validationResults, failures });
  }, [inv.validationResults, enabledIds, autoApprovalEnabled]);

  return (
    <div className="flex flex-col gap-5">
      {/* Row 1: Auto-Approval + Alerts — placed right below the action buttons for at-a-glance */}
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <AutoApprovalCard outcome={outcome} enabledIds={enabledIds} autoApprovalSettings={autoApprovalSettings} />
        </div>
        <div>
          <AlertsCard />
        </div>
      </div>

      {/* Row 2: Invoice Details (full-width) */}
      <InvoiceDetailsCard inv={inv} />

      {/* Row 2.5: QR Details — only for Warranty claims */}
      {inv.type === 'Warranty' && inv.qrDetails && <QRDetailsCard qr={inv.qrDetails} />}

      {/* Row 3: Line Items (full-width, paginated) */}
      <LineItemsCard lineItems={inv.lineItems} />

      {/* Row 4: Timeline (full-width) */}
      <TimelineCard inv={inv} />

      {/* Row 5: Partner Details (full-width) */}
      <PartnerDetailsCard inv={inv} />
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Reward points pill — exported so wrappers can include it in their own headers
// ───────────────────────────────────────────────────────────────────────────────
export function RewardPointsInline({ points }) {
  return (
    <div className="flex items-center bg-success-bg/60 border border-[#A5D6A7] rounded-lg px-3.5 py-1.5">
      <div className="leading-tight">
        <div className="flex items-baseline gap-1.5">
          <span className="text-[16px] font-semibold text-text tabular-nums">{points.toLocaleString('en-IN')}</span>
          <span className="text-[11px] font-medium text-text-secondary uppercase tracking-wider">Points</span>
        </div>
        <div className="text-[10px] text-text-secondary -mt-0.5">Issued upon approval</div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Invoice Details
// ───────────────────────────────────────────────────────────────────────────────
function InvoiceDetailsCard({ inv }) {
  const [imageOpen, setImageOpen] = useState(false);
  return (
    <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-text">Invoice Details</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setImageOpen(true)}
            className="flex items-center gap-1 text-[12px] text-primary hover:underline cursor-pointer"
          >
            <ImageIcon size={12} /> View Image
          </button>
          <button className="flex items-center gap-1 text-[12px] text-primary hover:underline cursor-pointer">
            <Pencil size={12} /> Edit Fields
          </button>
        </div>
      </div>
      <div className="px-5 pb-5">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 items-start">
          <Field label="Invoice Number" value={inv.num} mono />
          <Field label="Invoice Amount" value={inv.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} />

          <Field label="Retailer" value={inv.partner} mono />
          <Field label="Customer" value={inv.customer} />

          <Field label="Claim Type" value={inv.type} bold />
          <Field label="Claim ID" value={inv.claimId} bold />

          <Field label="Claim Submitted On" value={formatDate(inv.date)} />
          <Field label="Invoice Date" value={inv.invDate} />
        </div>
      </div>

      {imageOpen && <ImageModal inv={inv} onClose={() => setImageOpen(false)} />}
    </div>
  );
}

// Lightweight image preview modal — placeholder image since this is a prototype.
function ImageModal({ inv, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 z-[150] flex items-center justify-center p-8"
      onClick={onClose}
    >
      <div className="relative bg-surface rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <ImageIcon size={16} className="text-text-secondary" />
            <span className="text-sm font-semibold text-text">Invoice Image · {inv.num}</span>
          </div>
          <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-2xl leading-none text-text-secondary hover:text-text">&times;</button>
        </div>
        <div className="flex-1 overflow-auto p-6 flex items-center justify-center bg-bg">
          <div className="w-full max-w-[500px] aspect-[3/4] bg-surface border border-border rounded flex items-center justify-center">
            <ImageIcon size={64} className="text-text-secondary/40" />
          </div>
        </div>
      </div>
    </div>
  );
}

function formatDate(s) {
  if (!s) return '';
  return s.replace(/\s+\d{1,2}:\d{2}(:\d{2})?$/, '');
}

// ───────────────────────────────────────────────────────────────────────────────
// Line Items — paginated (10 per page).
// Real data can run into hundreds of rows; the pager keeps the card a fixed height.
// ───────────────────────────────────────────────────────────────────────────────
const LINE_ITEMS_PAGE_SIZE = 10;

function LineItemsCard({ lineItems }) {
  const [page, setPage] = useState(1);
  const total = lineItems.length;
  const totalPages = Math.max(1, Math.ceil(total / LINE_ITEMS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * LINE_ITEMS_PAGE_SIZE;
  const end = Math.min(start + LINE_ITEMS_PAGE_SIZE, total);
  const visible = lineItems.slice(start, end);

  return (
    <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-text">Line Items</h2>
          {total > 0 && (
            <span className="text-[12px] text-text-secondary">
              {total} item{total === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <button className="flex items-center gap-1 text-[12px] text-primary hover:underline cursor-pointer">
          <Pencil size={12} /> Edit Fields
        </button>
      </div>
      <div className="px-5 pb-5">
        {total === 0 ? (
          <div className="py-8 text-center text-text-secondary text-[12px]">
            <FileText size={20} className="mx-auto mb-2 opacity-50" />
            No line items extracted.
          </div>
        ) : (
          <>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-[10px] uppercase tracking-wider text-text-secondary border-b border-border">
                  <th className="py-2 font-semibold w-[60px]">S.No</th>
                  <th className="py-2 font-semibold">Product Code</th>
                  <th className="py-2 font-semibold">Product Name</th>
                  <th className="py-2 font-semibold text-right">Qty</th>
                  <th className="py-2 font-semibold text-right">Unit Price</th>
                  <th className="py-2 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((li, i) => (
                  <tr key={start + i} className="border-b border-border last:border-0">
                    <td className="py-3 text-text-secondary">{start + i + 1}</td>
                    <td className="py-3 text-text-secondary">{li.code || '—'}</td>
                    <td className="py-3">{li.name}</td>
                    <td className="py-3 text-right tabular-nums">{li.qty}</td>
                    <td className="py-3 text-right tabular-nums">{li.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td className="py-3 text-right tabular-nums font-medium">{li.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-end gap-3 pt-3 text-[12px] text-text-secondary">
              <span>{start + 1}–{end} of {total}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className={`border border-border rounded w-7 h-7 flex items-center justify-center ${safePage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-bg cursor-pointer'}`}
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className={`border border-border rounded w-7 h-7 flex items-center justify-center ${safePage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-bg cursor-pointer'}`}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Timeline
// ───────────────────────────────────────────────────────────────────────────────
function TimelineCard({ inv }) {
  return (
    <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
      <div className="px-5 pt-4 pb-3">
        <h2 className="text-base font-semibold text-text">Timeline</h2>
      </div>
      <div className="px-5 pb-5">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary-light flex items-center justify-center shrink-0">
            <FileText size={16} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-text">
              Claim submitted by <span className="font-semibold">{inv.partner}</span>
            </div>
            <div className="text-[12px] text-text-secondary mt-0.5">{inv.date}</div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="bg-primary-light text-primary text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded">
                Claim Submitted
              </span>
              <a className="flex items-center gap-1 text-[12px] text-primary hover:underline cursor-pointer">
                <ExternalLink size={11} /> {sampleAttachmentName(inv)}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function sampleAttachmentName(inv) {
  const ext = inv.ocrConfidence < 60 ? 'jpg' : 'pdf';
  return `claim_${inv.claimId}.${ext}`;
}

// ───────────────────────────────────────────────────────────────────────────────
// Alerts (sibling feature placeholder)
// ───────────────────────────────────────────────────────────────────────────────
function AlertsCard() {
  return (
    <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] h-full">
      <div className="px-5 pt-4 pb-3">
        <h2 className="text-base font-semibold text-text">Alerts</h2>
      </div>
      <div className="px-5 pb-5">
        <div className="bg-success-bg border border-[#A5D6A7] rounded p-3 flex items-center gap-2.5 text-[13px] text-[#1B5E20]">
          <CheckCircle2 size={16} className="text-success shrink-0" />
          <span className="font-medium">No discrepancies found</span>
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Auto-Approval card — at-a-glance
//
// Header:        title + verdict pill.
// Headline:      one sentence — what's wrong and what to do next.
// Total summary: "X of Y checks failed". Y = number of *enabled* validations,
//                so disabling rules in settings shrinks the denominator.
// Categories:    one accordion row per failing category, with the same
//                action-item / description format as the settings page.
//
// This scales. A clean claim shows zero category rows. A garbage upload that
// fails 20 checks still presents as 3 collapsed rows — the reviewer drills
// only into the categories they want to investigate.
// ───────────────────────────────────────────────────────────────────────────────
const FAILURES_PER_CATEGORY_VISIBLE = 5;

function AutoApprovalCard({ outcome, enabledIds, autoApprovalSettings }) {
  const failures = outcome.failures || [];
  const config = VERDICT_CONFIG[outcome.status] || VERDICT_CONFIG.pending;

  // Total enabled validations — drives the "X of Y" denominator everywhere.
  const totalChecks = enabledIds.size;
  const headline = config.headline == null
    ? null
    : (typeof config.headline === 'function'
        ? config.headline(outcome, totalChecks)
        : config.headline);

  // Group failures by category in display order: 1 → 2 → 3.
  // totalInCategory counts only *enabled* checks in that category.
  const grouped = useMemo(() => {
    const buckets = { 1: [], 2: [], 3: [] };
    failures.forEach(f => {
      const meta = VALIDATION_META.find(m => m.id === f.id);
      const cat = meta?.category;
      if (cat && buckets[cat]) buckets[cat].push({ failure: f, meta });
    });
    return [1, 2, 3].map(cat => ({
      cat,
      items: buckets[cat],
      totalInCategory: VALIDATION_META.filter(m => m.category === cat && enabledIds.has(m.id)).length,
    })).filter(g => g.items.length > 0);
  }, [failures, enabledIds]);

  return (
    <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] h-full">
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-text">Auto-Approval</h2>
          <StatusPill status={outcome.status} kind="verdict" />
          {outcome.status === 'suspicious' && outcome.risk && <RiskPill risk={outcome.risk} />}
        </div>
      </div>
      <div className="px-5 pb-5 flex flex-col gap-3">
        {headline && (
          <p className={`text-[13px] leading-snug ${config.headlineColor}`}>{headline}</p>
        )}

        {failures.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="text-[11px] uppercase tracking-wider text-text-secondary">
              {failures.length} of {totalChecks} checks failed
            </div>
            {grouped.map(group => (
              <FailureCategoryGroup
                key={group.cat}
                catId={group.cat}
                items={group.items}
                totalInCategory={group.totalInCategory}
                autoApprovalSettings={autoApprovalSettings}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Collapsible category section. Header always visible — expand to see failures.
// Caps the visible failure list at FAILURES_PER_CATEGORY_VISIBLE; everything
// beyond is gated behind a "Show N more" link so a 17-failure category doesn't
// overwhelm the card.
//
// Each row mirrors the settings-page format: action item (validation name) +
// description (template with threshold values inline).
function FailureCategoryGroup({ catId, items, totalInCategory, autoApprovalSettings }) {
  const cat = VALIDATION_CATEGORIES[catId];
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const visible = showAll ? items : items.slice(0, FAILURES_PER_CATEGORY_VISIBLE);
  const hiddenCount = items.length - visible.length;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-bg/50 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-2 text-[13px]">
          <span className="font-medium text-text">{cat.name}</span>
          <span className="text-text-secondary">·</span>
          <span className="text-text-secondary">
            <span className="font-semibold text-[#C62828]">{items.length}</span> of {totalInCategory} failed
          </span>
        </div>
        <ChevronDown size={14} className={`text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-border bg-bg/30 px-3 py-2.5">
          <ul className="flex flex-col gap-2.5">
            {visible.map(({ failure, meta }, i) => {
              const settings = autoApprovalSettings.find(s => s.id === meta.id);
              return (
                <li key={i}>
                  <div className="text-sm font-medium text-text leading-tight">{meta?.name || failure.id}</div>
                  <div className="text-[13px] text-text-secondary leading-snug flex items-baseline gap-1.5 flex-wrap mt-0.5">
                    {renderValidationDescription(meta?.desc, meta?.thresholds, settings)}
                  </div>
                </li>
              );
            })}
          </ul>
          {hiddenCount > 0 && (
            <button
              onClick={() => setShowAll(true)}
              className="text-[12px] text-primary hover:underline cursor-pointer mt-2.5"
            >
              Show {hiddenCount} more
            </button>
          )}
          {showAll && items.length > FAILURES_PER_CATEGORY_VISIBLE && (
            <button
              onClick={() => setShowAll(false)}
              className="text-[12px] text-primary hover:underline cursor-pointer mt-2.5"
            >
              Show less
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Renders a validation's description template, substituting `{fieldName}`
// placeholders with styled chips of the configured threshold value.
// Mirrors the rendering in AutoApprovalSettings → keeps the two screens in sync.
function renderValidationDescription(template, thresholds, settings) {
  if (!template) return null;
  if (!thresholds || thresholds.length === 0 || !settings) return template;

  const parts = template.split(/(\{[a-zA-Z]+\})/);
  return parts.map((part, i) => {
    const m = part.match(/^\{([a-zA-Z]+)\}$/);
    if (!m) return <Fragment key={i}>{part}</Fragment>;
    const fieldName = m[1];
    const t = thresholds.find(x => x.field === fieldName);
    if (!t) return <Fragment key={i}>{part}</Fragment>;
    const val = settings[fieldName];
    return (
      <span key={i} className="inline-flex items-baseline px-1.5 py-0.5 rounded bg-primary-light/60 text-primary text-[12px] font-semibold whitespace-nowrap">
        {formatThresholdValue(val, t.unit)}
      </span>
    );
  });
}

function formatThresholdValue(val, unit) {
  if (val === undefined || val === null || val === '') return '—';
  const num = typeof val === 'number' ? val : parseFloat(val);
  const formatted = isNaN(num) ? val : num.toLocaleString('en-IN');
  if (unit === '₹') return `₹${formatted}`;
  if (unit === '%') return `${formatted}%`;
  if (unit === 'x') return `${formatted}×`;
  return `${formatted} ${unit}`;
}

const VERDICT_CONFIG = {
  auto_approved: {
    headline: (outcome, totalChecks) => `Passed all ${totalChecks} checks. Ready to approve.`,
    headlineColor: 'text-[#2E7D32]',
    tone: 'success',
  },
  needs_review: {
    headline: null,
    headlineColor: 'text-[#7B3F00]',
    tone: 'flag',
  },
  suspicious: {
    headline: null,
    headlineColor: 'text-[#C62828]',
    tone: 'block',
  },
  pending: {
    headline: 'Auto approval turned off. Configure in settings.',
    headlineColor: 'text-text-secondary',
    tone: 'pending',
  },
};

// ───────────────────────────────────────────────────────────────────────────────
// Partner Details + Past Invoices
// ───────────────────────────────────────────────────────────────────────────────
function PartnerDetailsCard({ inv }) {
  return (
    <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
      <div className="px-5 pt-4 pb-3">
        <h2 className="text-base font-semibold text-text">Partner Details</h2>
      </div>
      <div className="px-5 pb-5">
        <div className="grid grid-cols-4 gap-x-6 gap-y-4 pb-5 border-b border-border">
          <Field label="Partner Name" value={inv.partner} mono />
          <Field label="Partner ID" value={inv.partnerId} />
          <Field label="Total Claims" value={inv.totalClaims} />
          <Field label="Last Claim" value={inv.lastClaim} />
        </div>

        <div className="pt-5">
          <div className="text-[14px] font-semibold text-text mb-3">Past Invoices Claimed</div>
          {(inv.pastInvoices || []).length === 0 ? (
            <div className="text-[12px] text-text-secondary py-4">No past invoices on record.</div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {inv.pastInvoices.map((p, i) => <PastInvoiceTile key={i} invoice={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PastInvoiceTile({ invoice }) {
  const isPdf = invoice.kind === 'pdf';
  const statusConfig = invoice.status === 'failed'
    ? { bg: 'bg-block-bg', text: 'text-[#C62828]', border: 'border-[#FFCDD2]', label: 'Failed' }
    : { bg: 'bg-pending-bg', text: 'text-[#B8860B]', border: 'border-[#F0D070]', label: 'Pending Approval' };

  return (
    <div className="border border-border rounded p-3">
      <div className="flex items-center gap-3 mb-2">
        <div className={`w-10 h-12 ${isPdf ? 'border-[1.5px] border-block' : 'border-[1.5px] border-text-secondary/40'} rounded flex items-center justify-center text-[8px] font-bold tracking-wider ${isPdf ? 'text-block' : 'text-text-secondary'}`}>
          {isPdf ? 'PDF' : 'IMG'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-[12px] font-semibold text-text truncate">
            <span className="truncate">{invoice.num}</span>
            <ExternalLink size={10} className="text-primary shrink-0" />
          </div>
          <div className="text-[11px] text-text-secondary">{invoice.date}</div>
        </div>
      </div>
      <span className={`inline-block text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
        {statusConfig.label}
      </span>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// QR Details — only for Warranty claims
// ───────────────────────────────────────────────────────────────────────────────
function QRDetailsCard({ qr }) {
  return (
    <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)]">
      <div className="px-5 pt-4 pb-3">
        <h2 className="text-base font-semibold text-text">QR Details</h2>
      </div>
      <div className="px-5 pb-5">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <Field label="Reference Id" value={qr.referenceId} />
          <Field label="Product ID" value={qr.productId || '—'} />
          <Field label="Product Name" value={qr.productName} />
          <Field label="Warranty Duration" value={qr.warrantyDuration} />
        </div>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────────
// Field
// ───────────────────────────────────────────────────────────────────────────────
function Field({ label, value, mono, bold }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-text-secondary mb-1">{label}</div>
      <div className={`text-[14px] text-text ${mono ? 'font-mono text-[13px]' : ''} ${bold ? 'font-semibold' : ''}`}>{value || '—'}</div>
    </div>
  );
}
