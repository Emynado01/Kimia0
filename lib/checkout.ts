import type { Product } from "./catalog";

export const CHECKOUT_DRAFT_KEY = "kimea_checkout_draft";
export const CHECKOUT_CONFIRMATION_KEY = "kimea_checkout_confirmation";

export type CheckoutDraft = {
  items: Product[];
  subtotal: number;
  shipping: number;
  total: number;
};

export type ConfirmedOrder = CheckoutDraft & {
  orderNumber: string;
  customerName: string;
  email: string;
  createdAt: string;
};

export function createCheckoutDraft(items: Product[]): CheckoutDraft {
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  const shipping = subtotal >= 75 ? 0 : 5.9;

  return { items, subtotal, shipping, total: subtotal + shipping };
}
