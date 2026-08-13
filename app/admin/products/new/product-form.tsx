"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type VariantDraft = { title: string; sku: string; price: string; stock: string };
const emptyVariant = (): VariantDraft => ({ title: "", sku: "", price: "", stock: "" });

export function NewProductForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [gallery, setGallery] = useState<File[]>([]);
  const [preview, setPreview] = useState("");
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [variants, setVariants] = useState<VariantDraft[]>([]);
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const margin = useMemo(() => {
    const salePrice = Number(price); const purchaseCost = Number(cost);
    return Number.isFinite(salePrice) && salePrice > 0 && Number.isFinite(purchaseCost) && purchaseCost >= 0 ? Math.round(((salePrice - purchaseCost) / salePrice) * 100) : null;
  }, [cost, price]);

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setImage(file); setPreview(file ? URL.createObjectURL(file) : "");
  }
  function selectGallery(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 6);
    setGallery(files); setGalleryPreviews(files.map((file) => URL.createObjectURL(file)));
  }
  function updateVariant(index: number, field: keyof VariantDraft, value: string) {
    setVariants((current) => current.map((variant, row) => row === index ? { ...variant, [field]: value } : variant));
  }
  async function upload(file: File) {
    const payload = new FormData(); payload.set("image", file);
    const response = await fetch("/api/admin/uploads", { method: "POST", body: payload });
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.url) throw new Error(body?.error ?? "Impossible d’ajouter une photo.");
    return body.url as string;
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!image) { setMessage("Ajoutez une image principale."); return; }
    setMessage(""); setSaving(true);
    try {
      const form = new FormData(event.currentTarget);
      const [imageUrl, galleryUrls] = await Promise.all([upload(image), Promise.all(gallery.map(upload))]);
      const optionalVariants = variants.filter((variant) => variant.title || variant.sku || variant.price || variant.stock).map((variant) => ({ ...variant, price: Number(variant.price), stock: Number(variant.stock) }));
      if (optionalVariants.some((variant) => !variant.title || !variant.sku || !Number.isFinite(variant.price) || variant.price < 0 || !Number.isInteger(variant.stock) || variant.stock < 0)) throw new Error("Complétez chaque variante ou retirez la ligne incomplète.");
      const payload = {
        ...Object.fromEntries(form),
        price: Number(form.get("price")), salePrice: form.get("salePrice") ? Number(form.get("salePrice")) : undefined,
        cost: form.get("cost") ? Number(form.get("cost")) : undefined,
        stock: Number(form.get("stock")), lowStockThreshold: Number(form.get("lowStockThreshold")),
        tags: String(form.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean),
        imageUrl, galleryUrls, variants: optionalVariants,
      };
      const response = await fetch("/api/admin/products", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error ?? "Enregistrement impossible.");
      router.push("/admin?section=products"); router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Enregistrement impossible."); }
    finally { setSaving(false); }
  }

  return <section className="product-form-wrap"><div><p className="eyebrow">Catalogue Simire</p><h1>Ajouter un produit</h1><p>Créez une fiche complète, avec ses images, son prix de vente et ses informations de stock. Les photos sont envoyées vers votre stockage Cloudflare R2/S3.</p><div className="product-form-note"><b>Bon à savoir</b><span>Vous pouvez commencer en brouillon, puis publier l’article depuis le catalogue.</span></div></div><form onSubmit={submit} className="product-form product-form-rich">
    <fieldset className="form-span"><legend>Informations générales</legend><div className="form-columns"><label>Nom du produit<input name="name" required maxLength={140} placeholder="Ex. Blush crème Sun Kiss" /></label><label>Catégorie<input name="category" required list="categories" placeholder="Teint, Joues, Soin…" /><datalist id="categories"><option value="Teint"/><option value="Joues"/><option value="Soin"/><option value="Lèvres"/><option value="Yeux"/></datalist></label><label>Collection <small>Optionnel</small><input name="collection" placeholder="Ex. Nouveautés été" /></label><label>Statut<select name="status"><option value="DRAFT">Brouillon</option><option value="PUBLISHED">Publié</option></select></label></div><label>Tags <small>Séparés par une virgule</small><input name="tags" placeholder="lumineux, vegan, nouvelle teinte" /></label><label>Description<textarea name="description" rows={5} placeholder="Texture, bénéfices, résultat sur la peau et conseils d’application." /></label></fieldset>
    <fieldset className="form-span"><legend>Images</legend><label className="photo-upload">Image principale<input required type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} /><span>{image ? image.name : "Choisir l’image principale"}</span>{preview && <img src={preview} alt="Aperçu de l’image principale" />}</label><label className="photo-upload gallery-upload">Galerie <small>Jusqu’à 6 images, optionnel</small><input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={selectGallery} /><span>Ajouter des images secondaires</span>{galleryPreviews.length > 0 && <div className="gallery-previews">{galleryPreviews.map((url) => <img key={url} src={url} alt="Aperçu de galerie" />)}</div>}</label></fieldset>
    <fieldset className="form-span"><legend>Prix & rentabilité</legend><div className="form-columns"><label>Prix de vente (€)<input name="price" required value={price} onChange={(event) => setPrice(event.target.value)} type="number" min="0" step="0.01" placeholder="29,00" /></label><label>Prix promotionnel (€) <small>Optionnel</small><input name="salePrice" type="number" min="0" step="0.01" placeholder="24,00" /></label><label>Coût d’achat (€) <small>Optionnel</small><input name="cost" value={cost} onChange={(event) => setCost(event.target.value)} type="number" min="0" step="0.01" placeholder="9,50" /></label><div className="margin-panel"><small>Marge brute estimée</small><b>{margin === null ? "—" : `${margin} %`}</b><span>Calculée avant frais et taxes.</span></div></div></fieldset>
    <fieldset className="form-span"><legend>Stock & référence</legend><div className="form-columns"><label>SKU<input name="sku" required pattern="[A-Za-z0-9_-]+" placeholder="KIM-BLUSH-001" /></label><label>Stock initial<input name="stock" required type="number" min="0" step="1" placeholder="30" /></label><label>Seuil d’alerte<input name="lowStockThreshold" required defaultValue="8" type="number" min="0" step="1" /></label></div></fieldset>
    <fieldset className="form-span variants-fieldset"><legend>Variantes <small>Optionnel</small></legend><p>Ajoutez par exemple les teintes ou formats. Chaque variante possède son SKU, son prix et son stock.</p>{variants.map((variant, index) => <div className="variant-row" key={index}><input value={variant.title} onChange={(event) => updateVariant(index, "title", event.target.value)} placeholder="Nom / teinte" /><input value={variant.sku} onChange={(event) => updateVariant(index, "sku", event.target.value)} placeholder="SKU" /><input value={variant.price} onChange={(event) => updateVariant(index, "price", event.target.value)} type="number" min="0" step="0.01" placeholder="Prix" /><input value={variant.stock} onChange={(event) => updateVariant(index, "stock", event.target.value)} type="number" min="0" step="1" placeholder="Stock" /><button type="button" aria-label="Retirer la variante" onClick={() => setVariants((current) => current.filter((_, row) => row !== index))}>×</button></div>)}<button type="button" className="add-variant" onClick={() => setVariants((current) => [...current, emptyVariant()])}>+ Ajouter une variante</button></fieldset>
    {message && <p className="form-message form-span" role="alert">{message}</p>}<button disabled={saving} className="button button-dark form-span">{saving ? "Enregistrement…" : "Créer l’article"} <span>→</span></button>
  </form></section>;
}
