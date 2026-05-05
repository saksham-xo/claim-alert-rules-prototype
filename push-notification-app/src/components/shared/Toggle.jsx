export default function Toggle({ checked, onChange, size = 'md', disabled = false }) {
  const w = size === 'sm' ? 36 : 44;
  const h = size === 'sm' ? 20 : 24;
  const knob = size === 'sm' ? 14 : 16;
  const pad = (h - knob) / 2;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={(e) => { e.stopPropagation(); onChange?.(!checked); }}
      className={`relative shrink-0 rounded-full transition-colors ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${checked ? 'bg-primary' : 'bg-primary-tint'}`}
      style={{ width: w, height: h }}
    >
      <span
        className="absolute top-1/2 -translate-y-1/2 bg-white rounded-full shadow-sm transition-all"
        style={{
          width: knob,
          height: knob,
          left: checked ? w - knob - pad : pad,
        }}
      />
    </button>
  );
}
