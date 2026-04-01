import { CTA } from './landingData.js'

export function LandingCta() {
  return (
    <section className="relative mt-16 overflow-hidden" aria-labelledby="cta-heading">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
             `url(${CTA.backgroundImageSrc})`,
        }}
      />
      <div className="relative z-10 mx-auto max-w-[1442px] px-5 py-16 text-center sm:px-6 sm:py-[5.5rem]">
        <h2
          id="cta-heading"
          className="font-serif text-[clamp(2rem,3.6vw,3rem)] font-bold tracking-tight text-white"
        >
          {CTA.heading}
        </h2>
        <p className="mx-auto mt-4 max-w-[60ch] text-sm leading-relaxed text-white/80 sm:text-[0.9375rem]">
          {CTA.subheading}
        </p>
        <a
          href={CTA.cta.href}
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-navy no-underline shadow-[0_16px_34px_rgba(0,0,0,0.25)] transition hover:shadow-[0_18px_40px_rgba(0,0,0,0.30)] active:scale-[0.98] sm:text-[0.9375rem]"
        >
          {CTA.cta.label}
          {/* <ArrowRightIcon className="h-4 w-4" /> */}
        </a>
      </div>
    </section>
  )
}
