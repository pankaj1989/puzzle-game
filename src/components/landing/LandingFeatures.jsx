import { FEATURES, FEATURES_SECTION, SECTION_TITLES } from './landingData.js'

export function LandingFeatures() {
  return (
    <section id="features" className="mx-auto mb-[4.5rem] max-w-[1442px] px-5 sm:px-6 lg:px-[64px]">
      <div className="text-center w-fit mx-auto flex flex-col items-center gap-1">
        <span className="inline-flex rounded-full bg-card-yellow2 px-4 py-[6px] text-[13px] font-semibold uppercase tracking-[1.3px] text-brand-brown">
          {FEATURES_SECTION.badge}
        </span>
        <h2 className="font-serif md:text-[64px] text-[40px] font-semibold leading-[1.2] text-navy-dark max-w-[38rem]!">
          {SECTION_TITLES.features}
        </h2>
        <p className="mx-auto mt-1.5 md:max-w-[38rem] max-w-[20rem] text-sm leading-relaxed text-text-muted sm:text-[19px]">
          {FEATURES_SECTION.subheading}
        </p>
      </div>
      <div className="mt-10 grid lg:gap-10 gap-6 md:grid-cols-3">
        {FEATURES.map((f) => (
          <article
            key={f.title}
            className={`rounded-[32px] p-8 xl:p-12 shadow-[0_12px_40px_rgba(26,35,46,0.08)] transition-shadow hover:shadow-[0_16px_48px_rgba(26,35,46,0.12)] ${f.bg} border `}
            style={{ borderColor: `${f.borderColor}` }}
          >
            <div
              className="mb-2 flex items-center"
              aria-hidden="true"
            >
              <img
                src={f.imageSrc}
                alt=""
                className="xl:size-21 size-16 rounded-full object-cover "
                width={56}
                height={56}
                loading="lazy"
              />
            </div>
            <h3 className="font-serif xl:text-[28px] text-[24px] font-bold tracking-tight text-navy">{f.title}</h3>
            <p className="xl:mt-5 mt-3 leading-relaxed text-text-muted xl:text-[16px] text-[14px] max-w-[19rem]!">{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
