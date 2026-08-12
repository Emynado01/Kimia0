export type PaymentIntentInput = { orderId: string; amount: number; currency: string; idempotencyKey: string };
export type PaymentIntentResult = { providerReference: string; status: "AWAITING_PAYMENT" | "PAID" | "FAILED" };

/** Payment is intentionally abstract: never collect or persist card data in this app. */
export interface PaymentProvider {
  createPaymentIntent(input: PaymentIntentInput): Promise<PaymentIntentResult>;
  handleWebhook(payload: string, signature?: string): Promise<void>;
}

/** TODO: implement with STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET after Stripe onboarding. */
export class StripePaymentProvider implements PaymentProvider {
  async createPaymentIntent(): Promise<PaymentIntentResult> { throw new Error("Stripe is not configured."); }
  async handleWebhook(): Promise<void> { throw new Error("Stripe is not configured."); }
}
