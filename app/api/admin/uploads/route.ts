import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/admin-auth";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 8 * 1024 * 1024;
const encoder = new TextEncoder();

export async function POST(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const formData = await request.formData().catch(() => null); const image = formData?.get("image");
  if (!(image instanceof File) || !allowedTypes.has(image.type) || image.size > maxImageBytes) return NextResponse.json({ error: "Choisissez une image JPG, PNG ou WebP de 8 Mo maximum." }, { status: 400 });
  const endpoint = process.env.S3_ENDPOINT; const bucket = process.env.S3_BUCKET; const publicBase = process.env.R2_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL; const accessKeyId = process.env.S3_ACCESS_KEY_ID; const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!endpoint || !bucket || !publicBase || !accessKeyId || !secretAccessKey) return NextResponse.json({ error: "Le stockage d’images n’est pas encore configuré." }, { status: 503 });
  const extension = image.type === "image/jpeg" ? "jpg" : image.type === "image/png" ? "png" : "webp"; const key = `products/${crypto.randomUUID()}.${extension}`;
  try {
    await uploadToS3({ endpoint, bucket, key, contentType: image.type, body: new Uint8Array(await image.arrayBuffer()), accessKeyId, secretAccessKey, region: process.env.S3_REGION || "auto", forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true" });
    return NextResponse.json({ url: `${publicBase.replace(/\/$/, "")}/${key}` }, { status: 201 });
  } catch (error) {
    console.error("[admin/uploads] S3 upload failed", { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: "L’envoi de la photo a échoué. Vérifiez la configuration R2/S3." }, { status: 502 });
  }
}

async function uploadToS3({ endpoint, bucket, key, contentType, body, accessKeyId, secretAccessKey, region, forcePathStyle }: { endpoint: string; bucket: string; key: string; contentType: string; body: Uint8Array; accessKeyId: string; secretAccessKey: string; region: string; forcePathStyle: boolean }) {
  const url = new URL(endpoint); const encodedKey = key.split("/").map(encodeURIComponent).join("/");
  url.pathname = `${url.pathname.replace(/\/$/, "")}/${forcePathStyle ? `${encodeURIComponent(bucket)}/` : ""}${encodedKey}`;
  if (!forcePathStyle) url.hostname = `${bucket}.${url.hostname}`;
  const now = new Date(); const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, ""); const dateStamp = amzDate.slice(0, 8); const payloadHash = await sha256(body); const host = url.host;
  const canonicalHeaders = `content-type:${contentType}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`; const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date"; const scope = `${dateStamp}/${region}/s3/aws4_request`;
  const canonicalRequest = `PUT\n${url.pathname}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`; const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${await sha256(encoder.encode(canonicalRequest))}`;
  const signingKey = await hmac(await hmac(await hmac(await hmac(encoder.encode(`AWS4${secretAccessKey}`), dateStamp), region), "s3"), "aws4_request"); const signature = toHex(await hmac(signingKey, stringToSign));
  const response = await fetch(url, { method: "PUT", headers: { "content-type": contentType, host, "x-amz-content-sha256": payloadHash, "x-amz-date": amzDate, authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}` }, body: body as unknown as BodyInit });
  if (!response.ok) throw new Error(`R2/S3 returned HTTP ${response.status}: ${(await response.text()).slice(0, 180)}`);
}

async function hmac(key: Uint8Array, value: string) { const cryptoKey = await crypto.subtle.importKey("raw", key as unknown as BufferSource, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); return new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value) as unknown as BufferSource)); }
async function sha256(value: Uint8Array) { return toHex(await crypto.subtle.digest("SHA-256", value as unknown as BufferSource)); }
function toHex(value: ArrayBuffer | Uint8Array) { return Array.from(value instanceof Uint8Array ? value : new Uint8Array(value)).map((byte) => byte.toString(16).padStart(2, "0")).join(""); }
