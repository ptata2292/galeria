import { NextResponse } from "next/server";
import { deleteFile } from "@/lib/r2";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");
    
    if (!key) {
      return NextResponse.json(
        { error: "Key is required" },
        { status: 400 }
      );
    }

    await deleteFile(key);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Error deleting file" },
      { status: 500 }
    );
  }
}
