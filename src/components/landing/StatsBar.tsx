const stats = [
  { value: '144', label: 'Leaders' },
  { value: '44+', label: 'Countries' },
  { value: '50+', label: 'Industries' },
  { value: '2026', label: 'CXO Cohort' },
];

export default function StatsBar() {
  return (
    <section id="stats" className="py-12 px-6 md:px-8 bg-brand-navy">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-0">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`
                flex flex-col items-center text-center py-4
                ${i < stats.length - 1 ? 'md:border-r md:border-slate-700' : ''}
              `}
            >
              <div className="bg-brand-gold-subtle rounded-lg px-6 py-3 inline-block">
                <span className="text-4xl md:text-5xl font-bold text-brand-gold">
                  {stat.value}
                </span>
              </div>
              <span className="text-sm uppercase tracking-wide text-slate-400 mt-3">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
