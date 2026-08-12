import { NextResponse } from "next/server";
import { getNeonSql } from "../../../../db";
import { getAdminSession } from "../../../../lib/admin-auth";

type ProductInput = { name?: unknown; description?: unknown; category?: unknown; price?: unknown; sku?: unknown; stock?: unknown; imageUrl?: unknown; status?: unknown };

export async function POST(request: Request) {
  const admin = await getAdminSession(); if (!admin) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const input = await request.json().catch(() => null) as ProductInput | null;
  const name = typeof input?.name === "string" ? input.name.trim() : ""; const description = typeof input?.description === "string" ? input.description.trim() : ""; const category = typeof input?.category === "string" ? input.category.trim() : ""; const sku = typeof input?.sku === "string" ? input.sku.trim().toUpperCase() : ""; const imageUrl = typeof input?.imageUrl === "string" ? input.imageUrl.trim() : "";
  const price = typeof input?.price === "number" ? input.price : Number(input?.price); const stock = typeof input?.stock === "number" ? input.stock : Number(input?.stock); const status = input?.status === "DRAFT" ? "DRAFT" : "PUBLISHED";
  if (!name || name.length > 140 || !category || !sku || !imageUrl || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) return NextResponse.json({ error: "Vérifiez le nom, la catégorie, le SKU, le prix, le stock et l'URL de l'image." }, { status: 400 });
  if (!isAllowedImageUrl(imageUrl)) return NextResponse.json({ error: "L'image doit être une URL HTTPS Cloudflare R2/S3 ou un chemin public commençant par /." }, { status: 400 });
  const productId = crypto.randomUUID(); const variantId = crypto.randomUUID(); const imageId = crypto.randomUUID(); const movementId = crypto.randomUUID(); const auditId = crypto.randomUUID(); const slug = `${slugify(name)}-${productId.slice(0, 8)}`; const sql = getNeonSql();
  try {
    const categories = await sql.query("SELECT id FROM categories WHERE slug = $1 OR name = $2 LIMIT 1", [slugify(category), category]) as Array<{ id: string }>; let categoryId = categories[0]?.id;
    if (!categoryId) { categoryId = crypto.randomUUID(); await sql.query("INSERT INTO categories (id, name, slug, sort_order, is_published, created_at, updated_at) VALUES ($1, $2, $3, 99, true, now(), now())", [categoryId, category, slugify(category)]); }
    await sql.transaction([
      sql.query("INSERT INTO products (id, category_id, name, slug, description, status, featured, low_stock_threshold, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, false, 8, now(), now())", [productId, categoryId, name, slug, description || null, status]),
      sql.query("INSERT INTO product_variants (id, product_id, title, sku, price_cents, stock, created_at, updated_at) VALUES ($1, $2, 'Standard', $3, $4, $5, now(), now())", [variantId, productId, sku, Math.round(price * 100), stock]),
      sql.query("INSERT INTO product_images (id, product_id, url, alt_text, position, is_primary, created_at, updated_at) VALUES ($1, $2, $3, $4, 0, true, now(), now())", [imageId, productId, imageUrl, name]),
      sql.query("INSERT INTO inventory_movements (id, variant_id, quantity, type, reason, actor_id, created_at) VALUES ($1, $2, $3, 'MANUAL', 'Création du produit', $4, now())", [movementId, variantId, stock, admin.userId]),
      sql.query("INSERT INTO audit_logs (id, actor_id, action, resource_type, resource_id, after_json, created_at) VALUES ($1, $2, 'PRODUCT_CREATED', 'product', $3, $4, now())", [auditId, admin.userId, productId, JSON.stringify({ name, sku, price, stock, status })]),
    ]);
  } catch { return NextResponse.json({ error: "Impossible d'enregistrer ce produit. Le SKU existe peut-être déjà." }, { status: 409 }); }
  return NextResponse.json({ id: productId, slug }, { status: 201 });
}
function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "produit"; }
function isAllowedImageUrl(value: string) { if (value.startsWith("/")) return true; try { return new URL(value).protocol === "https:"; } catch { return false; } }
