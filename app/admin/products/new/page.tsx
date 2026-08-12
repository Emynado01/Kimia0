import { requireAdmin } from "../../../../lib/admin-auth";
import { NewProductForm } from "./product-form";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdmin();
  return <main className="product-admin-page"><header><a href="/admin" className="back-home">← Tableau de bord</a><a href="/" className="wordmark">KiMiA<span>·</span></a></header><NewProductForm /></main>;
}
