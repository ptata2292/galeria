import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { readdir, stat } from "fs/promises";
import { join, extname } from "path";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(__dirname, "../.env.local") });

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;
const VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".3gp", ".m4v"];

async function fileExists(key: string): Promise<boolean> {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function uploadDir(dirPath: string, prefix: string) {
  const entries = await readdir(dirPath);
  let uploaded = 0;
  let skipped = 0;

  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    const fileStat = await stat(fullPath);

    if (fileStat.isDirectory()) {
      const result = await uploadDir(fullPath, prefix);
      uploaded += result.uploaded;
      skipped += result.skipped;
      continue;
    }

    const key = `${prefix}${entry}`;

    if (await fileExists(key)) {
      skipped++;
      continue;
    }

    console.log(`Subiendo: ${key}`);
    const fileBuffer = await import("fs/promises").then((fs) => fs.readFile(fullPath));
    const ext = extname(entry).toLowerCase();
    const contentType = VIDEO_EXTENSIONS.includes(ext) ? `video/${ext.slice(1)}` : "image/jpeg";

    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      })
    );

    uploaded++;
  }

  return { uploaded, skipped };
}

async function main() {
  console.log("Subiendo imágenes...");
  const img = await uploadDir("./Imágenes", "imagenes/");
  console.log(`Imágenes: ${img.uploaded} subidas, ${img.skipped} ya existían\n`);

  console.log("Subiendo videos...");
  const vid = await uploadDir("./Videoclips", "videoclips/");
  console.log(`Videos: ${vid.uploaded} subidas, ${vid.skipped} ya existían\n`);

  console.log(`Total: ${img.uploaded + vid.uploaded} subidos, ${img.skipped + vid.skipped} existentes`);
}

main().catch(console.error);
