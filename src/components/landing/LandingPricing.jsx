import { IoIosCheckmark } from "react-icons/io";
import { PRICING } from "./landingData.js";
import { FaCheck } from "react-icons/fa";

export function LandingPricing() {
  return (
    <section
      id="pricing"
      className="mx-auto mb-[4.5rem] max-w-[1442px] px-5 sm:px-6 lg:px-8"
    >
      <div className="text-center w-fit mx-auto flex flex-col items-center gap-1">
        <span className="inline-flex rounded-full bg-card-yellow2 px-4 py-[6px] text-[13px] font-semibold uppercase tracking-[1.3px] text-brand-brown">
          {PRICING.badge}
        </span>
        <h2 className="font-serif md:text-[64px] text-[40px] font-semibold leading-[1.24] text-navy-dark max-w-[38rem]!">
          {PRICING.title}
        </h2>
        <p className="mx-auto mt-1.5 md:max-w-[38rem] max-w-[20rem] text-sm leading-relaxed text-text-muted sm:text-[19px] tracking-[0.255px]">
          {PRICING.subheading}
        </p>
      </div>
      <div className="mx-auto mt-10 grid max-w-[1024px] xl:gap-10 gap-6 md:grid-cols-2">
        <article className="flex min-h-[480px] flex-col rounded-[40px] border-[1.5px] border-card-blue2 bg-white/60 md:p-12 p-8  shadow-[0_12px_40px_rgba(26,35,46,0.08)]">
          <h3 className="font-serif text-[36px] font-semibold text-navy-dark">
            {PRICING.free.tier}
          </h3>
          <p className="mt-1.5 leading-none text-navy-dark">
            <span className="text-[64px] font-serif font-semibold">
              ${PRICING.free.price}
            </span>
            <span className="ml-2 text-[18px] text-text-muted">
              {PRICING.free.periodLabel}
            </span>
          </p>
          <p className="mt-6.5 text-base  text-text-muted tracking-[0.1px]">
            {PRICING.free.description}
          </p>
          <a
            href={PRICING.free.cta.href}
            className="mt-10.5 inline-flex w-full items-center justify-center rounded-full bg-card-gray px-6 py-4 text-base font-medium text-navy-dark no-underline transition hover:bg-[#e4e8ed] active:scale-[0.98] cursor-pointer"
          >
            {PRICING.free.cta.label}
          </a>
          <ul className="mb-0 mt-9.5 flex-1 space-y-4 text-[15px] text-text-muted">
            {PRICING.free.features.map((item) => (
              <li key={item} className="flex gap-3 items-center">
                <div className="relative size-5 shrink-0">
                  <span
                    className={`absolute inset-0  size-5 shrink-0 rounded-full bg-slate-200`}
                    aria-hidden="true"
                  />
                  <span
                    className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-2 shrink-0 rounded-full bg-slate-600`}
                    aria-hidden="true"
                  />
                </div>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="relative flex min-h-[480px] flex-col rounded-[40px] navy-gradient2 md:p-12 p-8 text-white shadow-[0_12px_40px_rgba(26,35,46,0.12)]">
          <div className="size-[400px] absolute top-0 right-0 orange-glow2 blur-[120px] rounded-full pointer-events-none"/>
          <span className="absolute right-8 top-8 rounded-full bg-brand-orange px-4 py-2.5 text-[11px] font-bold uppercase tracking-[1.1px] text-navy-dark">
            {PRICING.premium.badge}
          </span>
          <h3 className="font-serif text-[36px] font-semibold">
            {PRICING.premium.tier}
          </h3>
          <p className="mt-1.5 leading-none ">
            <span className="text-[64px] font-serif font-semibold">
              ${PRICING.premium.price}
            </span>
            <span className="ml-2 text-[18px] text-text-muted2">
              /{PRICING.premium.period}
            </span>
          </p>
          <p className="mt-6.5 text-base font-light! text-card-gray2 tracking-[0.2px] max-w-[20rem] leading-relaxed">
            {PRICING.premium.description}
          </p>
          <a
            href={PRICING.premium.cta.href}
            className="mt-10.5 inline-flex w-full items-center justify-center rounded-full bg-card-gray px-6 py-4 text-base font-medium text-navy-dark! no-underline transition hover:bg-[#e4e8ed] active:scale-[0.98] cursor-pointer"
          >
            {PRICING.premium.cta.label}
          </a>
          <ul className="mb-0 mt-9 flex-1 space-y-4 text-[15px] text-white/90 font-light">
            {PRICING.premium.features.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-0.5 inline-flex size-[20px] shrink-0 items-center justify-center rounded-full bg-brand-orange2 text-navy-dark">
                  <FaCheck className="size-[9px] font-bold" />
                </span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}
