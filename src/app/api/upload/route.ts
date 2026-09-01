import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const { fileName, contentType, folder } = await request.json();
    
    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: "fileName and contentType are required" },
        { status: 400 }
      );
    }

    const folderPrefix = folder === "video" ? "videoclips/" : "imagenes/";
    const key = `${folderPrefix}${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      ContentType: contentType,
    });

    const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });
    
    return NextResponse.json({ presignedUrl, key });
  } catch (error) {
    console.error("Error creating upload URL:", error);
    return NextResponse.json(
      { error: "Error creating upload URL" },
      { status: 500 }
    );
  }
}
