export default function OrderConfirmationPage() {
  return <main className="order-confirmation">
    <header className="confirmation-header"><a href="/" className="wordmark">KiMiA<span>·</span></a><span>Commande confirmée</span></header>
    <section className="confirmation-hero">
      <p className="eyebrow">Merci pour votre commande</p>
      <div className="confirmation-check" aria-hidden="true">✓</div>
      <h1>Votre beauté<br/><em>arrive bientôt.</em></h1>
      <p className="confirmation-copy">Nous avons bien reçu votre commande. Une confirmation avec les détails de l’envoi vient d’être envoyée à votre adresse e-mail.</p>
      <p className="order-number">Commande <strong>#KIM-08432</strong></p>
      <div className="confirmation-actions"><a href="/shop" className="button button-dark">Continuer mes achats <span>→</span></a><a href="/" className="text-link">Retour à l’accueil <span>↗</span></a></div>
    </section>
    <section className="confirmation-details" aria-label="Détails de commande">
      <article><span>01</span><h2>Confirmation envoyée</h2><p>Retrouvez le récapitulatif de votre commande dans votre boîte e-mail.</p></article>
      <article><span>02</span><h2>Préparation avec soin</h2><p>Votre sélection est préparée dans notre atelier sous 1 à 2 jours ouvrés.</p></article>
      <article><span>03</span><h2>Suivi de livraison</h2><p>Vous recevrez votre lien de suivi dès que votre colis quittera notre atelier.</p></article>
    </section>
    <footer className="confirmation-footer">KiMiA Beauty · Livraison & retours · Besoin d’aide ? Contactez-nous</footer>
  </main>;
}
