"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { products, type Product } from "../lib/catalog";
import { CHECKOUT_DRAFT_KEY, createCheckoutDraft } from "../lib/checkout";


const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
const editorialSlides = [
  { image: "/sec01.png", label: "01", eyebrow: "Teint", title: "La lumière,\nà votre mesure.", copy: "Une chaleur modulable, pensée pour chaque nuance de peau." },
  { image: "/sec02.png", label: "02", eyebrow: "Couleur", title: "Osez le\npoint de lumière.", copy: "Des pigments vivants pour jouer avec les détails qui vous ressemblent." },
  { image: "/sec03.jpg", label: "03", eyebrow: "Expression", title: "Votre beauté\nprend la parole.", copy: "Des essentiels qui accompagnent votre allure, jamais l’inverse." },
];

export function Storefront() {
  const router = useRouter();
  const [cart, setCart] = useState<Product[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [query, setQuery] = useState("");
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [promoVisible, setPromoVisible] = useState(true);
  const [editorialIndex, setEditorialIndex] = useState(0);
  const shownProducts = useMemo(() => products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()) || p.kind.toLowerCase().includes(query.toLowerCase())), [query]);
  const subtotal = cart.reduce((sum, product) => sum + product.price, 0);
  const add = (product: Product) => { setCart((items) => [...items, product]); setDrawer(true); setActiveProduct(null); };
  const remove = (index: number) => setCart((items) => items.filter((_, itemIndex) => itemIndex !== index));
  const completeOrder = () => { window.sessionStorage.setItem(CHECKOUT_DRAFT_KEY, JSON.stringify(createCheckoutDraft(cart))); setDrawer(false); router.push("/checkout"); };
  useEffect(() => {
    const timer = window.setInterval(() => setEditorialIndex((index) => (index + 1) % editorialSlides.length), 5500);
    return () => window.clearInterval(timer);
  }, []);
  const editorial = editorialSlides[editorialIndex];

  return <main>
    <div className="announcement">Livraison offerte dès 75 € <span>—</span> Échantillon signature dans chaque commande</div>
    <header className="site-header">
      <a className="wordmark" href="#top" aria-label="Kimea, accueil">Kimea<span>·</span></a>
      <nav aria-label="Navigation principale"><a href="/shop">Shop all</a><a href="#nouveautes">Nouveautés</a><a href="#rituels">Rituels</a><a href="#maison">La maison</a></nav>
      <div className="header-actions"><label className="search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher" aria-label="Rechercher un produit" /></label><a href="/admin" className="admin-link">Espace pro</a><button className="bag" onClick={() => setDrawer(true)} aria-label="Ouvrir le panier">Sac <b>{cart.length}</b></button></div>
    </header>

    <section id="top" className="hero">
      <div className="hero-copy"><p className="eyebrow">L'allure Kimea</p><h1>La beauté<br/><em>vous appartient.</em></h1><p className="hero-text">Des couleurs pensées pour révéler votre lumière, avec assurance et intention.</p><a href="#nouveautes" className="button button-dark">Découvrir la collection <span>↗</span></a></div>
      <div className="hero-visual"><div className="sun-disc"></div><div className="hero-image"></div><p className="vertical-note">COULEUR · SOIN · CONFIANCE</p><p className="hero-caption">Kimea<br/><span>beauty essentials</span></p></div>
    </section>

    <section id="nouveautes" className="products-section"><div className="section-head"><div><p className="eyebrow">À découvrir</p><h2>Les essentiels<br/>du moment.</h2></div><a href="/shop">Voir tout <span>→</span></a></div><div className="product-grid" id="catalogue">{shownProducts.map((product) => <article className="product-card" key={product.id}><button className="product-image" onClick={() => setActiveProduct(product)}><img src={product.image} alt={product.name}/>{product.badge && <span className="badge">{product.badge}</span>}<span className="quick">Voir le produit</span></button><div className="product-details"><div><h3>{product.name}</h3><p>{product.kind}</p></div><button onClick={() => add(product)} aria-label={`Ajouter ${product.name} au panier`}>+</button></div><div className="product-price"><span className="swatch" style={{background: product.id === "prd_spf" ? "#5b2193" : product.id === "prd_cheeksy" ? "#e66d98" : product.id === "prd_moist" ? "#00aee1" : "#8d563d"}}></span>{product.shade}<strong>{euro.format(product.price)}</strong></div></article>)}</div>{shownProducts.length === 0 && <p className="empty">Aucun produit ne correspond à cette recherche.</p>}</section>

    <section id="rituels" className="ritual"><div className="ritual-image"></div><div className="ritual-copy"><p className="eyebrow">Notre approche</p><h2>La beauté n'est<br/>jamais un excès.</h2><p>Elle est une attention. Une matière choisie, un parfum qui reste, une formule qui fait de la place à votre peau.</p><a href="#maison" className="text-link">Notre manifeste <span>↗</span></a></div></section>

    <section className="journal-carousel" id="maison" aria-label="Le journal Kimea"><div className="journal-stage"><div className="journal-stage-image" aria-live="polite"><img key={editorial.image} src={editorial.image} alt=""/></div><button className="journal-stage-copy" onClick={() => setEditorialIndex((index) => (index + 1) % editorialSlides.length)} aria-label="Afficher l’image suivante"><p className="eyebrow">Le journal Kimea · {editorial.eyebrow}</p><span className="journal-number">{editorial.label} / 03</span><h2>{editorial.title.split("\n").map((line) => <span key={line}>{line}<br/></span>)}</h2><p>{editorial.copy}</p><span className="journal-next">Voir la suite <b>→</b></span></button></div><div className="journal-thumbnails" aria-label="Choisir une image">{editorialSlides.map((slide, index) => <button key={slide.image} className={index === editorialIndex ? "selected" : ""} onClick={() => setEditorialIndex(index)} aria-label={`Voir l’image ${index + 1}`} aria-current={index === editorialIndex ? "true" : undefined}><img src={slide.image} alt=""/><span>{slide.label}</span></button>)}</div></section>
    <footer id="newsletter"><div className="footer-top"><a className="wordmark" href="#top">Kimea<span>·</span></a><div><h3>Un peu de lumière<br/>dans votre boîte mail.</h3><form onSubmit={(event) => event.preventDefault()}><input type="email" required placeholder="Votre adresse e-mail" aria-label="Votre adresse e-mail"/><button aria-label="S'inscrire">→</button></form></div></div><div className="footer-bottom"><span>© 2026 Kimea Beauty</span><span>Livraison & retours · Conditions · Confidentialité</span><span>France / EUR</span></div></footer>

    {activeProduct && <div className="modal-backdrop" role="presentation" onMouseDown={() => setActiveProduct(null)}><section className="product-modal" role="dialog" aria-modal="true" aria-label={activeProduct.name} onMouseDown={(event) => event.stopPropagation()}><button className="close" onClick={() => setActiveProduct(null)} aria-label="Fermer">×</button><img src={activeProduct.image} alt={activeProduct.name}/><div><p className="eyebrow">{activeProduct.kind}</p><h2>{activeProduct.name}</h2><p>{activeProduct.description}</p><p className="modal-price">{euro.format(activeProduct.price)}</p><div className="variant"><span>Teinte</span><button>{activeProduct.shade}</button></div><button className="button button-dark wide" onClick={() => add(activeProduct)}>Ajouter au sac <span>→</span></button></div></section></div>}
    {promoVisible && <div className="promo-backdrop" role="presentation" onMouseDown={() => setPromoVisible(false)}><section className="promo-modal" role="dialog" aria-modal="true" aria-labelledby="promo-title" onMouseDown={(event) => event.stopPropagation()}><button className="close promo-close" onClick={() => setPromoVisible(false)} aria-label="Fermer l’offre">×</button><div className="promo-image"><img src={products[1].image} alt={products[1].name}/><span>Édition du moment</span></div><div className="promo-copy"><p className="eyebrow">Bienvenue chez Kimea</p><h2 id="promo-title">-15 % sur votre<br/><em>première lumière.</em></h2><p>Découvrez la Palette Cheeksy N°02 et profitez de votre première touche de couleur avec le code <strong>KIMEA15</strong>.</p><button className="button button-dark wide" onClick={() => { add(products[1]); setPromoVisible(false); }}>Ajouter l’offre <span>→</span></button><button className="promo-dismiss" onClick={() => setPromoVisible(false)}>Continuer sans l’offre</button></div></section></div>}
    {drawer && <aside className="cart-drawer" aria-label="Votre sac"><div className="cart-header"><h2>Votre sac <span>({cart.length})</span></h2><button className="close" onClick={() => setDrawer(false)} aria-label="Fermer le panier">×</button></div>{cart.length ? <><div className="cart-lines">{cart.map((product, index) => <div className="cart-line" key={`${product.id}-${index}`}><img src={product.image} alt=""/><div><h3>{product.name}</h3><p>{product.shade}</p><strong>{euro.format(product.price)}</strong></div><button onClick={() => remove(index)} aria-label={`Retirer ${product.name}`}>×</button></div>)}</div><div className="cart-total"><p><span>Sous-total</span><strong>{euro.format(subtotal)}</strong></p><small>Livraison et taxes calculées à l'étape suivante.</small><button className="button button-dark wide" onClick={completeOrder}>Passer la commande <span>→</span></button></div></> : <div className="cart-empty"><p>Votre sac est encore vide.</p><button className="text-link" onClick={() => setDrawer(false)}>Découvrir la collection <span>→</span></button></div>}</aside>}
    {drawer && <button className="drawer-backdrop" onClick={() => setDrawer(false)} aria-label="Fermer le panier"></button>}
  </main>;
}
