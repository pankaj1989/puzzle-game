import { useEffect, useState } from "react";
import { IoArrowForwardOutline } from "react-icons/io5";
import { BRAND, HEADER_CTA, NAV_LINKS } from "./landingData.js";

export function LandingHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  return (
    <header className="bg-[#FFFBF5]/70 border-b border-gray-200">
      <div className="mx-auto flex max-w-[1442px] lg:min-h-[112px] items-center justify-between gap-3 px-4 py-4 sm:gap-4 sm:px-6 lg:px-[60px]">
        <a
          href="#hero"
          className="flex min-w-0 shrink items-center gap-2.5 no-underline "
        >
          <span className="min-w-0 space-y-1">
            <span className="block truncate text-base font-semibold font-serif tracking-[-0.47px] text-navy-dark sm:text-[19px]">
              {BRAND.name}
            </span>
            <span className="block truncate text-[11px]  tracking-[0.55px]  text-muted uppercase">
              {BRAND.subtitle}
            </span>
          </span>
        </a>
        <nav
          className="hidden items-center gap-6 text-[0.9375rem] font-medium text-text-body lg:flex lg:gap-13 "
          aria-label="Primary"
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="hover:text-navy-dark hover:underline transition-all duration-300"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white/70 text-navy-dark shadow-sm transition hover:bg-white lg:hidden"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            onClick={() => setIsMenuOpen((v) => !v)}
          >
            {isMenuOpen ? (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 6l12 12M18 6L6 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>

          <a
            href={HEADER_CTA.href}
            className="hidden lg:inline-flex shrink-0 items-center justify-center gap-1 whitespace-nowrap rounded-full navy-gradient px-[28px] py-[23.5px] text-sm text-white! no-underline shadow-[0_16px_28px_rgba(0,0,0,0.3)] transition sm:text-[25px] border-2 border-[#E17100] leading-0 tracking-[0px] group cursor-pointer"
          >
            <span className="mb-0.5">{HEADER_CTA.label}</span>
            <IoArrowForwardOutline className="group-hover:translate-x-1 transition-transform duration-300" />
          </a>
        </div>
      </div>

      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          {/* <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close menu overlay"
            onClick={() => setIsMenuOpen(false)}
          /> */}
          <div
            id="mobile-nav"
            className="relative h-full bg-[#FFFBF5] p-4 md:py-4 md:px-6 shadow-[0_24px_60px_rgba(0,0,0,0.25)] flex flex-col"
          >
            <div className="flex items-center justify-between">
              <a
                href="#hero"
                className="flex min-w-0 shrink items-center gap-2.5 no-underline "
              >
                <span className="min-w-0 space-y-1">
                  <span className="block truncate text-base font-semibold font-serif tracking-[-0.47px] text-navy-dark sm:text-[19px]">
                    {BRAND.name}
                  </span>
                  <span className="block truncate text-[11px]  tracking-[0.55px]  text-muted uppercase">
                    {BRAND.subtitle}
                  </span>
                </span>
              </a>
              <button
                type="button"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white/70 text-navy-dark shadow-sm transition hover:bg-white lg:hidden"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-nav"
                onClick={() => setIsMenuOpen((v) => !v)}
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M6 6l12 12M18 6L6 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <nav className="mt-4 flex-1" aria-label="Mobile">
              <ul className="space-y-2">
                {NAV_LINKS.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      className="block rounded-2xl px-4 py-3 text-base font-medium text-navy-dark transition hover:bg-black/5"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <a
              href={HEADER_CTA.href}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full navy-gradient px-6 py-4 text-base font-semibold text-white! shadow-[0_16px_28px_rgba(0,0,0,0.3)] transition hover:bg-opa border-2 border-[#E17100] group max-w-[520px] mx-auto"
              onClick={() => setIsMenuOpen(false)}
            >
              {HEADER_CTA.label}
              <IoArrowForwardOutline className="group-hover:translate-x-1 transition-transform duration-300 text-lg" />
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
