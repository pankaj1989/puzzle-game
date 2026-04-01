import { ArrowRightIcon } from './icons.jsx'

export function LandingCta() {
  return (
    <section className="relative mt-16 overflow-hidden" aria-labelledby="cta-heading">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            'linear-gradient(180deg, rgba(26,35,46,0.88) 0%, rgba(26,35,46,0.92) 100%), url(/plates-pattern.svg)',
        }}
      />
      <div className="relative z-10 mx-auto max-w-[720px] px-5 py-16 text-center sm:px-6 sm:py-[4.5rem]">
        <h2
          id="cta-heading"
          className="font-serif text-[clamp(1.75rem,3vw,2.5rem)] font-bold text-white"
        >
          Ready to play?
        </h2>
        <p className="mt-3 text-[1.0625rem] text-white/85">
          Jump in free—upgrade anytime for the full experience.
        </p>
        <a
          href="#pricing"
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-navy no-underline transition hover:shadow-[0_8px_24px_rgba(0,0,0,0.15)] active:scale-[0.98]"
        >
          Start Playing
          <ArrowRightIcon />
        </a>
      </div>
    </section>
  )
}
