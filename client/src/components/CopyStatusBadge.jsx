const STYLES = {
  AVAILABLE: 'bg-emerald-50 text-emerald-700',
  ISSUED: 'bg-amber-50 text-amber-700',
  LOST: 'bg-rose-50 text-rose-700',
  DAMAGED: 'bg-slate-100 text-slate-600',
};

const DOTS = {
  AVAILABLE: 'bg-emerald-500',
  ISSUED: 'bg-amber-500',
  LOST: 'bg-rose-500',
  DAMAGED: 'bg-slate-400',
};

export default function CopyStatusBadge({ status }) {
  return (
    <span className={`badge ${STYLES[status]}`}>
      <span className={`badge-dot ${DOTS[status]}`} />
      {status}
    </span>
  );
}
