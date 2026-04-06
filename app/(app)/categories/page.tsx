import { SectionArtwork } from "@/components/ui/SectionArtwork";
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
      <SectionArtwork
        artifactId="categoriesGarden"
        variant="banner"
        className="max-w-4xl"
      >
        <div className="max-w-2xl">
          <p className="section-kicker">Organization</p>
          <h1 className="display-title mt-3 text-4xl font-semibold text-[#fff7ea]">
            Categories that make scanning effortless.
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#e8dcc8]">
            Keep the color system tight so habits feel recognizable at a glance
            on mobile.
          </p>
        </div>
      </SectionArtwork>

      <CategoriesClient categories={categories} />
    </div>
  );
}
