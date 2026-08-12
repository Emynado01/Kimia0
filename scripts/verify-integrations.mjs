import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

const checks = [];
async function check(name, task) { try { await task(); checks.push([name, "ok"]); } catch (error) { checks.push([name, `failed: ${error instanceof Error ? error.message.split("\n")[0] : "unknown error"}`]); } }
await check("OpenAI", async () => { const response = await fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }); if (!response.ok) throw new Error(`HTTP ${response.status}`); });
await check("Cloudflare R2/S3", async () => { const client = new S3Client({ region: process.env.S3_REGION || "auto", endpoint: process.env.S3_ENDPOINT, forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true", credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY } }); await client.send(new ListObjectsV2Command({ Bucket: process.env.S3_BUCKET, MaxKeys: 1 })); });
for (const [name, result] of checks) console.log(`${name}: ${result}`);
if (checks.some(([, result]) => result !== "ok")) process.exitCode = 1;
