import { NextResponse } from "next/server";
import { getPresignedUrl } from "@/lib/r2";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    
    if (!key) {
      return NextResponse.json(
        { error: "Key is required" },
        { status: 400 }
      );
    }

    const url = await getPresignedUrl(key, 3600);
    
    return NextResponse.json({ url });
  } catch (error) {
    console.error("Error getting download URL:", error);
    return NextResponse.json(
      { error: "Error getting download URL" },
      { status: 500 }
    );
  }
}
