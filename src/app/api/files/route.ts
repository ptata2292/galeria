import { NextResponse } from "next/server";
import { listFiles, getPresignedUrl } from "@/lib/r2";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get("prefix") || undefined;
    
    const files = await listFiles(prefix);
    
    const filesWithUrls = await Promise.all(
      files.map(async (file) => ({
        ...file,
        url: await getPresignedUrl(file.key, 86400),
      }))
    );
    
    return NextResponse.json({ files: filesWithUrls });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      { error: "Error listing files" },
      { status: 500 }
    );
  }
}
