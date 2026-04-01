import { COMMUNITY_STATS, COMMUNITY_STATS_HEADING } from "./landingData.js";

export function LandingStatsStrip() {
  return (
    <section
      className="mx-auto pb-15 max-w-[1442px] px-5 sm:px-6 lg:px-[60px]"
      aria-label="Community stats"
    >
      <div className="rounded-[40px] bg-[#ffffff]/70 border border-cream2  shadow-[0_10px_20px_var(--color-shadow-orange)] p-[49px] pb-[79px] xl:aspect-[3/0.7]">
        <div className="mb-10 text-center text-[13px] font-semibold uppercase tracking-[1.3px] text-text-muted">
          {COMMUNITY_STATS_HEADING}
        </div>
        <div className="grid gap-7 text-center grid-cols-2 lg:grid-cols-4 lg:gap-[48px]">
          {COMMUNITY_STATS.map((s) => (
            <div key={s.label} className="flex flex-col gap-1.5">
              <span className="inline-flex items-center justify-center gap-1.5 font-serif text-[2.125rem] font-bold tracking-tight text-navy sm:text-[48px]">
                {s.value}
                {s.valueSuffix && (
                  <span className={'md:text-[48px] text-[32px] text-brand-orange-dark'}>
                    {s.valueSuffix}
                  </span>
                )}
              </span>
              <span className="lg:text-[14px] text-[12px] text-text-muted">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
