const stats = [
  { value: '1M+', label: 'Downloads' },
  { value: '50K+', label: 'Monthly active users' },
  { value: '4.9/5', label: 'Star Rating', star: true },
  { value: '95%', label: 'Satisfaction rate' },
]

export function LandingStatsStrip() {
  return (
    <section className="mx-auto mb-14 max-w-[1100px] px-5 sm:px-6 lg:px-8" aria-label="Community stats">
      <div className="rounded-3xl bg-white px-6 py-7 shadow-[0_12px_40px_rgba(26,35,46,0.08)] sm:px-8">
        <div className="grid grid-cols-1 gap-6 text-center sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-1">
              <span className="inline-flex items-center justify-center gap-1.5 font-serif text-[1.75rem] font-bold text-navy">
                {s.value}
                {s.star && (
                  <span className="text-xl text-amber-400" aria-hidden="true">
                    ★
                  </span>
                )}
              </span>
              <span className="text-[0.8125rem] text-text-muted">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
