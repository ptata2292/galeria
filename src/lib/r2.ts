import { S3Client, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME!;

export interface MediaFile {
  key: string;
  name: string;
  size: number;
  type: "image" | "video";
  lastModified?: Date;
}

function getMediaType(key: string): "image" | "video" {
  const ext = key.split(".").pop()?.toLowerCase() || "";
  const videoExts = ["mp4", "mov", "avi", "mkv", "webm", "3gp", "m4v"];
  return videoExts.includes(ext) ? "video" : "image";
}

function getFileName(key: string): string {
  return key.split("/").pop() || key;
}

export async function listFiles(prefix?: string): Promise<MediaFile[]> {
  const allFiles: MediaFile[] = [];
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix || "",
      MaxKeys: 1000,
      ContinuationToken: continuationToken,
    });

    const response = await r2.send(command);
    
    if (response.Contents) {
      const files = response.Contents
        .filter((item) => item.Key && item.Size && item.Size > 0)
        .map((item) => ({
          key: item.Key!,
          name: getFileName(item.Key!),
          size: item.Size!,
          type: getMediaType(item.Key!),
          lastModified: item.LastModified,
        }));
      allFiles.push(...files);
    }

    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return allFiles;
}

export async function getPresignedUrl(key: string, expiresIn = 3600): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return getSignedUrl(r2, command, { expiresIn });
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  await r2.send(command);
}

export async function fileExists(key: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });
    await r2.send(command);
    return true;
  } catch {
    return false;
  }
}

export { r2, BUCKET };
