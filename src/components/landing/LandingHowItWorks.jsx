import { HOW_SECTION, HOW_STEPS, SECTION_TITLES } from "./landingData.js";

export function LandingHowItWorks() {
  return (
    <section
      id="how-to-play"
      className="mx-auto mb-[4.5rem] max-w-[1442px] px-5 sm:px-6 lg:px-[64px]"
    >
      <div className="text-center w-fit mx-auto flex flex-col items-center gap-1">
        <span className="inline-flex rounded-full bg-card-purple px-4 py-[6px] text-[13px] font-semibold uppercase tracking-[1.3px] text-card-purple2">
          {HOW_SECTION.badge}
        </span>
        <h2 className="mt-1 font-serif md:text-[64px] text-[40px] font-semibold leading-[1.24] text-navy-dark max-w-[48rem]!">
          {SECTION_TITLES.howItWorks}
        </h2>
        <p className="mx-auto mt-3 md:max-w-[38rem] max-w-[20rem] text-sm leading-relaxed text-text-muted sm:text-[19px] tracking-[0.255px]">
          {HOW_SECTION.subheading}
        </p>
      </div>
      <ol className="mt-3 grid list-none grid-cols-1 xl:gap-8 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {HOW_STEPS.map((s) => (
          <li
            key={s.num}
            className={`relative sm:min-h-[280px] min-h-[220px] overflow-hidden rounded-[28px] xl:p-10.5 p-6 shadow-[0_12px_40px_rgba(26,35,46,0.08)] ${s.bg}`}
          >
            <span
              className="pointer-events-none absolute -right-4 -top-8 font-serif text-[120px] font-bold leading-none text-navy/[0.06]"
              aria-hidden="true"
            >
              {s.num}
            </span>
            <div className="text-base font-semibold uppercase tracking-[0.8px] text-brand-orange-dark">
              Step {s.num}
            </div>
            <h3 className="mt-4 font-serif text-[24px] font-semibold text-navy-dark">
              {s.titleLines?.map((line, idx) => (
                <span key={line}>
                  {line}
                  {idx < s.titleLines.length - 1 ? <br /> : null}
                </span>
              ))}
            </h3>
            <p className="lg:mt-3.5 mt-2 text-[15px] leading-[24px] text-text-muted">
              {s.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
