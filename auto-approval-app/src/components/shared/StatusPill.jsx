import { CheckCircle2, AlertCircle, ShieldAlert, Clock, XCircle, Slash, Info, Sparkles } from 'lucide-react';

/**
 * Three pill modes coexist in the prototype:
 *
 *   1. kind="decision" (legacy Loyalife platform):
 *        pending_approval | approved | rejected | failed
 *
 *   2. kind="verdict" (auto-approval pipeline output):
 *        auto_approved | needs_review | suspicious | pending | off
 *      - Used inside the Auto-Approval card on the invoice detail view.
 *
 *   3. kind="presentation" (unified status column — preferred for lists):
 *        auto_approved | approved | rejected | failed | needs_review |
 *        suspicious_low | suspicious_medium | suspicious_high | off | pending
 *      - Single derived axis combining decisionStatus + verdict, so the user
 *        sees one pill per row instead of two parallel ones.
 */

const DECISION_VARIANTS = {
  pending_approval: { label: 'Pending Approval', bg: 'bg-pending-bg', fg: 'text-[#B8860B]', border: 'border-[#F0D070]', Icon: Clock },
  approved:         { label: 'Approved',         bg: 'bg-success-bg', fg: 'text-[#2E7D32]', border: 'border-[#A5D6A7]', Icon: CheckCircle2 },
  rejected:         { label: 'Rejected',         bg: 'bg-block-bg',   fg: 'text-[#C62828]', border: 'border-[#FFCDD2]', Icon: XCircle },
  failed:           { label: 'Failed',           bg: 'bg-block-bg',   fg: 'text-[#C62828]', border: 'border-[#FFCDD2]', Icon: Slash },
};

const VERDICT_VARIANTS = {
  auto_approved: { label: 'Auto-approved', bg: 'bg-success-bg', fg: 'text-[#2E7D32]', border: 'border-[#A5D6A7]', Icon: CheckCircle2 },
  needs_review:  { label: 'Needs review',  bg: 'bg-flag-bg',    fg: 'text-[#E65100]', border: 'border-[#FFE0B2]', Icon: AlertCircle },
  suspicious:    { label: 'Suspicious',    bg: 'bg-block-bg',   fg: 'text-[#C62828]', border: 'border-[#FFCDD2]', Icon: ShieldAlert },
  pending:       { label: 'Off',           bg: 'bg-bg',         fg: 'text-text-secondary', border: 'border-border', Icon: Info },
};

const PRESENTATION_VARIANTS = {
  auto_approved:     { label: 'Auto-approved',       bg: 'bg-success-bg',  fg: 'text-[#2E7D32]', border: 'border-[#A5D6A7]', Icon: Sparkles },
  approved:          { label: 'Approved',            bg: 'bg-success-bg',  fg: 'text-[#2E7D32]', border: 'border-[#A5D6A7]', Icon: CheckCircle2 },
  rejected:          { label: 'Rejected',            bg: 'bg-block-bg',    fg: 'text-[#C62828]', border: 'border-[#FFCDD2]', Icon: XCircle },
  failed:            { label: 'Failed',              bg: 'bg-block-bg',    fg: 'text-[#C62828]', border: 'border-[#FFCDD2]', Icon: Slash },
  needs_review:      { label: 'Needs review',        bg: 'bg-flag-bg',     fg: 'text-[#E65100]', border: 'border-[#FFE0B2]', Icon: AlertCircle },
  suspicious_low:    { label: 'Suspicious (Low)',    bg: 'bg-block-bg',    fg: 'text-[#C62828]', border: 'border-[#FFCDD2]', Icon: ShieldAlert },
  suspicious_high:   { label: 'Suspicious (High)',   bg: 'bg-block-bg',    fg: 'text-[#C62828]', border: 'border-[#FFCDD2]', Icon: ShieldAlert },
  unknown:           { label: '—',                   bg: 'bg-bg',          fg: 'text-text-secondary', border: 'border-border', Icon: null },
  pending:           { label: 'Pending',             bg: 'bg-pending-bg',  fg: 'text-[#B8860B]', border: 'border-[#F0D070]', Icon: Clock },
};

export default function StatusPill({ status, kind = 'decision' }) {
  let variants, fallback;
  if (kind === 'verdict')           { variants = VERDICT_VARIANTS;      fallback = 'pending'; }
  else if (kind === 'presentation') { variants = PRESENTATION_VARIANTS; fallback = 'unknown'; }
  else                              { variants = DECISION_VARIANTS;     fallback = 'pending_approval'; }
  const cfg = variants[status] || variants[fallback];
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${cfg.bg} ${cfg.fg} ${cfg.border}`}>
      {Icon && <Icon size={11} className="shrink-0" />}
      {cfg.label}
    </span>
  );
}

/**
 * Risk pill — used on the invoice detail view's Auto-Approval card.
 * Three tiers; warm-tone progression as an urgency meter.
 */
const RISK_VARIANTS = {
  low:  { label: 'Low risk',  bg: 'bg-[#FFF8E1]', fg: 'text-[#8D6E00]', border: 'border-[#FFE082]' },
  high: { label: 'High risk', bg: 'bg-[#FFCDD2]', fg: 'text-[#B71C1C]', border: 'border-[#EF5350]' },
};

export function RiskPill({ risk }) {
  const cfg = RISK_VARIANTS[risk];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${cfg.bg} ${cfg.fg} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}
