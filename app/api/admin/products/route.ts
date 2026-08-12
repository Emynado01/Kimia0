import { NextResponse } from "next/server";
import { getRawDb } from "../../../../db";
import { getAdminSession } from "../../../../lib/admin-auth";

type ProductInput = { name?: unknown; description?: unknown; category?: unknown; price?: unknown; sku?: unknown; stock?: unknown; imageUrl?: unknown; status?: unknown };

export async function POST(request: Request) {
  const admin = await getAdminSession();
  if (!admin) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const input = await request.json().catch(() => null) as ProductInput | null;
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const description = typeof input?.description === "string" ? input.description.trim() : "";
  const category = typeof input?.category === "string" ? input.category.trim() : "";
  const sku = typeof input?.sku === "string" ? input.sku.trim().toUpperCase() : "";
  const imageUrl = typeof input?.imageUrl === "string" ? input.imageUrl.trim() : "";
  const price = typeof input?.price === "number" ? input.price : Number(input?.price);
  const stock = typeof input?.stock === "number" ? input.stock : Number(input?.stock);
  const status = input?.status === "DRAFT" ? "DRAFT" : "PUBLISHED";
  if (!name || name.length > 140 || !category || !sku || !imageUrl || !Number.isFinite(price) || price < 0 || !Number.isInteger(stock) || stock < 0) return NextResponse.json({ error: "Vérifiez le nom, la catégorie, le SKU, le prix, le stock et l'URL de l'image." }, { status: 400 });
  if (!isAllowedImageUrl(imageUrl)) return NextResponse.json({ error: "L'image doit être une URL HTTPS Cloudflare R2/S3 ou un chemin public commençant par /." }, { status: 400 });
  const now = Date.now();
  const productId = crypto.randomUUID(); const variantId = crypto.randomUUID(); const imageId = crypto.randomUUID(); const movementId = crypto.randomUUID(); const auditId = crypto.randomUUID();
  const slugBase = slugify(name); const slug = `${slugBase}-${productId.slice(0, 8)}`;
  const db = getRawDb();
  const categoryRecord = await db.prepare("SELECT id FROM categories WHERE slug = ? OR name = ? LIMIT 1").bind(slugify(category), category).first<{ id: string }>();
  let categoryId = categoryRecord?.id;
  const statements: D1PreparedStatement[] = [];
  if (!categoryId) { categoryId = crypto.randomUUID(); statements.push(db.prepare("INSERT INTO categories (id, name, slug, sort_order, is_published, created_at, updated_at) VALUES (?, ?, ?, 99, 1, ?, ?)").bind(categoryId, category, slugify(category), now, now)); }
  statements.push(
    db.prepare("INSERT INTO products (id, category_id, name, slug, description, status, featured, low_stock_threshold, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 0, 8, ?, ?)").bind(productId, categoryId, name, slug, description || null, status, now, now),
    db.prepare("INSERT INTO product_variants (id, product_id, title, sku, price_cents, stock, created_at, updated_at) VALUES (?, ?, 'Standard', ?, ?, ?, ?, ?)").bind(variantId, productId, sku, Math.round(price * 100), stock, now, now),
    db.prepare("INSERT INTO product_images (id, product_id, url, alt_text, position, is_primary, created_at, updated_at) VALUES (?, ?, ?, ?, 0, 1, ?, ?)").bind(imageId, productId, imageUrl, name, now, now),
    db.prepare("INSERT INTO inventory_movements (id, variant_id, quantity, type, reason, actor_id, created_at) VALUES (?, ?, ?, 'MANUAL', 'Création du produit', ?, ?)").bind(movementId, variantId, stock, admin.userId, now),
    db.prepare("INSERT INTO audit_logs (id, actor_id, action, resource_type, resource_id, after_json, created_at) VALUES (?, ?, 'PRODUCT_CREATED', 'product', ?, ?, ?)").bind(auditId, admin.userId, productId, JSON.stringify({ name, sku, price, stock, status }), now),
  );
  try { await db.batch(statements); } catch { return NextResponse.json({ error: "Impossible d'enregistrer ce produit. Le SKU existe peut-être déjà." }, { status: 409 }); }
  return NextResponse.json({ id: productId, slug }, { status: 201 });
}

function slugify(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "produit"; }
function isAllowedImageUrl(value: string) { if (value.startsWith("/")) return true; try { return new URL(value).protocol === "https:"; } catch { return false; } }
