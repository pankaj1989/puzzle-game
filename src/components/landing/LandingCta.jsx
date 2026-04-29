import { IoIosArrowForward } from "react-icons/io";
import { CTA } from "./landingData.js";

export function LandingCta({ onOpenSignup }) {
  return (
    <section
      className="mt-16 overflow-hidden mx-auto mb-[4.5rem] max-w-[1442px] px-5 sm:px-6 lg:px-[60px]"
      aria-labelledby="cta-heading"
    >
      <div className="relative rounded-[48px] h-[630px] overflow-hidden flex justify-center items-center">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${CTA.backgroundImageSrc})`,
          }}
        />
        <div className="relative z-10 mx-auto max-w-[1442px] px-5 py-16 text-center sm:px-6 sm:py-[5.5rem]">
          <h2
            id="cta-heading"
            className="font-serif xl:text-[80px] sm:text-[64px] text-[50px] font-bold text-white"
          >
            {CTA.heading}
          </h2>
          <p className="mx-auto mt-1 xl:max-w-[52ch] max-w-[40ch] leading-relaxed text-white/80 text-[18px] lg:text-[21px] font-light tracking-[0.3px]">
            {CTA.subheading}
          </p>
          <button
            type="button"
            onClick={onOpenSignup}
            className="group mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-white px-10 py-5 font-medium text-navy no-underline shadow-[0_16px_34px_rgba(0,0,0,0.25)] transition hover:shadow-[0_18px_40px_rgba(0,0,0,0.30)] active:scale-[0.98] sm:text-[17px]"
          >
            {CTA.cta.label}
            <IoIosArrowForward className="size-4 group-hover:translate-x-1 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </section>
  );
}
