const styles = {
  pending: 'bg-pending-bg text-[#B8860B]',
  approved: 'bg-[rgba(76,175,80,0.13)] text-success',
  rejected: 'bg-[rgba(244,67,54,0.13)] text-block',
};

const labels = {
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function StatusPill({ status }) {
  return (
    <span className={`inline-block px-2 py-1 rounded text-xs font-semibold min-w-[80px] text-center ${styles[status] || ''}`}>
      {labels[status] || status}
    </span>
  );
}
