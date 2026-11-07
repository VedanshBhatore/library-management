const ACCENTS = {
  default: 'from-brand-500 to-brand-400',
  danger: 'from-rose-500 to-orange-400',
  success: 'from-emerald-500 to-teal-400',
};

export default function StatCard({ label, value, icon: Icon, tone = 'default' }) {
  return (
    <div className="card relative overflow-hidden p-5">
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${ACCENTS[tone]}`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1.5 font-display text-2xl font-bold text-slate-900">{value}</p>
        </div>
        {Icon && (
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${ACCENTS[tone]} text-white`}>
            <Icon size={18} />
          </span>
        )}
      </div>
    </div>
  );
}
