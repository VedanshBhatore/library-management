import { AlertTriangleIcon, CheckCircleIcon, InfoIcon } from './icons.jsx';

const STYLES = {
  error: { wrap: 'bg-rose-50 text-rose-700 border-rose-200', icon: AlertTriangleIcon },
  success: { wrap: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircleIcon },
  info: { wrap: 'bg-brand-50 text-brand-700 border-brand-200', icon: InfoIcon },
};

export default function Banner({ type = 'info', children }) {
  if (!children) return null;
  const { wrap, icon: Icon } = STYLES[type];
  return (
    <div className={`flex items-start gap-2 rounded-xl border px-3.5 py-2.5 text-sm animate-fade-in ${wrap}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </div>
  );
}
