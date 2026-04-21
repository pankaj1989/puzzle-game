import { useEffect, useRef } from 'react';
import { useAuth } from '../auth/AuthContext';

const CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID;

export default function AdSlot({ slot, format = 'auto', className = '' }) {
  const { user } = useAuth();
  const ref = useRef(null);

  useEffect(() => {
    if (!CLIENT_ID) return;
    if (user?.plan === 'premium') return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script hasn't loaded yet — silent fail
    }
  }, [user, slot]);

  if (!CLIENT_ID) return null;
  if (user?.plan === 'premium') return null;

  return (
    <div ref={ref} className={`my-6 text-center ${className}`}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}
