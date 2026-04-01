function CheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  )
}

const freeFeatures = [
  'Daily puzzles & core categories',
  'Leaderboard access',
  'Basic stats',
]

const premiumFeatures = [
  'Everything in Free',
  'Ad-free experience',
  'Exclusive puzzle packs',
  'Advanced analytics & streaks',
]

export function LandingPricing() {
  return (
    <section id="pricing" className="mx-auto mb-[4.5rem] max-w-[1100px] px-5 sm:px-6 lg:px-8">
      <h2 className="mb-10 text-center font-serif text-[clamp(1.75rem,3vw,2.25rem)] font-bold tracking-tight text-navy">
        Choose your plan
      </h2>
      <div className="mx-auto grid max-w-[880px] gap-7 lg:grid-cols-2">
        <article className="flex min-h-[420px] flex-col rounded-[2rem] border border-navy/[0.06] bg-white p-8 pb-8 shadow-[0_12px_40px_rgba(26,35,46,0.08)]">
          <h3 className="font-serif text-2xl font-bold text-navy">Free</h3>
          <p className="mt-2 font-serif text-[2.5rem] font-bold leading-none text-navy">
            <span className="text-[1.75rem]">$</span>0
            <span className="text-base font-medium text-text-muted"> / month</span>
          </p>
          <ul className="mb-7 mt-6 flex-1 space-y-3 text-[0.9375rem] text-text-body">
            {freeFeatures.map((item) => (
              <li key={item} className="flex gap-3">
                <CheckIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-blue-600" />
                {item}
              </li>
            ))}
          </ul>
          <a
            href="#hero"
            className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-[#e8ecf0] px-6 py-3 font-semibold text-navy no-underline transition hover:bg-[#dde2e8] active:scale-[0.98]"
          >
            Start Playing
          </a>
        </article>

        <article className="relative flex min-h-[420px] flex-col rounded-[2rem] bg-navy p-8 pb-8 text-white shadow-[0_12px_40px_rgba(26,35,46,0.08)]">
          <span className="absolute right-6 top-5 rounded-full bg-brand-orange px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-navy">
            Offer
          </span>
          <h3 className="font-serif text-2xl font-bold">Premium</h3>
          <p className="mt-2 font-serif text-[2.5rem] font-bold leading-none text-brand-orange">
            <span className="text-[1.75rem]">$</span>9
            <span className="text-base font-medium text-white/75"> / month</span>
          </p>
          <ul className="mb-7 mt-6 flex-1 space-y-3 text-[0.9375rem] text-white/92">
            {premiumFeatures.map((item) => (
              <li key={item} className="flex gap-3">
                <CheckIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-brand-orange" />
                {item}
              </li>
            ))}
          </ul>
          <a
            href="#hero"
            className="mt-auto inline-flex w-full items-center justify-center rounded-full bg-white px-6 py-3 font-semibold text-navy no-underline transition hover:bg-slate-100 active:scale-[0.98]"
          >
            Upgrade Now
          </a>
        </article>
      </div>
    </section>
  )
}
