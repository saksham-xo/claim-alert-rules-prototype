export default function ActionCard({ title, subtitle, buttonLabel, onButtonClick }) {
  return (
    <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] px-6 py-4 flex items-center justify-between mb-6 min-h-[74px]">
      <div>
        <h3 className="text-base font-semibold text-text">{title}</h3>
        <p className="text-[13px] text-text-secondary mt-0.5">{subtitle}</p>
      </div>
      <button
        onClick={onButtonClick}
        className="bg-primary text-white px-4 py-2 rounded text-sm font-medium hover:bg-[#354499] transition-colors cursor-pointer"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
