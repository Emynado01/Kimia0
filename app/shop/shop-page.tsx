"use client";

import { useEffect, useMemo, useState } from "react";
import { products, type ProductCategory } from "../../lib/catalog";

const categories: Array<"Tout" | ProductCategory> = ["Tout", "Teint", "Joues", "Soin"];
const euro = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export function ShopPage() {
  const [category, setCategory] = useState<(typeof categories)[number]>("Tout");
  const [catalogue, setCatalogue] = useState(products);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("featured");
  const [liked, setLiked] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  useEffect(() => { fetch("/api/products").then((response) => response.ok ? response.json() : null).then((data) => { if (Array.isArray(data) && data.length) setCatalogue(data); }).catch(() => undefined); }, []);
  const visible = useMemo(() => catalogue
    .filter((product) => (category === "Tout" || product.category === category) && `${product.name} ${product.kind}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => sort === "low" ? a.price - b.price : sort === "high" ? b.price - a.price : a.name.localeCompare(b.name)), [catalogue, category, query, sort]);

  return <main className="shop-all">
    <div className="shop-promo">Livraison offerte dès 50 € <span>·</span> Retours simples sous 30 jours</div>
    <header className="shop-header"><a className="shop-menu" href="/" aria-label="Retour à l'accueil">←</a><a href="/" className="shop-logo">KiMiA</a><div className="shop-tools"><label><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Rechercher" aria-label="Rechercher"/></label><button aria-label="Compte client">◯</button><button aria-label="Sac">Sac <b>0</b></button></div></header>
    <nav className="shop-categories" aria-label="Catégories"><a href="/shop" className="ai-pill">✦ Trouver ma teinte</a>{categories.map((item) => <button key={item} className={category === item ? "selected" : ""} onClick={() => setCategory(item)}>{item === "Tout" ? "Shop all" : item}</button>)}</nav>
    <section className="shop-intro"><p className="eyebrow">La collection KiMiA</p><h1>Shop all</h1><p>Des essentiels de couleur et de soin, créés pour jouer, mélanger et rayonner à votre façon.</p></section>
    <div className="shop-controls"><p><b>{visible.length}</b> produits</p><div><button onClick={() => setFilterOpen((open) => !open)} className={filterOpen ? "control-active" : ""}>Filtres <span>☷</span></button><label>Tri<select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Trier les produits"><option value="featured">En vedette</option><option value="low">Prix croissant</option><option value="high">Prix décroissant</option></select></label></div></div>
    {filterOpen && <section className="filter-panel" aria-label="Filtres"><div><span>Catégorie</span>{categories.map((item) => <button className={category === item ? "checked" : ""} key={item} onClick={() => setCategory(item)}>{item === "Tout" ? "Tous les produits" : item}</button>)}</div><div><span>Disponibilité</span><button className="checked">En stock</button></div><button className="filter-close" onClick={() => setFilterOpen(false)}>Voir les produits →</button></section>}
    <section className="shop-grid">{visible.map((product) => <article className="shop-product" key={product.id}><div className="shop-product-image"><img src={product.image} alt={product.name}/>{product.badge && <span>{product.badge}</span>}<button className={liked.includes(product.id) ? "heart saved" : "heart"} onClick={() => setLiked((items) => items.includes(product.id) ? items.filter((id) => id !== product.id) : [...items, product.id])} aria-label={`Ajouter ${product.name} aux favoris`}>{liked.includes(product.id) ? "♥" : "♡"}</button></div><div className="shop-product-info"><h2>{product.name}</h2><p className="shop-stars">★★★★★</p><p>{product.kind}</p><strong>{euro.format(product.price)}</strong><button className="shop-buy">Ajouter au sac</button></div></article>)}</section>
    {visible.length === 0 && <div className="shop-empty"><h2>Aucun produit trouvé.</h2><button onClick={() => { setCategory("Tout"); setQuery(""); }}>Voir tous les produits</button></div>}
    <section className="shop-newsletter"><p className="eyebrow">La liste KiMiA</p><h2>Les bonnes nouvelles<br/>vous iront bien.</h2><form onSubmit={(event) => event.preventDefault()}><input type="email" placeholder="Votre e-mail" aria-label="Votre e-mail"/><button>S'inscrire →</button></form></section>
  </main>;
}
