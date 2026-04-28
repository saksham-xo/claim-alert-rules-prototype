import { Info, Frame } from 'lucide-react';
import { useStore } from '../../data/store';

/**
 * Frontend-dev annotation. Visible only when the "UI Notes" toggle in the Topbar is on.
 *
 * Two variants:
 *   <RefNote kind="replicate" source="Manage Team module">…</RefNote>
 *      → Existing component already lives in the platform. Dev replicates from the source.
 *      → No Figma asset needed.
 *
 *   <RefNote kind="figma" source="Figma file XYZ / page Auto-Approval">…</RefNote>
 *      → New asset / icon / illustration introduced for this feature.
 *      → Dev needs the Figma export — call out where to find it.
 *
 * Children = optional extra context (one short line). Keep it terse — the variant + source carry most of the meaning.
 */
export default function RefNote({ kind = 'replicate', source, children }) {
  const { uiNotes } = useStore();
  if (!uiNotes) return null;

  const config = {
    replicate: {
      Icon: Info,
      bg: 'bg-primary-light/40',
      border: 'border-primary/15',
      text: 'text-primary',
    },
    figma: {
      Icon: Frame,
      label: 'New asset — Figma required.',
      bg: 'bg-flag-bg',
      border: 'border-[#FFE0B2]',
      text: 'text-[#E65100]',
    },
  }[kind];

  const { Icon } = config;

  return (
    <div className={`flex items-start gap-2 ${config.bg} border ${config.border} rounded-lg px-3.5 py-2 mb-4 text-[11px] ${config.text} leading-relaxed`}>
      <Icon size={13} className="shrink-0 mt-[1px]" />
      <span>
        {config.label && <span className="font-semibold">{config.label} </span>}
        {source && <>Source: <em>{source}</em>. </>}
        {children}
      </span>
    </div>
  );
}
