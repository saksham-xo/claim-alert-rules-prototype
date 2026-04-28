export default function PageHeader({ icon, title, subtitle }) {
  return (
    <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-4 px-6 flex items-center gap-4 mb-6 min-h-[86px]">
      <div className="w-[52px] h-[52px] bg-primary-light rounded-lg flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <h1 className="text-xl font-semibold text-text">{title}</h1>
        <p className="text-sm text-text-secondary mt-0.5 tracking-wide">{subtitle}</p>
      </div>
    </div>
  );
}
