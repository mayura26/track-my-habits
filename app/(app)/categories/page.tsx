import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/lib/db";
import { CategoriesClient } from "./CategoriesClient";

export default async function CategoriesPage() {
  const session = await requireAuth();

  const categories = await db.habitCategory.findMany({
    where: { OR: [{ isDefault: true }, { userId: session.user.id }] },
    include: { _count: { select: { habits: true } } },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#f5f5f5]">Categories</h1>
      <CategoriesClient categories={categories} />
    </div>
  );
}
