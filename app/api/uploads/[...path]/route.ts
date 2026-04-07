import { createReadStream, existsSync } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { getUploadsRoot } from "@/lib/upload-paths";

const CONTENT_TYPES: Record<string, string> = {
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _req: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: pathSegments } = await context.params;
  const relativePath = pathSegments.join("/");

  // Prevent attempts to escape the uploads directory.
  if (
    pathSegments.length === 0 ||
    pathSegments.some((segment) => segment === ".." || segment.includes("\\"))
  ) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const uploadsRoot = getUploadsRoot();
  const absolutePath = path.resolve(uploadsRoot, relativePath);
  const normalizedRoot = path.resolve(uploadsRoot) + path.sep;
  if (!absolutePath.startsWith(normalizedRoot) || !existsSync(absolutePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = path.extname(absolutePath).toLowerCase();
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return NextResponse.json(
      { error: "Unsupported image type" },
      { status: 415 },
    );
  }

  const stream = createReadStream(absolutePath);
  return new NextResponse(stream as unknown as BodyInit, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
