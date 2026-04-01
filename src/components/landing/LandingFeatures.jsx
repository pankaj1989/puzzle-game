import { FEATURES, FEATURES_SECTION, SECTION_TITLES } from './landingData.js'

export function LandingFeatures() {
  return (
    <section id="features" className="mx-auto mb-[4.5rem] max-w-[1442px] px-5 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="inline-flex rounded-full bg-card-yellow px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-brand-orange">
          {FEATURES_SECTION.badge}
        </span>
        <h2 className="mt-4 font-serif text-[clamp(2rem,3.6vw,2.75rem)] font-bold leading-[1.08] tracking-tight text-navy">
          {SECTION_TITLES.features}
        </h2>
        <p className="mx-auto mt-4 max-w-[56ch] text-sm leading-relaxed text-text-muted sm:text-[0.9375rem]">
          {FEATURES_SECTION.subheading}
        </p>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {FEATURES.map((f) => (
          <article
            key={f.title}
            className={`rounded-3xl p-7 shadow-[0_12px_40px_rgba(26,35,46,0.08)] transition-shadow hover:shadow-[0_16px_48px_rgba(26,35,46,0.12)] ${f.bg} ${f.cardClassName ?? ''}`}
          >
            <div
              className="mb-5 flex items-center justify-center"
              aria-hidden="true"
            >
              <img
                src={f.imageSrc}
                alt=""
                className="h-14 w-14 rounded-full object-cover shadow-[0_10px_24px_rgba(26,35,46,0.16)] ring-4 ring-white/70"
                width={56}
                height={56}
                loading="lazy"
              />
            </div>
            <h3 className="font-serif text-xl font-bold tracking-tight text-navy">{f.title}</h3>
            <p className="mt-3 text-[0.875rem] leading-relaxed text-text-muted sm:text-[0.9375rem]">{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
