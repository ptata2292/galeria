import { S3Client, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { readdir, stat, mkdir } from "fs/promises";
import { join, extname, basename } from "path";
import { config } from "dotenv";
import { resolve } from "path";
import { execSync } from "child_process";

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

async function convertToMp4(inputPath: string, outputPath: string): Promise<boolean> {
  try {
    execSync(
      `ffmpeg -i "${inputPath}" -c:v libx264 -preset fast -crf 23 -c:a aac -b:a 128k -y "${outputPath}"`,
      { stdio: "pipe", timeout: 120000 }
    );
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const tempDir = join(__dirname, "../temp_videos");
  await mkdir(tempDir, { recursive: true });

  const entries = await readdir("./Videoclips");
  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (const entry of entries) {
    const fullPath = join("./Videoclips", entry);
    const fileStat = await stat(fullPath);

    if (fileStat.isDirectory()) continue;

    const ext = extname(entry).toLowerCase();
    if (!VIDEO_EXTENSIONS.includes(ext)) continue;

    const mp4Name = basename(entry, ext) + ".mp4";
    const r2Key = `videoclips/${mp4Name}`;

    if (await fileExists(r2Key)) {
      console.log(`Ya existe: ${mp4Name}`);
      skipped++;
      continue;
    }

    const tempPath = join(tempDir, mp4Name);
    console.log(`Convirtiendo: ${entry} → ${mp4Name}`);

    if (ext === ".mp4") {
      const buffer = await import("fs/promises").then((fs) => fs.readFile(fullPath));
      await r2.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: r2Key,
          Body: buffer,
          ContentType: "video/mp4",
        })
      );
      console.log(`  ✓ Subido directamente`);
      converted++;
      continue;
    }

    const success = await convertToMp4(fullPath, tempPath);
    if (!success) {
      console.log(`  ✗ Error convirtiendo`);
      failed++;
      continue;
    }

    const buffer = await import("fs/promises").then((fs) => fs.readFile(tempPath));
    await r2.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: r2Key,
        Body: buffer,
        ContentType: "video/mp4",
      })
    );

    console.log(`  ✓ Convertido y subido`);
    converted++;

    const { unlinkSync } = await import("fs");
    unlinkSync(tempPath);
  }

  console.log(`\nResultado: ${converted} convertidos, ${skipped} existentes, ${failed} fallidos`);
}

main().catch(console.error);
