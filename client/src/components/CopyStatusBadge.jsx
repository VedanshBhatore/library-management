const STYLES = {
  AVAILABLE: 'bg-green-50 text-green-700',
  ISSUED: 'bg-amber-50 text-amber-700',
  LOST: 'bg-red-50 text-red-700',
  DAMAGED: 'bg-gray-100 text-gray-600',
};

export default function CopyStatusBadge({ status }) {
  return <span className={`rounded px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>{status}</span>;
}
