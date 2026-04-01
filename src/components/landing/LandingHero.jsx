import CtaButton from "../common/CtaButton.jsx";
import { HERO, HERO_HIGHLIGHTS, HERO_IMAGE } from "./landingData.js";

export function LandingHero() {
  return (
    <section
      id="hero"
      className="mx-auto flex lg:flex-row flex-col max-w-[1442px]  gap-10 px-4 sm:px-6 lg:gap-0 lg:px-[60px] pt-10 lg:pt-0 pb-10 lg:pb-28"
    >
      <div className="min-w-0 text-center lg:text-left w-full lg:w-[825px] flex flex-col justify-end pb-4">
        <div className="font-serif text-[46px] md:text-[60px] xl:text-[80px] font-bold leading-[1.01] tracking-tight text-navy-dark flex flex-col items-center lg:items-start">
          <span className="mb-1">{HERO.titleLines?.[0]}</span>
          <span>{HERO.titleLines?.[1]}</span>
          <span className="text-gradient relative w-fit pb-2 ">
            {HERO.titleAccent}
            <div className="absolute md:top-4 top-0 left-0 orange-glow opacity-20 blur-lg rounded-full md:w-[135%] w-full h-full" />
          </span>
        </div>
        <p className="mx-auto mt-4 max-w-[47ch] xl:text-[18px] text-[16px] text-text-muted lg:mx-0 leading-[29px]">
          {HERO.descPart1}
          <span className="font-semibold"> {HERO.descPart2} </span>
          {HERO.descPart3}
        </p>
        <div className="relative flex lg:hidden mt-4 xl:items-start items-center" aria-hidden="true">
        <img
          className="relative z-0 w-full max-w-[600px]! mx-auto lg:max-w-none! "
          src={HERO_IMAGE.src}
          alt=""
          width={HERO_IMAGE.width}
          height={HERO_IMAGE.height}
          loading="eager"
        />
      </div>
        <CtaButton
          label={HERO.primaryCta.label}
          className="flex px-[30px]! w-full max-w-[435px]! xl:mt-8 mt-6 mx-auto lg:mx-0"
        />
        <ul
          className="mt-6 flex flex-wrap justify-center xl:gap-14 gap-10 text-[0.75rem] text-text-muted lg:justify-start"
          aria-label="Highlights"
        >
          {HERO_HIGHLIGHTS.map((h) => (
            <li key={h.label}>
              <strong className="block font-serif xl:text-[52px] sm:text-[40px] text-[32px] font-bold leading-tight text-navy-dark">
                {h.value}
                {h.valueSuffix && <span className="text-brand-orange-dark">{h.valueSuffix}</span>}
              </strong>
              <span className="xl:text-[14px] sm:text-[12px] text-[10px] tracking-[0.35px] leading-tight">
                {h.label}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="relative hidden  lg:flex xl:items-start items-center" aria-hidden="true">
        <img
          className="relative z-0 w-full max-w-[600px]! mx-auto lg:max-w-none! "
          src={HERO_IMAGE.src}
          alt=""
          width={HERO_IMAGE.width}
          height={HERO_IMAGE.height}
          loading="eager"
        />
      </div>
    </section>
  );
}
