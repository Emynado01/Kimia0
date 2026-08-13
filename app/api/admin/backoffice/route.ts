import { NextResponse } from "next/server";
import { getNeonSql } from "../../../../db";
import { getAdminSession } from "../../../../lib/admin-auth";

type Row = Record<string, unknown>;
const euro = (cents: unknown) => Number(cents ?? 0) / 100;
const number = (value: unknown) => Number(value ?? 0);
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const allowedExpenseCategories = new Set(["marchandise", "transport", "marketing", "matériel", "abonnement", "salaire", "loyer", "services", "autres"]);

function startFor(period: string) {
  const now = new Date();
  const start = new Date(now);
  if (period === "today") start.setHours(0, 0, 0, 0);
  else if (period === "7") start.setDate(start.getDate() - 7);
  else if (period === "year") start.setFullYear(start.getFullYear() - 1);
  else if (period === "month") start.setMonth(start.getMonth() - 1);
  else start.setDate(start.getDate() - 30);
  return start;
}

function serializeProducts(rows: Row[]) {
  return rows.map((row) => ({
    id: String(row.id), name: String(row.name), description: String(row.description ?? ""), category: String(row.category ?? "Sans catégorie"),
    status: String(row.status), updatedAt: String(row.updated_at), image: String(row.image_url ?? "/img01.jpeg"),
    variantId: String(row.variant_id ?? ""), variant: String(row.variant_title ?? "Standard"), sku: String(row.sku ?? ""),
    price: euro(row.price_cents), cost: euro(row.cost_cents), compareAtPrice: row.compare_at_price_cents == null ? null : euro(row.compare_at_price_cents),
    stock: number(row.stock), lowStockThreshold: number(row.low_stock_threshold), unitsSold: number(row.units_sold),
    collections: Array.isArray(row.collections) ? row.collections : [], tags: Array.isArray(row.tags_json) ? row.tags_json : [],
    promotion: row.promo_id ? { id: String(row.promo_id), salePrice: row.sale_price_cents == null ? null : euro(row.sale_price_cents), percentOff: row.percent_off == null ? null : number(row.percent_off), startsAt: row.starts_at, endsAt: row.ends_at } : null,
  }));
}

function serializeOrders(rows: Row[]) {
  return rows.map((row) => ({
    id: String(row.id), number: String(row.order_number), customerId: row.user_id ? String(row.user_id) : null,
    customer: String(row.customer_name ?? String(row.email).split("@")[0]), email: String(row.email), status: String(row.status),
    paymentStatus: String(row.payment_status ?? "UNPAID"), total: euro(row.total_cents), subtotal: euro(row.subtotal_cents),
    shipping: euro(row.shipping_cents), taxes: euro(row.tax_cents), discount: euro(row.discount_cents), itemCount: number(row.item_count),
    createdAt: String(row.created_at), updatedAt: String(row.updated_at), address: row.shipping_address_json ?? null,
    trackingNumber: row.tracking_number ? String(row.tracking_number) : "", shippingMethod: row.shipping_method ? String(row.shipping_method) : "",
  }));
}

export async function GET(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const period = new URL(request.url).searchParams.get("period") ?? "30";
  const start = startFor(period);
  const sql = getNeonSql();
  try {
    const [productRows, orderRows, customerRows, expenseRows, movementRows, eventRows, noteRows, itemRows] = await Promise.all([
      sql.query(`SELECT p.id,p.name,p.description,p.status,p.updated_at,p.low_stock_threshold,p.tags_json,c.name AS category,
        v.id AS variant_id,v.title AS variant_title,v.sku,v.price_cents,v.compare_at_price_cents,v.cost_cents,v.stock,
        img.url AS image_url,COALESCE(sales.units_sold,0) AS units_sold,
        COALESCE(cols.collections,'[]'::json) AS collections,promo.id AS promo_id,promo.sale_price_cents,promo.percent_off,promo.starts_at,promo.ends_at
        FROM products p
        LEFT JOIN categories c ON c.id=p.category_id
        LEFT JOIN LATERAL (SELECT * FROM product_variants WHERE product_id=p.id ORDER BY created_at ASC LIMIT 1) v ON true
        LEFT JOIN LATERAL (SELECT url FROM product_images WHERE product_id=p.id AND is_primary=true LIMIT 1) img ON true
        LEFT JOIN LATERAL (SELECT COALESCE(SUM(oi.quantity),0)::int AS units_sold FROM order_items oi JOIN orders o ON o.id=oi.order_id WHERE oi.variant_id=v.id AND o.status NOT IN ('CANCELLED','REFUND_REQUESTED','REFUNDED')) sales ON true
        LEFT JOIN LATERAL (SELECT json_agg(co.name ORDER BY co.name) AS collections FROM collection_products cp JOIN collections co ON co.id=cp.collection_id WHERE cp.product_id=p.id) cols ON true
        LEFT JOIN LATERAL (SELECT * FROM product_promotions pp WHERE pp.product_id=p.id AND pp.is_active=true AND (pp.starts_at IS NULL OR pp.starts_at<=now()) AND (pp.ends_at IS NULL OR pp.ends_at>=now()) ORDER BY pp.created_at DESC LIMIT 1) promo ON true
        ORDER BY p.updated_at DESC`),
      sql.query(`SELECT o.*,COALESCE(u.name,split_part(o.email,'@',1)) AS customer_name,
        COALESCE(pay.status,'UNPAID') AS payment_status,COALESCE(items.item_count,0) AS item_count
        FROM orders o LEFT JOIN users u ON u.id=o.user_id
        LEFT JOIN LATERAL (SELECT status FROM payments WHERE order_id=o.id ORDER BY created_at DESC LIMIT 1) pay ON true
        LEFT JOIN LATERAL (SELECT COUNT(*)::int AS item_count FROM order_items WHERE order_id=o.id) items ON true
        ORDER BY o.created_at DESC LIMIT 250`),
      sql.query(`SELECT u.id,u.name,u.email,u.created_at,COUNT(o.id)::int AS order_count,COALESCE(SUM(o.total_cents),0)::int AS total_spent,MAX(o.created_at) AS last_order
        FROM users u LEFT JOIN orders o ON o.user_id=u.id WHERE u.role='CUSTOMER' GROUP BY u.id ORDER BY MAX(o.created_at) DESC NULLS LAST LIMIT 250`),
      sql.query("SELECT * FROM expenses ORDER BY incurred_at DESC LIMIT 250"),
      sql.query(`SELECT im.*,v.title AS variant,p.name AS product_name,v.sku FROM inventory_movements im JOIN product_variants v ON v.id=im.variant_id JOIN products p ON p.id=v.product_id ORDER BY im.created_at DESC LIMIT 250`),
      sql.query("SELECT * FROM order_events ORDER BY created_at DESC LIMIT 500"),
      sql.query("SELECT * FROM customer_notes ORDER BY created_at DESC LIMIT 500"),
      sql.query("SELECT order_id,title_snapshot,sku_snapshot,image_url_snapshot,unit_price_cents,quantity FROM order_items ORDER BY created_at ASC LIMIT 1000"),
    ]) as [Row[], Row[], Row[], Row[], Row[], Row[], Row[], Row[]];

    const products = serializeProducts(productRows); const orders = serializeOrders(orderRows);
    const expenses = expenseRows.map((row) => ({ id: String(row.id), category: String(row.category), description: String(row.description), amount: euro(row.amount_cents), supplier: String(row.supplier ?? ""), note: String(row.note ?? ""), incurredAt: String(row.incurred_at), receiptUrl: row.receipt_url ? String(row.receipt_url) : "" }));
    const customers = customerRows.map((row) => ({ id: String(row.id), name: String(row.name ?? "Client"), email: String(row.email), orderCount: number(row.order_count), totalSpent: euro(row.total_spent), lastOrder: row.last_order ? String(row.last_order) : null }));
    const movements = movementRows.map((row) => ({ id: String(row.id), product: String(row.product_name), variant: String(row.variant), sku: String(row.sku), quantity: number(row.quantity), type: String(row.type), reason: String(row.reason), createdAt: String(row.created_at) }));
    const events = eventRows.map((row) => ({ id: String(row.id), orderId: String(row.order_id), type: String(row.type), note: String(row.note ?? ""), createdAt: String(row.created_at), metadata: row.metadata_json ?? null }));
    const notes = noteRows.map((row) => ({ id: String(row.id), userId: String(row.user_id), body: String(row.body), createdAt: String(row.created_at) }));
    const orderItems = itemRows.map((row) => ({ orderId: String(row.order_id), title: String(row.title_snapshot), sku: String(row.sku_snapshot ?? ""), image: String(row.image_url_snapshot ?? "/img01.jpeg"), unitPrice: euro(row.unit_price_cents), quantity: number(row.quantity) }));
    const periodOrders = orders.filter((order) => new Date(order.createdAt) >= start);
    const received = periodOrders.filter((order) => ["PAID", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(order.status) && order.paymentStatus === "PAID");
    const revenue = received.reduce((sum, order) => sum + order.total, 0);
    const cost = 0; const periodExpenses = expenses.filter((expense) => new Date(expense.incurredAt) >= start).reduce((sum, expense) => sum + expense.amount, 0);
    const lowStock = products.filter((product) => product.stock <= product.lowStockThreshold);
    const actions = [
      ...orders.filter((order) => ["PENDING", "AWAITING_PAYMENT"].includes(order.status)).map((order) => ({ type: "order", level: "urgent", title: "Commande à confirmer", detail: order.number, id: order.id })),
      ...orders.filter((order) => order.status === "PROCESSING").map((order) => ({ type: "order", level: "normal", title: "Commande à expédier", detail: order.number, id: order.id })),
      ...orders.filter((order) => order.status === "REFUND_REQUESTED").map((order) => ({ type: "refund", level: "urgent", title: "Remboursement à traiter", detail: order.number, id: order.id })),
      ...lowStock.map((product) => ({ type: "stock", level: product.stock === 0 ? "urgent" : "normal", title: product.stock === 0 ? "Produit en rupture" : "Stock faible", detail: product.name, id: product.id })),
    ];
    const daily = Array.from({ length: 7 }, (_, index) => { const day = new Date(); day.setDate(day.getDate() - (6 - index)); const key = day.toISOString().slice(0, 10); const value = received.filter((order) => order.createdAt.slice(0, 10) === key).reduce((sum, order) => sum + order.total, 0); return { label: day.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }), revenue: value }; });
    const insight = lowStock[0] ? `Le stock de ${lowStock[0].name} demande votre attention (${lowStock[0].stock} unité${lowStock[0].stock > 1 ? "s" : ""} restante${lowStock[0].stock > 1 ? "s" : ""}).` : revenue ? `Les ventes encaissées atteignent ${revenue.toFixed(2)} € sur la période sélectionnée.` : "Votre tableau de bord est prêt. Les prochaines commandes et alertes apparaîtront ici.";
    return NextResponse.json({ products, orders, customers, expenses, movements, events, notes, orderItems, overview: { revenue, received: revenue, cost, grossProfit: revenue - cost, expenses: periodExpenses, profit: revenue - cost - periodExpenses, averageOrder: received.length ? revenue / received.length : 0, orderCount: periodOrders.length, pendingCount: actions.filter((action) => action.type === "order").length, lowStockCount: lowStock.length, actions, daily, insight } });
  } catch (error) { console.error(error); return NextResponse.json({ error: "Impossible de charger le back-office." }, { status: 500 }); }
}

export async function POST(request: Request) {
  const admin = await getAdminSession(); if (!admin) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null; const action = text(body?.action); const sql = getNeonSql();
  try {
    if (action === "product-status") {
      const id = text(body?.id); const status = text(body?.status); if (!id || !["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) throw new Error("Statut invalide");
      await sql.query("UPDATE products SET status=$1,updated_at=now() WHERE id=$2", [status, id]);
    } else if (action === "product-duplicate") {
      const id = text(body?.id); const source = (await sql.query("SELECT p.*,v.title,v.sku,v.price_cents,v.cost_cents,v.stock,v.compare_at_price_cents FROM products p JOIN product_variants v ON v.product_id=p.id WHERE p.id=$1 ORDER BY v.created_at LIMIT 1", [id]))[0] as Row | undefined; if (!source) throw new Error("Produit introuvable");
      const productId = crypto.randomUUID(); const variantId = crypto.randomUUID(); const slug = `${String(source.slug)}-copie-${productId.slice(0, 5)}`;
      await sql.transaction([sql.query("INSERT INTO products (id,category_id,name,slug,description,status,featured,low_stock_threshold,tags_json,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,'DRAFT',false,$6,$7,now(),now())", [productId, source.category_id, `${String(source.name)} — copie`, slug, source.description, source.low_stock_threshold, source.tags_json ?? []]), sql.query("INSERT INTO product_variants (id,product_id,title,sku,price_cents,cost_cents,stock,compare_at_price_cents,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,0,$7,now(),now())", [variantId, productId, source.title, `${String(source.sku)}-COPY-${productId.slice(0, 4)}`.toUpperCase(), source.price_cents, source.cost_cents, source.compare_at_price_cents])]);
    } else if (action === "product-promotion") {
      const productId = text(body?.productId); const salePrice = Number(body?.salePrice); const percentOff = Number(body?.percentOff); if (!productId || (!Number.isFinite(salePrice) && !Number.isFinite(percentOff))) throw new Error("Promotion invalide");
      await sql.query("INSERT INTO product_promotions (id,product_id,sale_price_cents,percent_off,starts_at,ends_at,is_active,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,true,now(),now())", [crypto.randomUUID(), productId, Number.isFinite(salePrice) ? Math.round(salePrice * 100) : null, Number.isFinite(percentOff) ? Math.round(percentOff) : null, text(body?.startsAt) || null, text(body?.endsAt) || null]);
    } else if (action === "product-promotion-remove") {
      await sql.query("UPDATE product_promotions SET is_active=false,updated_at=now() WHERE product_id=$1 AND is_active=true", [text(body?.productId)]);
    } else if (action === "stock-adjust") {
      const variantId = text(body?.variantId); const quantity = Math.trunc(Number(body?.quantity)); const type = text(body?.type); const reason = text(body?.reason) || "Ajustement administrateur"; const allowedTypes = new Set(["PURCHASE", "RETURN", "CORRECTION", "LOSS", "DAMAGE", "MANUAL"]); if (!variantId || !Number.isFinite(quantity) || quantity === 0 || !allowedTypes.has(type)) throw new Error("Mouvement de stock invalide");
      await sql.transaction([sql.query("UPDATE product_variants SET stock=GREATEST(0,stock+$1),updated_at=now() WHERE id=$2", [quantity, variantId]), sql.query("INSERT INTO inventory_movements (id,variant_id,quantity,type,reason,actor_id,created_at) VALUES ($1,$2,$3,$4,$5,$6,now())", [crypto.randomUUID(), variantId, quantity, type, reason, admin.userId])]);
    } else if (action === "product-delete") {
      const id = text(body?.id); const usage = await sql.query("SELECT COUNT(*)::int AS count FROM order_items oi JOIN product_variants v ON v.id=oi.variant_id WHERE v.product_id=$1", [id]) as Row[];
      if (number(usage[0]?.count) > 0) await sql.query("UPDATE products SET status='ARCHIVED',updated_at=now() WHERE id=$1", [id]); else await sql.query("DELETE FROM products WHERE id=$1", [id]);
    } else if (action === "order-status") {
      const id = text(body?.id); const status = text(body?.status); const note = text(body?.note); if (!id || !["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUND_REQUESTED"].includes(status)) throw new Error("Action commande invalide");
      const tracking = text(body?.trackingNumber); await sql.transaction([sql.query("UPDATE orders SET status=$1,tracking_number=COALESCE(NULLIF($2,''),tracking_number),updated_at=now() WHERE id=$3", [status, tracking, id]), sql.query("INSERT INTO order_events (id,order_id,actor_id,type,note,metadata_json,created_at) VALUES ($1,$2,$3,$4,$5,$6,now())", [crypto.randomUUID(), id, admin.userId, status, note || null, tracking ? JSON.stringify({ trackingNumber: tracking }) : null])]);
    } else if (action === "customer-note") {
      const userId = text(body?.userId); const note = text(body?.note); if (!userId || !note) throw new Error("Note invalide"); await sql.query("INSERT INTO customer_notes (id,user_id,actor_id,body,created_at) VALUES ($1,$2,$3,$4,now())", [crypto.randomUUID(), userId, admin.userId, note]);
    } else if (action === "expense-create" || action === "expense-update") {
      const id = text(body?.id); const category = text(body?.category).toLowerCase(); const description = text(body?.description); const amount = Number(body?.amount); const incurredAt = text(body?.incurredAt); if (!allowedExpenseCategories.has(category) || !description || !Number.isFinite(amount) || amount < 0 || !incurredAt) throw new Error("Dépense invalide");
      const supplier = text(body?.supplier) || null; const note = text(body?.note) || null; if (action === "expense-create") await sql.query("INSERT INTO expenses (id,category,description,amount_cents,supplier,note,incurred_at,created_at,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,now(),now())", [crypto.randomUUID(), category, description, Math.round(amount * 100), supplier, note, incurredAt]); else await sql.query("UPDATE expenses SET category=$1,description=$2,amount_cents=$3,supplier=$4,note=$5,incurred_at=$6,updated_at=now() WHERE id=$7", [category, description, Math.round(amount * 100), supplier, note, incurredAt, id]);
    } else if (action === "expense-delete") {
      await sql.query("DELETE FROM expenses WHERE id=$1", [text(body?.id)]);
    } else if (action === "assistant") {
      const question = text(body?.question).toLowerCase(); const result = await assistantReply(sql, question); return NextResponse.json({ answer: result });
    } else throw new Error("Action inconnue");
    return NextResponse.json({ ok: true });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Action impossible" }, { status: 400 }); }
}

async function assistantReply(sql: ReturnType<typeof getNeonSql>, question: string) {
  const [orders, lowStock, expenses] = await Promise.all([sql.query("SELECT COUNT(*)::int AS count FROM orders WHERE status IN ('PENDING','AWAITING_PAYMENT','CONFIRMED','PROCESSING')"), sql.query("SELECT p.name,v.stock,p.low_stock_threshold FROM products p JOIN product_variants v ON v.product_id=p.id WHERE v.stock<=p.low_stock_threshold ORDER BY v.stock ASC LIMIT 3"), sql.query("SELECT COALESCE(SUM(amount_cents),0)::int AS total FROM expenses WHERE incurred_at>=now()-interval '30 days'")]) as [Row[], Row[], Row[]];
  if (question.includes("rupture") || question.includes("stock")) return lowStock.length ? `À surveiller : ${lowStock.map((row) => `${row.name} (${row.stock} unités)`).join(", ")}.` : "Aucun produit n’est actuellement sous son seuil de stock faible.";
  if (question.includes("commande") || question.includes("attente")) return `${number(orders[0]?.count)} commande${number(orders[0]?.count) > 1 ? "s" : ""} demande${number(orders[0]?.count) > 1 ? "nt" : ""} encore une action de votre part.`;
  if (question.includes("dépense") || question.includes("bénéfice") || question.includes("finance")) return `Les dépenses enregistrées sur les 30 derniers jours totalisent ${(euro(expenses[0]?.total)).toFixed(2)} €. Ajoutez vos coûts d’achat pour affiner la marge réelle.`;
  return "Je peux vous aider à suivre les stocks, les commandes en attente et la santé financière à partir des données du back-office.";
}
