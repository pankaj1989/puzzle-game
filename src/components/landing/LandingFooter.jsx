import { IoIosArrowForward, IoMdArrowForward } from 'react-icons/io'
import { BRAND, FOOTER } from './landingData.js'

export function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative overflow-hidden bg-white rounded-t-[21px] px-5 pb-10 pt-14 sm:px-6 lg:px-8 drop-shadow-[0_-20px_20px_rgba(0,0,0,0.1)]">
      <div className="mx-auto max-w-[1312px]">
        <div className="flex flex-wrap xl:gap-[162px] md:gap-[100px] gap-[50px] ">
          <div className="md:max-w-[28ch]">
            <div className="text-[18px] md:text-[15px] font-serif font-semibold text-navy">
              {BRAND.name}
              <div className="font-sans text-[12px] font-light text-text-muted">
                © {year} All rights reserved.
              </div>
            </div>
            <p className="mt-4.5  text-[15px] leading-relaxed text-text-muted">
              {FOOTER.description}
            </p>

            <div className="mt-7.5">
              <div className="text-[15px] font-serif font-bold uppercase text-navy">
                {FOOTER.newsletter.title}
              </div>
              <form className="mt-2 flex items-center gap-2 rounded-full bg-brand-orange3/25  shadow-[0_10px_30px_rgba(26,35,46,0.08)] text-[12px]">
                <input
                  type="email"
                  placeholder={FOOTER.newsletter.placeholder}
                  className="w-full bg-transparent ps-[13px] px-4 py-2.5 text-navy-dark outline-none placeholder:text-navy-dark"
                />
                <button
                  type="button"
                  className="group inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-navy-dark px-5 py-[13px] text-white shadow-[0_12px_28px_rgba(26,35,46,0.18)] transition hover:bg-navy-soft active:scale-[0.98] cursor-pointer font-light leading-0"
                >
                  {FOOTER.newsletter.buttonLabel} <IoMdArrowForward className="size-3 group-hover:translate-x-1 transition-transform duration-300" />
                </button>
              </form>
            </div>
          </div>

          {FOOTER.columns.map((col) => (
            <div key={col.title} className='min-w-[181px]'>
              <h4 className="mb-3 border-b border-navy pb-2 text-base font-bold uppercase text-navy">
                {col.title}
              </h4>
              <ul className="list-none space-y-[8px] p-0">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-[0.9375rem] text-text-muted! no-underline transition-colors hover:text-navy-dark!"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 border-t border-navy" />

        <div className="relative mt-4 flex items-center justify-center pb-2 pt-8">
          <div
            className="pointer-events-none absolute inset-x-0 -top-6 select-none text-center font-serif xl:text-[100px] md:text-[70px] text-[60px] font-semibold leading-none text-navy/[0.04] "
            aria-hidden="true"
          >
            {FOOTER.watermark}
          </div>
          <p className="relative m-0 text-[12px] text-navy-dark">
            © {year}{' '}
            <span className="text-brand-orange">{BRAND.name}</span>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
