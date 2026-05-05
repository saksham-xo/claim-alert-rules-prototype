import { CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '../../data/store';

export default function Toast() {
  const { toast } = useStore();
  if (!toast) return null;
  const isError = toast.kind === 'error';
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60]">
      <div className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg border ${
        isError ? 'bg-danger-bg border-danger text-danger' : 'bg-success-bg border-success text-success'
      }`}>
        {isError ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
        <span className="text-[14px] font-medium">{toast.message}</span>
      </div>
    </div>
  );
}
