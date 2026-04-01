import { ArrowRightIcon, LogoMark } from './icons.jsx'

export function LandingHeader() {
  return (
    <header className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6 lg:px-8">
      <a href="#hero" className="flex min-w-0 shrink items-center gap-2.5 no-underline">
        <LogoMark />
        <span className="truncate text-base font-bold tracking-tight text-navy sm:text-lg">
          Puzzle Game
        </span>
      </a>
      <nav
        className="hidden items-center gap-6 text-[0.9375rem] font-medium text-text-body md:flex md:gap-8"
        aria-label="Primary"
      >
        <a href="#features" className="transition-colors hover:text-navy">
          About
        </a>
        <a href="#how-it-works" className="transition-colors hover:text-navy">
          How it Works
        </a>
        <a href="#pricing" className="transition-colors hover:text-navy">
          Pricing
        </a>
      </nav>
      <a
        href="#pricing"
        className="inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-navy px-4 py-2.5 text-sm font-semibold text-white no-underline transition hover:bg-navy-soft hover:shadow-[0_12px_40px_rgba(26,35,46,0.12)] active:scale-[0.98] sm:px-5 sm:text-[0.9375rem]"
      >
        Start Playing
        <ArrowRightIcon />
      </a>
    </header>
  )
}
