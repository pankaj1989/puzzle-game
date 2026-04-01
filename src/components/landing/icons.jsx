export function ArrowRightIcon({ className = 'h-[18px] w-[18px]' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.025 1l-2.847 2.828 6.176 6.176h-16.354v3.992h16.354l-6.176 6.176 2.847 2.828 10.975-11z"
      />
    </svg>
  )
}

export function LogoMark({ className = 'text-navy' }) {
  return (
    <span className={className} aria-hidden="true">
      <svg className="h-8 w-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="8" fill="currentColor" />
        <path d="M8 12h4v8H8v-8zm6-2h4v12h-4V10zm6 4h4v8h-4v-8z" fill="#FFF8F0" />
      </svg>
    </span>
  )
}
