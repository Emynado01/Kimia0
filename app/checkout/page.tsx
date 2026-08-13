"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CHECKOUT_CONFIRMATION_KEY, CHECKOUT_DRAFT_KEY, createCheckoutDraft, type CheckoutDraft, type ConfirmedOrder } from "../../lib/checkout";

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export default function CheckoutPage() {
  const router = useRouter();
  const [draft, setDraft] = useState<CheckoutDraft | null>(null);
  const [ready, setReady] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(CHECKOUT_DRAFT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as CheckoutDraft;
        if (Array.isArray(parsed.items) && parsed.items.length) setDraft(createCheckoutDraft(parsed.items));
      } catch {
        window.sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
      }
    }
    setReady(true);
  }, []);

  function submitOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft) return;
    const data = new FormData(event.currentTarget);
    const customerName = String(data.get("firstName") || "").trim();
    const email = String(data.get("email") || "").trim();
    setIsSubmitting(true);

    const order: ConfirmedOrder = {
      ...draft,
      customerName,
      email,
      createdAt: new Date().toISOString(),
      orderNumber: `KME-${Math.floor(10000 + Math.random() * 90000)}`,
    };
    window.sessionStorage.setItem(CHECKOUT_CONFIRMATION_KEY, JSON.stringify(order));
    window.sessionStorage.removeItem(CHECKOUT_DRAFT_KEY);
    router.push("/checkout/confirmation");
  }

  if (!ready) return <main className="checkout-page checkout-loading" />;
  if (!draft) return <main className="checkout-page checkout-empty"><a className="wordmark" href="/">Kimea<span>·</span></a><section><p className="eyebrow">Votre sac</p><h1>Votre sélection<br/><em>vous attend.</em></h1><p>Ajoutez un produit au sac pour commencer votre commande.</p><a href="/shop" className="button button-dark">Découvrir la collection <span>→</span></a></section></main>;

  return <main className="checkout-page">
    <header className="checkout-header"><a href="/" className="wordmark">Kimea<span>·</span></a><span>Paiement sécurisé</span><a href="/shop">Retour à la boutique</a></header>
    <div className="checkout-layout">
      <form className="checkout-form" onSubmit={submitOrder}>
        <div className="checkout-title"><p className="eyebrow">Finaliser ma commande</p><h1>Quelques détails,<br/><em>puis c’est à vous.</em></h1></div>
        <section className="checkout-section">
          <div className="checkout-section-head"><span>01</span><h2>Vos informations</h2></div>
          <div className="field-grid two"><label>Prénom<input name="firstName" required autoComplete="given-name" placeholder="Prénom" /></label><label>Nom<input name="lastName" required autoComplete="family-name" placeholder="Nom" /></label></div>
          <label>E-mail<input name="email" type="email" required autoComplete="email" placeholder="vous@exemple.com" /></label>
          <label>Téléphone<input name="phone" type="tel" required autoComplete="tel" placeholder="06 00 00 00 00" /></label>
        </section>
        <section className="checkout-section">
          <div className="checkout-section-head"><span>02</span><h2>Livraison</h2></div>
          <label>Adresse<input name="address" required autoComplete="street-address" placeholder="12 rue de la Beauté" /></label>
          <div className="field-grid two"><label>Code postal<input name="postalCode" required autoComplete="postal-code" placeholder="75001" /></label><label>Ville<input name="city" required autoComplete="address-level2" placeholder="Paris" /></label></div>
          <label>Pays<select name="country" defaultValue="France"><option>France</option><option>Belgique</option><option>Luxembourg</option></select></label>
        </section>
        <section className="checkout-section checkout-payment">
          <div className="checkout-section-head"><span>03</span><h2>Paiement</h2></div>
          <div className="payment-notice"><strong>Paiement de démonstration</strong><p>Stripe n’est pas encore configuré : cette étape ne débite aucune carte et aucune donnée bancaire n’est enregistrée.</p></div>
          <label>Nom sur la carte<input name="cardName" required autoComplete="cc-name" placeholder="Kimea Client" /></label>
          <label>Numéro de carte<input name="cardNumber" required inputMode="numeric" autoComplete="cc-number" placeholder="4242 4242 4242 4242" /></label>
          <div className="field-grid two"><label>Date d’expiration<input name="expiry" required inputMode="numeric" autoComplete="cc-exp" placeholder="MM / AA" /></label><label>Cryptogramme<input name="cvc" required inputMode="numeric" autoComplete="cc-csc" placeholder="CVC" /></label></div>
        </section>
        <button className="button button-dark checkout-submit" disabled={isSubmitting}>{isSubmitting ? "Validation…" : `Confirmer la commande · ${euro.format(draft.total)}`} <span>→</span></button>
        <p className="checkout-legal">En confirmant, vous validez les conditions de vente de Kimea. Cette commande est une démonstration et ne donnera lieu à aucun débit.</p>
      </form>
      <aside className="checkout-summary" aria-label="Récapitulatif de la commande"><p className="eyebrow">Votre sélection</p><h2>Récapitulatif</h2><div className="checkout-items">{draft.items.map((item, index) => <article key={`${item.id}-${index}`}><img src={item.image} alt=""/><div><h3>{item.name}</h3><p>{item.shade}</p><strong>{euro.format(item.price)}</strong></div></article>)}</div><dl><div><dt>Sous-total</dt><dd>{euro.format(draft.subtotal)}</dd></div><div><dt>Livraison</dt><dd>{draft.shipping ? euro.format(draft.shipping) : "Offerte"}</dd></div><div className="checkout-grand-total"><dt>Total</dt><dd>{euro.format(draft.total)}</dd></div></dl><p className="checkout-summary-note">Livraison offerte dès 75 €. Préparation sous 1 à 2 jours ouvrés.</p></aside>
    </div>
  </main>;
}
