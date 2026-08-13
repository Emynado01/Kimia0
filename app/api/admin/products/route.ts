import { NextResponse } from "next/server";
import { getNeonSql } from "../../../../db";
import { getAdminSession } from "../../../../lib/admin-auth";

type VariantInput = { title?: unknown; sku?: unknown; price?: unknown; stock?: unknown };
type ProductInput = {
  name?: unknown; description?: unknown; category?: unknown; collection?: unknown; tags?: unknown; price?: unknown; salePrice?: unknown; cost?: unknown;
  sku?: unknown; stock?: unknown; lowStockThreshold?: unknown; imageUrl?: unknown; galleryUrls?: unknown; variants?: unknown; status?: unknown;
};

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const number = (value: unknown) => typeof value === "number" ? value : Number(value);

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const input = await request.json().catch(() => null) as ProductInput | null;
  const name = text(input?.name); const description = text(input?.description); const category = text(input?.category);
  const collection = text(input?.collection); const sku = text(input?.sku).toUpperCase(); const imageUrl = text(input?.imageUrl);
  const price = number(input?.price); const salePrice = input?.salePrice === undefined || input?.salePrice === "" ? null : number(input.salePrice);
  const cost = input?.cost === undefined || input?.cost === "" ? null : number(input.cost); const stock = number(input?.stock);
  const lowStockThreshold = number(input?.lowStockThreshold); const status = input?.status === "DRAFT" ? "DRAFT" : "PUBLISHED";
  const tags = Array.isArray(input?.tags) ? input.tags.filter((tag): tag is string => typeof tag === "string").map((tag) => tag.trim()).filter(Boolean).slice(0, 18) : [];
  const galleryUrls = Array.isArray(input?.galleryUrls) ? input.galleryUrls.filter((url): url is string => typeof url === "string" && isAllowedImageUrl(url)).slice(0, 6) : [];
  const variants = parseVariants(input?.variants);
  const effectivePrice = salePrice !== null && Number.isFinite(salePrice) && salePrice >= 0 && salePrice < price ? salePrice : price;
  const compareAtPrice = effectivePrice !== price ? price : null;
  if (!name || name.length > 140 || !category || !sku || !imageUrl || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0 || !Number.isInteger(lowStockThreshold) || lowStockThreshold < 0 || (cost !== null && (!Number.isFinite(cost) || cost < 0)) || (salePrice !== null && (!Number.isFinite(salePrice) || salePrice < 0)) || !isAllowedImageUrl(imageUrl)) {
    return NextResponse.json({ error: "Vérifiez les informations générales, le prix, le stock et l’image principale." }, { status: 400 });
  }
  if (!variants.ok) return NextResponse.json({ error: variants.error }, { status: 400 });

  const productId = crypto.randomUUID(); const standardVariantId = crypto.randomUUID(); const slug = `${slugify(name)}-${productId.slice(0, 8)}`;
  const sql = getNeonSql();
  try {
    const categoryRows = await sql.query("SELECT id FROM categories WHERE slug = $1 OR name = $2 LIMIT 1", [slugify(category), category]) as Array<{ id: string }>;
    let categoryId = categoryRows[0]?.id;
    if (!categoryId) { categoryId = crypto.randomUUID(); await sql.query("INSERT INTO categories (id, name, slug, sort_order, is_published, created_at, updated_at) VALUES ($1, $2, $3, 99, true, now(), now())", [categoryId, category, slugify(category)]); }
    let collectionId: string | undefined;
    if (collection) {
      const collectionRows = await sql.query("SELECT id FROM collections WHERE slug = $1 OR name = $2 LIMIT 1", [slugify(collection), collection]) as Array<{ id: string }>;
      collectionId = collectionRows[0]?.id;
      if (!collectionId) { collectionId = crypto.randomUUID(); await sql.query("INSERT INTO collections (id, name, slug, is_published, created_at, updated_at) VALUES ($1, $2, $3, false, now(), now())", [collectionId, collection, `${slugify(collection)}-${collectionId.slice(0, 6)}`]); }
    }
    const variantRows = variants.values.map((variant) => ({ id: crypto.randomUUID(), ...variant }));
    const queries = [
      sql.query("INSERT INTO products (id, category_id, name, slug, description, status, featured, low_stock_threshold, tags_json, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, false, $7, $8::jsonb, now(), now())", [productId, categoryId, name, slug, description || null, status, lowStockThreshold, JSON.stringify(tags)]),
      sql.query("INSERT INTO product_variants (id, product_id, title, sku, price_cents, compare_at_price_cents, cost_cents, stock, created_at, updated_at) VALUES ($1, $2, 'Standard', $3, $4, $5, $6, $7, now(), now())", [standardVariantId, productId, sku, Math.round(effectivePrice * 100), compareAtPrice === null ? null : Math.round(compareAtPrice * 100), cost === null ? null : Math.round(cost * 100), stock]),
      sql.query("INSERT INTO product_images (id, product_id, url, alt_text, position, is_primary, created_at, updated_at) VALUES ($1, $2, $3, $4, 0, true, now(), now())", [crypto.randomUUID(), productId, imageUrl, name]),
      sql.query("INSERT INTO inventory_movements (id, variant_id, quantity, type, reason, actor_id, created_at) VALUES ($1, $2, $3, 'MANUAL', 'Création du produit', $4, now())", [crypto.randomUUID(), standardVariantId, stock, admin.userId]),
      sql.query("INSERT INTO audit_logs (id, actor_id, action, resource_type, resource_id, after_json, created_at) VALUES ($1, $2, 'PRODUCT_CREATED', 'product', $3, $4::jsonb, now())", [crypto.randomUUID(), admin.userId, productId, JSON.stringify({ name, sku, price, salePrice, cost, stock, lowStockThreshold, status, tags })]),
    ];
    if (collectionId) queries.push(sql.query("INSERT INTO collection_products (collection_id, product_id, sort_order) VALUES ($1, $2, 99) ON CONFLICT DO NOTHING", [collectionId, productId]));
    galleryUrls.forEach((url, index) => queries.push(sql.query("INSERT INTO product_images (id, product_id, url, alt_text, position, is_primary, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, false, now(), now())", [crypto.randomUUID(), productId, url, `${name} – image ${index + 2}`, index + 1])));
    variantRows.forEach((variant) => {
      queries.push(sql.query("INSERT INTO product_variants (id, product_id, title, sku, price_cents, stock, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, now(), now())", [variant.id, productId, variant.title, variant.sku, Math.round(variant.price * 100), variant.stock]));
      queries.push(sql.query("INSERT INTO inventory_movements (id, variant_id, quantity, type, reason, actor_id, created_at) VALUES ($1, $2, $3, 'MANUAL', 'Création de variante', $4, now())", [crypto.randomUUID(), variant.id, variant.stock, admin.userId]));
    });
    await sql.transaction(queries);
  } catch (error) {
    console.error("[admin/products]", error);
    return NextResponse.json({ error: "Impossible d’enregistrer ce produit. Le SKU ou le nom de catégorie existe peut-être déjà." }, { status: 409 });
  }
  return NextResponse.json({ id: productId, slug }, { status: 201 });
}

function parseVariants(value: unknown): { ok: true; values: Array<{ title: string; sku: string; price: number; stock: number }> } | { ok: false; error: string } {
  if (!Array.isArray(value)) return { ok: true, values: [] };
  const parsed = value.map((row) => ({ title: text((row as VariantInput)?.title), sku: text((row as VariantInput)?.sku).toUpperCase(), price: number((row as VariantInput)?.price), stock: number((row as VariantInput)?.stock) }));
  if (parsed.length > 12 || parsed.some((variant) => !variant.title || !variant.sku || !Number.isFinite(variant.price) || variant.price < 0 || !Number.isInteger(variant.stock) || variant.stock < 0)) return { ok: false, error: "Chaque variante doit avoir un nom, un SKU, un prix et un stock valides." };
  return { ok: true, values: parsed };
}
function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "produit"; }
function isAllowedImageUrl(value: string) { if (value.startsWith("/")) return true; try { return new URL(value).protocol === "https:"; } catch { return false; } }
