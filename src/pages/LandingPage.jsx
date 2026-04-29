import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext.jsx'
import { LandingCta } from '../components/landing/LandingCta.jsx'
import { LandingFeatures } from '../components/landing/LandingFeatures.jsx'
import { LandingFooter } from '../components/landing/LandingFooter.jsx'
import { LandingHeader } from '../components/landing/LandingHeader.jsx'
import { LandingHero } from '../components/landing/LandingHero.jsx'
import { LandingHowItWorks } from '../components/landing/LandingHowItWorks.jsx'
import { LandingPricing } from '../components/landing/LandingPricing.jsx'
import { LandingStatsStrip } from '../components/landing/LandingStatsStrip.jsx'
import { PlayExperienceModal } from '../components/landing/PlayExperienceModal.jsx'
import { LoginPage } from './LoginPage.jsx'
import { SignupPage } from './SignupPage.jsx'

export function LandingPage() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [authModal, setAuthModal] = useState(null)
  const [isPlayModalOpen, setIsPlayModalOpen] = useState(false)

  useEffect(() => {
    const auth = searchParams.get('auth')
    if (auth === 'login' || auth === 'signup') {
      setAuthModal(auth)
    }
  }, [searchParams])

  useEffect(() => {
    if (user && authModal) {
      setAuthModal(null)
    }
  }, [user, authModal])

  function closeAuthModal() {
    setAuthModal(null)
    if (searchParams.get('auth')) {
      const next = new URLSearchParams(searchParams)
      next.delete('auth')
      setSearchParams(next, { replace: true })
    }
  }

  function handleStartPlaying() {
    if (user) {
      setIsPlayModalOpen(true)
      return
    }
    setAuthModal('signup')
  }

  return (
    <div className="min-h-svh text-text-body antialiased">
      <LandingHeader onOpenLogin={() => setAuthModal('login')} onStartPlaying={handleStartPlaying} />
      <main>
        <LandingHero onOpenSignup={handleStartPlaying} />
        <LandingStatsStrip />
        <LandingFeatures />
        <LandingHowItWorks />
        <LandingPricing onStartPlaying={handleStartPlaying} />
        <LandingCta onOpenSignup={handleStartPlaying} />
      </main>
      <LandingFooter />
      <PlayExperienceModal isOpen={isPlayModalOpen} onClose={() => setIsPlayModalOpen(false)} />
      {authModal === 'login' && (
        <LoginPage
          isModal
          onClose={closeAuthModal}
          onSwitchToSignup={() => setAuthModal('signup')}
        />
      )}
      {authModal === 'signup' && (
        <SignupPage
          isModal
          onClose={closeAuthModal}
          onSwitchToLogin={() => setAuthModal('login')}
        />
      )}
    </div>
  )
}
