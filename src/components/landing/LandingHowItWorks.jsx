import { HOW_SECTION, HOW_STEPS, SECTION_TITLES } from './landingData.js'

export function LandingHowItWorks() {
  return (
    <section id="how-to-play" className="mx-auto mb-[4.5rem] max-w-[1442px] px-5 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="inline-flex rounded-full bg-card-lavender px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-navy/70">
          {HOW_SECTION.badge}
        </span>
        <h2 className="mt-4 font-serif text-[clamp(2rem,3.6vw,2.75rem)] font-bold leading-[1.08] tracking-tight text-navy">
          {SECTION_TITLES.howItWorks}
        </h2>
        <p className="mx-auto mt-4 max-w-[60ch] text-sm leading-relaxed text-text-muted sm:text-[0.9375rem]">
          {HOW_SECTION.subheading}
        </p>
      </div>
      <ol className="mt-10 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {HOW_STEPS.map((s) => (
          <li
            key={s.num}
            className={`relative min-h-[210px] overflow-hidden rounded-3xl px-5 pb-6 pt-6 shadow-[0_12px_40px_rgba(26,35,46,0.08)] ${s.bg}`}
          >
            <span
              className="pointer-events-none absolute right-4 top-3 font-serif text-[4.25rem] font-bold leading-none text-navy/[0.06]"
              aria-hidden="true"
            >
              {s.num}
            </span>
            <div className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-brand-orange">
              Step {s.num}
            </div>
            <h3 className="mt-3 font-serif text-lg font-bold tracking-tight text-navy">
              {s.titleLines?.map((line, idx) => (
                <span key={line}>
                  {line}
                  {idx < s.titleLines.length - 1 ? <br /> : null}
                </span>
              ))}
            </h3>
            <p className="mt-3 text-[0.875rem] leading-relaxed text-text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
