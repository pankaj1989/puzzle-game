import { useEffect, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import { FaCrown } from 'react-icons/fa';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { createPaymentIntent, confirmPayment } from '../../api/billing';
import { getUserFriendlyApiMessage } from '../../api/apiErrors';
import { useModalStack } from '../../hooks/useModalStack';
import { PREMIUM_PRICE_LABEL } from '../../config/premium';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '');

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#1a2b4a',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#dc2626' },
  },
};

function PaymentForm({ paymentIntentId, clientSecret, onSuccess, onClose }) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements || paying) return;

    const card = elements.getElement(CardElement);
    if (!card) return;

    setError(null);
    setPaying(true);
    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });
      if (stripeError) {
        setError(stripeError.message || 'Payment failed');
        setPaying(false);
        return;
      }
      if (paymentIntent?.status !== 'succeeded') {
        setError('Payment was not completed. Please try again.');
        setPaying(false);
        return;
      }
      const { user } = await confirmPayment(paymentIntentId);
      onSuccess(user);
    } catch (err) {
      setError(getUserFriendlyApiMessage(err, 'Payment failed. Please try again.'));
      setPaying(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg border border-card-gray2 bg-white px-3 py-4">
        <CardElement options={cardElementOptions} />
      </div>
      {error && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || paying}
        className="w-full py-4 rounded-full font-bold text-white text-lg transition-all hover:scale-105 disabled:opacity-60 disabled:hover:scale-100"
        style={{
          background: '#FA7A00',
          border: '1px solid #FFFFFF',
          boxShadow: '0 4px 0 0 #FFFFFF',
        }}
      >
        <span className="flex items-center justify-center gap-2">
          <FaCrown className="text-white text-xl" />
          {paying ? 'Processing…' : 'Pay & unlock Premium'}
        </span>
      </button>
      <button
        type="button"
        onClick={onClose}
        disabled={paying}
        className="w-full py-3 rounded-full font-bold text-gray-900 bg-white text-base transition-all hover:bg-gray-50 disabled:opacity-60"
        style={{ border: '1px solid #FA7A00' }}
      >
        Cancel
      </button>
    </form>
  );
}

export function PremiumPaymentModal({ isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [paymentIntentId, setPaymentIntentId] = useState(null);

  useModalStack(isOpen);

  useEffect(() => {
    if (!isOpen) {
      setClientSecret(null);
      setPaymentIntentId(null);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    async function init() {
      setLoading(true);
      setError(null);
      try {
        const data = await createPaymentIntent();
        if (cancelled) return;
        setClientSecret(data.clientSecret);
        setPaymentIntentId(data.paymentIntentId);
      } catch (err) {
        if (!cancelled) {
          setError(getUserFriendlyApiMessage(err, 'Could not start payment. Please try again.'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[#0000007d]" onClick={onClose} aria-hidden />
      <div className="relative w-full max-w-md bg-white/95 rounded-2xl shadow-xl border border-card-gray2 p-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-navy hover:text-brand-orange"
          aria-label="Close"
        >
          <IoClose className="size-6" />
        </button>
        <h2 className="text-2xl font-serif text-navy mb-1 pr-8">Upgrade to Premium</h2>
        <p className="text-text-muted text-sm mb-6">
          {PREMIUM_PRICE_LABEL} — unlock all categories and remove ads.
        </p>

        {loading && (
          <p className="text-center text-text-muted py-8">Preparing secure checkout…</p>
        )}
        {error && !loading && (
          <div className="space-y-4">
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-lg border border-card-gray2 text-navy font-medium"
            >
              Close
            </button>
          </div>
        )}
        {!loading && !error && clientSecret && paymentIntentId && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
              paymentIntentId={paymentIntentId}
              clientSecret={clientSecret}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          </Elements>
        )}
      </div>
    </div>
  );
}
