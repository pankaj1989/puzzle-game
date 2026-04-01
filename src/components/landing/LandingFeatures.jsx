const features = [
  {
    title: 'Dynamic Letter Reveals',
    body: 'Letters appear one at a time—use context and speed to guess the phrase before time runs out.',
    bg: 'bg-card-yellow',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
        <path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Eight Categories',
    body: 'From movies and sports to places and slang—fresh puzzles across themes so every round feels new.',
    bg: 'bg-card-lavender',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 6h16v12H4V6zm2 2v8h12V8H6zm2 2h8v2H8v-2zm0 4h5v2H8v-2z" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Premium Experience',
    body: 'Ad-free play, exclusive puzzle packs, and detailed stats to track your streaks and best times.',
    bg: 'bg-card-blue',
    icon: (
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6.3-4.6-6.3 4.6 2.3-7-6-4.6h7.6L12 2z"
          fill="currentColor"
        />
      </svg>
    ),
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="mx-auto mb-[4.5rem] max-w-[1100px] px-5 sm:px-6 lg:px-8">
      <h2 className="mb-10 text-center font-serif text-[clamp(1.75rem,3vw,2.25rem)] font-bold tracking-tight text-navy">
        Everything you need to master the game
      </h2>
      <div className="grid gap-6 md:grid-cols-3">
        {features.map((f) => (
          <article
            key={f.title}
            className={`rounded-3xl p-7 shadow-[0_12px_40px_rgba(26,35,46,0.08)] transition-shadow hover:shadow-[0_16px_48px_rgba(26,35,46,0.12)] ${f.bg}`}
          >
            <div
              className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/70 text-navy"
              aria-hidden="true"
            >
              {f.icon}
            </div>
            <h3 className="text-lg font-bold text-navy">{f.title}</h3>
            <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-text-muted">{f.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
