import type { Product } from "./catalog";

export const CHECKOUT_DRAFT_KEY = "kimea_checkout_draft";
export const CHECKOUT_CONFIRMATION_KEY = "kimea_checkout_confirmation";
export const CART_STORAGE_KEY = "kimea_cart";

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

export function readCart(): Product[] {
  try {
    const stored = window.sessionStorage.getItem(CART_STORAGE_KEY);
    const items = stored ? JSON.parse(stored) : [];
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

export function saveCart(items: Product[]) {
  window.sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}
