"use client";

import { useEffect, useState } from "react";
import { CHECKOUT_CONFIRMATION_KEY, type ConfirmedOrder } from "../../../lib/checkout";

const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<ConfirmedOrder | null>(null);

  useEffect(() => {
    const stored = window.sessionStorage.getItem(CHECKOUT_CONFIRMATION_KEY);
    if (!stored) return;
    try {
      setOrder(JSON.parse(stored) as ConfirmedOrder);
    } catch {
      window.sessionStorage.removeItem(CHECKOUT_CONFIRMATION_KEY);
    }
  }, []);

  const recipient = order?.customerName ? `Merci ${order.customerName},` : "Merci,";
  return <main className="order-confirmation">
    <header className="confirmation-header"><a href="/" className="wordmark">Kimea<span>·</span></a><span>Commande confirmée</span></header>
    <section className="confirmation-hero">
      <p className="eyebrow">{recipient}</p>
      <div className="confirmation-check" aria-hidden="true">✓</div>
      <h1>Votre beauté<br/><em>arrive bientôt.</em></h1>
      <p className="confirmation-copy">Votre commande de démonstration est confirmée. {order?.email ? `Un récapitulatif a été préparé pour ${order.email}.` : "Vous recevrez les détails de l’envoi par e-mail."}</p>
      <p className="order-number">Commande <strong>#{order?.orderNumber ?? "KME-08432"}</strong>{order ? <span> · {euro.format(order.total)}</span> : null}</p>
      <div className="confirmation-actions"><a href="/shop" className="button button-dark">Continuer mes achats <span>→</span></a><a href="/" className="text-link">Retour à l’accueil <span>↗</span></a></div>
    </section>
    <section className="confirmation-details" aria-label="Détails de commande">
      <article><span>01</span><h2>Confirmation préparée</h2><p>Votre récapitulatif est prêt. Le paiement était une simulation : aucun montant n’a été débité.</p></article>
      <article><span>02</span><h2>Préparation avec soin</h2><p>Votre sélection est habituellement préparée dans notre atelier sous 1 à 2 jours ouvrés.</p></article>
      <article><span>03</span><h2>Suivi de livraison</h2><p>Vous recevrez votre lien de suivi dès que votre colis quittera notre atelier.</p></article>
    </section>
    <footer className="confirmation-footer">Kimea Beauty · Livraison & retours · Besoin d’aide ? Contactez-nous</footer>
  </main>;
}
