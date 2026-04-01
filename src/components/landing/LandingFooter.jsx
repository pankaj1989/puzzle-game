import { BRAND, FOOTER } from './landingData.js'

export function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden bg-cream px-5 pb-10 pt-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1442px]">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="text-sm font-semibold text-navy">
              {BRAND.name}
              <div className="mt-1 text-[0.75rem] font-medium text-text-muted">
                © {year} All rights reserved.
              </div>
            </div>
            <p className="mt-4 max-w-[34ch] text-[0.9375rem] leading-relaxed text-text-muted">
              {FOOTER.description}
            </p>

            <div className="mt-8">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-navy">
                {FOOTER.newsletter.title}
              </div>
              <form className="mt-3 flex max-w-[320px] items-center gap-2 rounded-full bg-white p-1 shadow-[0_10px_30px_rgba(26,35,46,0.08)]">
                <input
                  type="email"
                  placeholder={FOOTER.newsletter.placeholder}
                  className="w-full bg-transparent px-4 py-2 text-sm text-navy outline-none placeholder:text-text-muted"
                />
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(26,35,46,0.18)] transition hover:bg-navy-soft active:scale-[0.98]"
                >
                  {FOOTER.newsletter.buttonLabel} →
                </button>
              </form>
            </div>
          </div>

          {FOOTER.columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 border-b border-navy/[0.08] pb-2 text-xs font-bold uppercase tracking-[0.18em] text-navy">
                {col.title}
              </h4>
              <ul className="list-none space-y-2.5 p-0">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[0.9375rem] text-text-muted no-underline transition-colors hover:text-navy"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-navy/[0.10]" />

        <div className="relative mt-4 flex items-center justify-center pb-2 pt-6">
          <div
            className="pointer-events-none absolute inset-x-0 -top-2 select-none text-center font-serif text-[clamp(3.2rem,12vw,7rem)] font-bold leading-none text-navy/[0.04]"
            aria-hidden="true"
          >
            {FOOTER.watermark}
          </div>
          <p className="relative m-0 text-[0.8125rem] text-text-muted">
            © {year}{' '}
            <span className="font-semibold text-brand-orange">{BRAND.name}</span>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
