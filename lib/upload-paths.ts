import path from "node:path";

const DEFAULT_UPLOADS_ROOT = path.join(process.cwd(), "public", "uploads");

export function getUploadsRoot() {
  const configured = process.env.UPLOADS_ROOT?.trim();
  if (!configured) return DEFAULT_UPLOADS_ROOT;

  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

export function resolveStoredImagePath(imageUrl: string) {
  const normalized = imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl;
  const relativeFromUploads = normalized.replace(/^uploads\//, "");
  return path.join(getUploadsRoot(), relativeFromUploads);
}

export function toImageDeliveryUrl(imageUrl: string | null | undefined) {
  if (!imageUrl) return null;
  if (!imageUrl.startsWith("/uploads/")) return imageUrl;
  return `/api/uploads${imageUrl.replace(/^\/uploads/, "")}`;
}
