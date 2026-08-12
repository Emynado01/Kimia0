import { NextResponse } from "next/server";
import { getNeonSql } from "../../../db";

type ProductRow = { id: string; name: string; description: string | null; category: string | null; price_cents: number; variant_title: string; image_url: string | null; badge: string | null };

export async function GET() {
  const results = await getNeonSql().query("SELECT p.id, p.name, p.description, c.name AS category, v.price_cents, v.title AS variant_title, i.url AS image_url, CASE WHEN p.featured THEN 'Best-seller' ELSE NULL END AS badge FROM products p INNER JOIN product_variants v ON v.product_id = p.id LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN product_images i ON i.product_id = p.id AND i.is_primary = true WHERE p.status = 'PUBLISHED' ORDER BY p.featured DESC, p.created_at DESC") as ProductRow[];
  return NextResponse.json(results.map((product) => ({ id: product.id, name: product.name, kind: product.category ? `${product.category} · ${product.variant_title}` : product.variant_title, category: product.category ?? "Soin", price: product.price_cents / 100, shade: product.variant_title, image: product.image_url ?? "/img01.jpeg", badge: product.badge, description: product.description ?? "" })));
}
