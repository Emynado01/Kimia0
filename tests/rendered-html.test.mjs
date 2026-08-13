import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request("http://localhost/", { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the Kimea storefront", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Kimea — Le maquillage qui vous ressemble<\/title>/i);
  assert.match(html, /La beauté/);
  assert.match(html, /Shop all/);
  assert.match(html, /Ouvrir le panier/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/i);
});

test("keeps the live administration workspace connected to the catalogue API", async () => {
  const [page, workspace, backoffice, products] = await Promise.all([
    readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/admin/admin-workspace.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/backoffice/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/admin/products/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(page, /AdminWorkspace/);
  assert.match(workspace, /Vue d’ensemble/);
  assert.match(workspace, /Clients & commandes/);
  assert.match(workspace, /Assistant IA/);
  assert.match(backoffice, /getAdminSession/);
  assert.match(backoffice, /REFUND_REQUESTED/);
  assert.match(products, /galleryUrls/);
  assert.match(products, /lowStockThreshold/);
});
