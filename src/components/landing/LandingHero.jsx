import { ArrowRightIcon } from './icons.jsx'

const plates = [
  { text: 'L8ER', className: 'left-0 top-[8%] -rotate-6' },
  { text: 'G4MER', className: 'right-[4%] top-[18%] rotate-6' },
  { text: 'E99R', className: 'bottom-[38%] left-[6%] rotate-3' },
  { text: '83 ER', className: 'right-0 top-[42%] -rotate-6' },
]

export function LandingHero() {
  return (
    <section
      id="hero"
      className="mx-auto grid max-w-[1200px] items-center gap-10 px-5 pb-12 pt-6 sm:px-6 lg:grid-cols-2 lg:gap-10 lg:px-8 lg:pb-16"
    >
      <div className="min-w-0 text-center lg:text-left">
        <h1 className="font-serif text-[clamp(2.25rem,4vw,3.25rem)] font-bold leading-[1.12] tracking-tight text-navy">
          Crack the license plate{' '}
          <span className="bg-gradient-to-br from-brand-orange via-[#ffb366] to-cream bg-clip-text italic text-transparent">
            mystery
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-[34ch] text-[1.0625rem] leading-relaxed text-text-muted lg:mx-0">
          Decode vanity plates from around the world. Reveal letters, race the clock, and climb the
          leaderboard in the ultimate word puzzle challenge.
        </p>
        <a
          href="#pricing"
          className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-navy px-7 py-4 text-base font-semibold text-white no-underline transition hover:bg-navy-soft hover:shadow-[0_12px_40px_rgba(26,35,46,0.12)] active:scale-[0.98]"
        >
          Try for Free
          <ArrowRightIcon />
        </a>
        <ul
          className="mt-9 flex flex-wrap justify-center gap-8 text-[0.9375rem] text-text-muted lg:justify-start lg:gap-10"
          aria-label="Highlights"
        >
          <li>
            <strong className="block text-2xl font-bold leading-tight text-navy">500</strong>
            Challenges
          </li>
          <li>
            <strong className="block text-2xl font-bold leading-tight text-navy">8</strong>
            Categories
          </li>
          <li>
            <strong className="block text-2xl font-bold leading-tight text-navy">100K</strong>
            Total Players
          </li>
        </ul>
      </div>
      <div className="relative flex items-end justify-center" aria-hidden="true">
        <div className="pointer-events-none absolute inset-0 z-[1] max-md:hidden">
          {plates.map((p) => (
            <span
              key={p.text}
              className={`absolute rounded-lg border-2 border-navy/[0.08] bg-white px-3 py-2 font-sans text-xs font-extrabold tracking-wide text-navy shadow-[0_4px_16px_rgba(26,35,46,0.12)] ${p.className}`}
            >
              {p.text}
            </span>
          ))}
        </div>
        <img
          className="relative z-0 w-full max-w-[520px] drop-shadow-[0_20px_40px_rgba(26,35,46,0.12)]"
          src="/hero-illustration.png"
          alt=""
          width={560}
          height={420}
          loading="eager"
        />
      </div>
    </section>
  )
}
