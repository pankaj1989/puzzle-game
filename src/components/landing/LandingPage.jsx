import { LandingCta } from './LandingCta.jsx'
import { LandingFeatures } from './LandingFeatures.jsx'
import { LandingFooter } from './LandingFooter.jsx'
import { LandingHeader } from './LandingHeader.jsx'
import { LandingHero } from './LandingHero.jsx'
import { LandingHowItWorks } from './LandingHowItWorks.jsx'
import { LandingPricing } from './LandingPricing.jsx'
import { LandingStatsStrip } from './LandingStatsStrip.jsx'

export function LandingPage() {
  return (
    <div className="min-h-svh bg-cream text-text-body antialiased">
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingStatsStrip />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingPricing />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  )
}
