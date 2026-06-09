import { api } from './client';

/** Create a Stripe PaymentIntent and return client secret for Elements. */
export async function createPaymentIntent() {
  return api.post('/billing/payment-intent', {});
}

/** Verify payment server-side and grant premium after card confirmation. */
export async function confirmPayment(paymentIntentId) {
  return api.post('/billing/confirm-payment', { paymentIntentId });
}

/** Fetch Stripe receipt URL for the user's premium purchase. */
export async function getReceipt() {
  return api.post('/billing/receipt', {});
}

/** Open the Stripe payment receipt in a new tab. */
export async function openReceipt() {
  const { url } = await getReceipt();
  if (!url) throw new Error('Receipt URL missing');
  window.open(url, '_blank', 'noopener,noreferrer');
}
