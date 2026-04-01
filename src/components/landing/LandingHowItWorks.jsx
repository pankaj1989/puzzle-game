const steps = [
  {
    num: '01',
    title: 'Choose Category',
    body: 'Pick a theme that matches your mood or skill level.',
    bg: 'bg-card-yellow',
  },
  {
    num: '02',
    title: 'Watch Letters Reveal',
    body: 'Each new letter narrows the possibilities—stay sharp.',
    bg: 'bg-card-orange',
  },
  {
    num: '03',
    title: 'Solve the Puzzle',
    body: 'Type the phrase that matches the plate’s meaning.',
    bg: 'bg-card-pink',
  },
  {
    num: '04',
    title: 'Earn Points',
    body: 'Faster solves and streaks boost your score and rank.',
    bg: 'bg-card-blue',
  },
]

export function LandingHowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto mb-[4.5rem] max-w-[1100px] px-5 sm:px-6 lg:px-8">
      <h2 className="mb-10 text-center font-serif text-[clamp(1.75rem,3vw,2.25rem)] font-bold tracking-tight text-navy">
        Simple to learn, challenging to master
      </h2>
      <ol className="grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <li
            key={s.num}
            className={`relative min-h-[200px] overflow-hidden rounded-3xl p-6 pb-6 pl-5 pr-5 pt-7 shadow-[0_12px_40px_rgba(26,35,46,0.08)] ${s.bg}`}
          >
            <span
              className="pointer-events-none absolute right-4 top-3 font-serif text-[3rem] font-bold leading-none text-navy/[0.08]"
              aria-hidden="true"
            >
              {s.num}
            </span>
            <h3 className="text-base font-bold text-navy">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
