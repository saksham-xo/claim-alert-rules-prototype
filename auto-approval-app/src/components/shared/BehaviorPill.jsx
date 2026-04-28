export default function BehaviorPill({ behavior }) {
  if (behavior === 'block') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-block-bg text-[#C62828]">
        <span className="w-1.5 h-1.5 rounded-full bg-block" />
        Blocks approval
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium bg-flag-bg text-[#E65100]">
      <span className="w-1.5 h-1.5 rounded-full bg-flag" />
      Flags for review
    </span>
  );
}
