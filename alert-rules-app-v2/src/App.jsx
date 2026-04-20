import { Routes, Route, Link } from 'react-router-dom';

export default function App() {
  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center p-6">
      <Routes>
        <Route path="/" element={<Placeholder />} />
        <Route path="*" element={<Placeholder />} />
      </Routes>
    </div>
  );
}

function Placeholder() {
  return (
    <div className="bg-surface rounded-lg shadow-[0_0_1px_1px_var(--color-border)] p-8 max-w-xl text-center">
      <div className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">v2 scaffold</div>
      <h1 className="text-2xl font-semibold mb-2">Claim Alert Rules — v2</h1>
      <p className="text-sm text-text-secondary leading-relaxed">
        Fresh shell. Theme tokens and store inherited from v1; layout, pages, and components
        not yet built. Start composing the new UI in <code className="px-1 py-0.5 rounded bg-bg text-[12px]">src/pages/</code>.
      </p>
    </div>
  );
}
