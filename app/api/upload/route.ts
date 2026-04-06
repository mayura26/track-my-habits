import { existsSync } from "node:fs";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

const EXT_MAP: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string | null;
  const id = formData.get("id") as string | null;

  if (!file || !type || !id) {
    return NextResponse.json(
      { error: "Missing file, type, or id" },
      { status: 400 },
    );
  }

  if (type !== "habit" && type !== "task") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, and WebP images are allowed" },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "File must be under 5 MB" },
      { status: 400 },
    );
  }

  // Verify ownership
  if (type === "habit") {
    const habit = await db.habit.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!habit) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // Delete old image if exists
    if (habit.imageUrl) {
      const oldPath = path.join(process.cwd(), "public", habit.imageUrl);
      if (existsSync(oldPath)) await unlink(oldPath);
    }
  } else {
    const task = await db.task.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!task) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (task.imageUrl) {
      const oldPath = path.join(process.cwd(), "public", task.imageUrl);
      if (existsSync(oldPath)) await unlink(oldPath);
    }
  }

  const ext = EXT_MAP[file.type] ?? "jpg";
  const filename = `${id}-${Date.now()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", `${type}s`);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  const filePath = path.join(dir, filename);

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const url = `/uploads/${type}s/${filename}`;

  if (type === "habit") {
    await db.habit.update({ where: { id }, data: { imageUrl: url } });
  } else {
    await db.task.update({ where: { id }, data: { imageUrl: url } });
  }

  return NextResponse.json({ url });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type, id } = await req.json();

  if (!type || !id || (type !== "habit" && type !== "task")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (type === "habit") {
    const habit = await db.habit.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!habit) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (habit.imageUrl) {
      const filePath = path.join(process.cwd(), "public", habit.imageUrl);
      if (existsSync(filePath)) await unlink(filePath);
    }
    await db.habit.update({ where: { id }, data: { imageUrl: null } });
  } else {
    const task = await db.task.findFirst({
      where: { id, userId: session.user.id },
    });
    if (!task) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (task.imageUrl) {
      const filePath = path.join(process.cwd(), "public", task.imageUrl);
      if (existsSync(filePath)) await unlink(filePath);
    }
    await db.task.update({ where: { id }, data: { imageUrl: null } });
  }

  return NextResponse.json({ success: true });
}
