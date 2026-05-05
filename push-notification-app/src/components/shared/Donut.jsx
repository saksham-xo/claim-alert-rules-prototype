/**
 * Tiny SVG donut chart — sent successfully (green) vs failed to send (red).
 * No chart library; one SVG arc + center totals.
 */
export default function Donut({ success = 90, fail = 10, size = 180, strokeWidth = 28 }) {
  const total = success + fail;
  const successPct = total === 0 ? 0 : (success / total) * 100;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const successDash = (successPct / 100) * circumference;
  const failDash = circumference - successDash;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#ED6E6E"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#7DC97D"
          strokeWidth={strokeWidth}
          strokeDasharray={`${successDash} ${failDash}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-text">
        <div className="text-[11px] text-text-secondary">Success Rate</div>
        <div className="text-[18px] font-semibold">{successPct.toFixed(1)}%</div>
      </div>
    </div>
  );
}
