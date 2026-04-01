function CheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  )
}

function BulletDot({ className }) {
  return <span className={`mt-2 inline-block h-2 w-2 shrink-0 rounded-full ${className}`} aria-hidden="true" />
}

import { PRICING } from './landingData.js'

export function LandingPricing() {
  return (
    <section id="pricing" className="mx-auto mb-[4.5rem] max-w-[1442px] px-5 sm:px-6 lg:px-8">
      <div className="text-center">
        <span className="inline-flex rounded-full bg-card-yellow px-3 py-1 text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-brand-orange">
          {PRICING.badge}
        </span>
        <h2 className="mt-4 font-serif text-[clamp(2rem,3.6vw,2.75rem)] font-bold leading-[1.08] tracking-tight text-navy">
          {PRICING.title}
        </h2>
        <p className="mx-auto mt-4 max-w-[60ch] text-sm leading-relaxed text-text-muted sm:text-[0.9375rem]">
          {PRICING.subheading}
        </p>
      </div>
      <div className="mx-auto mt-10 grid max-w-[980px] gap-7 lg:grid-cols-2">
        <article className="flex min-h-[480px] flex-col rounded-[2rem] border border-navy/[0.06] bg-white p-10 pb-10 shadow-[0_12px_40px_rgba(26,35,46,0.08)]">
          <h3 className="font-serif text-2xl font-bold text-navy">{PRICING.free.tier}</h3>
          <p className="mt-2 font-serif text-[2.75rem] font-bold leading-none text-navy">
            <span className="text-[1.9rem]">$</span>
            {PRICING.free.price}
            <span className="ml-2 text-sm font-medium text-text-muted">{PRICING.free.periodLabel}</span>
          </p>
          <p className="mt-4 text-sm leading-relaxed text-text-muted">{PRICING.free.description}</p>
          <a
            href={PRICING.free.cta.href}
            className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-[#eef1f4] px-6 py-3.5 text-sm font-semibold text-navy no-underline transition hover:bg-[#e4e8ed] active:scale-[0.98]"
          >
            {PRICING.free.cta.label}
          </a>
          <ul className="mb-0 mt-8 flex-1 space-y-3 text-[0.875rem] text-text-muted">
            {PRICING.free.features.map((item) => (
              <li key={item} className="flex gap-3">
                <BulletDot className="bg-slate-300" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="relative flex min-h-[480px] flex-col rounded-[2rem] bg-gradient-to-br from-[#0f172a] via-navy to-[#1b2635] p-10 pb-10 text-white shadow-[0_12px_40px_rgba(26,35,46,0.12)]">
          <span className="absolute right-8 top-7 rounded-full bg-brand-orange px-3 py-1 text-[0.625rem] font-bold uppercase tracking-[0.18em] text-navy">
            {PRICING.premium.badge}
          </span>
          <h3 className="font-serif text-2xl font-bold">{PRICING.premium.tier}</h3>
          <p className="mt-2 font-serif text-[2.75rem] font-bold leading-none text-white">
            <span className="text-[1.75rem]">$</span>
            {PRICING.premium.price}
            <span className="ml-2 text-sm font-medium text-white/70">/ {PRICING.premium.period}</span>
          </p>
          <p className="mt-4 max-w-[34ch] text-sm leading-relaxed text-white/70">
            {PRICING.premium.description}
          </p>
          <a
            href={PRICING.premium.cta.href}
            className="mt-7 inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-navy no-underline transition hover:bg-slate-100 active:scale-[0.98]"
          >
            {PRICING.premium.cta.label}
          </a>
          <ul className="mb-0 mt-8 flex-1 space-y-3 text-[0.875rem] text-white/85">
            {PRICING.premium.features.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-0.5 inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-brand-orange text-navy">
                  <CheckIcon className="h-[14px] w-[14px]" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  )
}
