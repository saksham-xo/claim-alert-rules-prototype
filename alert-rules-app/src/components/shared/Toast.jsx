import { useStore } from '../../data/store';

export default function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  return (
    <div className="fixed bottom-6 right-6 bg-text text-white px-5 py-3 rounded-lg text-[13px] z-[300] shadow-lg animate-[fadeUp_0.2s_ease-out]">
      {toast}
    </div>
  );
}
