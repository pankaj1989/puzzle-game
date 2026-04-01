import { LogoMark } from './icons.jsx'

const columns = [
  {
    title: 'Play',
    links: [
      { href: '#features', label: 'Categories' },
      { href: '#hero', label: 'Solo Game' },
      { href: '#hero', label: 'Multiplayer' },
      { href: '#hero', label: 'Leaderboard' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '#hero', label: 'About' },
      { href: '#hero', label: 'Terms' },
      { href: '#hero', label: 'Privacy' },
      { href: '#hero', label: 'FAQ' },
    ],
  },
  {
    title: 'Support',
    links: [
      { href: '#hero', label: 'Help Center' },
      { href: '#hero', label: 'Contact' },
      { href: '#hero', label: 'Community' },
    ],
  },
]

export function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden border-t border-navy/[0.08] bg-cream px-5 pb-8 pt-14 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <a href="#hero" className="inline-flex items-center gap-2.5 no-underline">
            <LogoMark />
            <span className="text-lg font-bold tracking-tight text-navy">Puzzle Game</span>
          </a>
          <p className="mt-4 max-w-[28ch] text-[0.9375rem] leading-relaxed text-text-muted">
            The modern take on vanity plate wordplay. Play solo or compete with friends around the world.
          </p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-navy">{col.title}</h4>
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

      <div
        className="pointer-events-none select-none text-center font-serif text-[clamp(3rem,12vw,7rem)] font-bold leading-none text-navy/[0.04]"
        aria-hidden="true"
      >
        Bumper Stumpers
      </div>

      <div className="mx-auto mt-6 flex max-w-[1100px] flex-wrap items-center justify-between gap-4 border-t border-navy/[0.06] pt-6">
        <p className="m-0 text-[0.8125rem] text-text-muted">
          © {year} Puzzle Game. All rights reserved.
        </p>
        <div className="flex gap-4" aria-label="Social">
          <a
            href="https://twitter.com"
            className="text-text-muted no-underline transition-colors hover:text-navy"
            aria-label="Twitter"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href="https://discord.com"
            className="text-text-muted no-underline transition-colors hover:text-navy"
            aria-label="Discord"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  )
}
