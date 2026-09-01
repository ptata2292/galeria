import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { config } from "dotenv";
import { resolve } from "path";
import { execSync } from "child_process";
import { mkdir, readFile, unlink } from "fs/promises";
import { join } from "path";

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

async function fileExists(key: string): Promise<boolean> {
  try {
    await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

async function downloadFile(key: string, localPath: string): Promise<void> {
  const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const response = await r2.send(command);
  
  if (response.Body) {
    const bytes = await response.Body.transformToByteArray();
    const { writeFileSync } = await import("fs");
    writeFileSync(localPath, Buffer.from(bytes));
  }
}

async function extractThumbnail(videoPath: string, thumbPath: string): Promise<boolean> {
  try {
    execSync(
      `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 -vf "scale=400:-1" -y "${thumbPath}" 2>/dev/null`,
      { stdio: "pipe", timeout: 30000 }
    );
    return true;
  } catch {
    try {
      execSync(
        `ffmpeg -i "${videoPath}" -ss 00:00:00 -vframes 1 -vf "scale=400:-1" -y "${thumbPath}" 2>/dev/null`,
        { stdio: "pipe", timeout: 30000 }
      );
      return true;
    } catch {
      return false;
    }
  }
}

async function main() {
  const tempDir = join(__dirname, "../temp_thumbs");
  await mkdir(tempDir, { recursive: true });

  const listCommand = new (await import("@aws-sdk/client-s3")).ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: "videoclips/",
    MaxKeys: 1000,
  });

  const response = await r2.send(listCommand);
  const videos = (response.Contents || []).filter(
    (item) => item.Key?.endsWith(".mp4") && item.Size && item.Size > 0
  );

  console.log(`Videos encontrados: ${videos.length}\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const video of videos) {
    const videoKey = video.Key!;
    const thumbKey = videoKey.replace("videoclips/", "thumbs/").replace(".mp4", ".jpg");

    if (await fileExists(thumbKey)) {
      skipped++;
      continue;
    }

    const videoName = videoKey.split("/").pop()!;
    console.log(`Generando miniatura: ${videoName}`);

    const tempVideo = join(tempDir, `v_${videoName}`);
    const tempThumb = join(tempDir, `t_${videoName.replace(".mp4", ".jpg")}`);

    try {
      await downloadFile(videoKey, tempVideo);

      const success = await extractThumbnail(tempVideo, tempThumb);
      if (!success) {
        console.log(`  ✗ No se pudo extraer frame`);
        failed++;
        continue;
      }

      const thumbBuffer = await readFile(tempThumb);
      await r2.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: thumbKey,
          Body: thumbBuffer,
          ContentType: "image/jpeg",
        })
      );

      console.log(`  ✓ Miniatura creada`);
      created++;

      await unlink(tempVideo).catch(() => {});
      await unlink(tempThumb).catch(() => {});
    } catch (err) {
      console.log(`  ✗ Error: ${err}`);
      failed++;
    }
  }

  console.log(`\nResultado: ${created} creadas, ${skipped} existentes, ${failed} fallidas`);
}

main().catch(console.error);
