import { NextResponse } from "next/server";
import { listFiles, getPresignedUrl } from "@/lib/r2";

const PAGE_SIZE = 50;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get("prefix") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const filter = searchParams.get("filter") || "all";

    const allFiles = await listFiles(prefix);

    const filtered = filter === "all"
      ? allFiles
      : allFiles.filter((f) => f.type === filter);

    const start = (page - 1) * PAGE_SIZE;
    const end = start + PAGE_SIZE;
    const paginatedFiles = filtered.slice(start, end);

    const filesWithUrls = await Promise.all(
      paginatedFiles.map(async (file) => ({
        ...file,
        url: await getPresignedUrl(file.key, 86400),
      }))
    );

    return NextResponse.json({
      files: filesWithUrls,
      total: filtered.length,
      page,
      totalPages: Math.ceil(filtered.length / PAGE_SIZE),
      hasMore: end < filtered.length,
    });
  } catch (error) {
    console.error("Error listing files:", error);
    return NextResponse.json(
      { error: "Error listing files" },
      { status: 500 }
    );
  }
}
