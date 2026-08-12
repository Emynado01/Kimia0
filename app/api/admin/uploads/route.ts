import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/admin-auth";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const maxImageBytes = 8 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await getAdminSession())) return NextResponse.json({ error: "Accès administrateur requis." }, { status: 401 });
  const formData = await request.formData().catch(() => null); const image = formData?.get("image");
  if (!(image instanceof File) || !allowedTypes.has(image.type) || image.size > maxImageBytes) return NextResponse.json({ error: "Choisissez une image JPG, PNG ou WebP de 8 Mo maximum." }, { status: 400 });
  const endpoint = process.env.S3_ENDPOINT; const bucket = process.env.S3_BUCKET; const publicBase = process.env.R2_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL;
  if (!endpoint || !bucket || !publicBase || !process.env.S3_ACCESS_KEY_ID || !process.env.S3_SECRET_ACCESS_KEY) return NextResponse.json({ error: "Le stockage d’images n’est pas encore configuré." }, { status: 503 });
  const extension = image.type === "image/jpeg" ? "jpg" : image.type === "image/png" ? "png" : "webp"; const key = `products/${crypto.randomUUID()}.${extension}`;
  try {
    const client = new S3Client({ region: process.env.S3_REGION || "auto", endpoint, forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true", credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY } });
    await client.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: new Uint8Array(await image.arrayBuffer()), ContentType: image.type, CacheControl: "public, max-age=31536000, immutable" }));
    return NextResponse.json({ url: `${publicBase.replace(/\/$/, "")}/${key}` }, { status: 201 });
  } catch { return NextResponse.json({ error: "L’envoi de la photo a échoué. Vérifiez la configuration R2/S3." }, { status: 502 }); }
}
