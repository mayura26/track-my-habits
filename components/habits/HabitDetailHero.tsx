import { Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CategoryBadge } from "@/components/categories/CategoryBadge";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  isDeliveryImageUnoptimized,
  toImageDeliveryUrl,
} from "@/lib/upload-paths";

interface HabitDetailHeroProps {
  name: string;
  description: string | null;
  imageUrl: string | null;
  category: { name: string; color: string; icon: string };
  hasNfc: boolean;
  editHref: string;
  deleteAction: () => void | Promise<void>;
}

/**
 * Artwork hero banner for the habit detail page. Uses the habit's generated
 * card-background image as a dimmed banner; falls back to a subtle
 * category-color gradient when no image exists.
 */
export function HabitDetailHero({
  name,
  description,
  imageUrl,
  category,
  hasNfc,
  editHref,
  deleteAction,
}: HabitDetailHeroProps) {
  const resolvedImageUrl = toImageDeliveryUrl(imageUrl);

  return (
    <section className="surface-panel relative overflow-hidden rounded-[28px]">
      {resolvedImageUrl ? (
        <>
          <Image
            src={resolvedImageUrl}
            alt={`Artwork for ${name}`}
            fill
            unoptimized={isDeliveryImageUnoptimized(resolvedImageUrl)}
            className="pointer-events-none z-0 object-cover section-artwork-photo-dimmed"
            sizes="(max-width: 768px) 100vw, 720px"
            priority
          />
          <div className="section-artwork-card-scrim" aria-hidden />
        </>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 z-0"
          style={{
            background: `radial-gradient(120% 130% at 100% 0%, ${category.color}33 0%, ${category.color}14 38%, rgba(8,12,11,0) 72%)`,
          }}
        />
      )}

      {/* Edit / delete — above the content overlay so taps land on the links */}
      <div className="absolute right-4 top-4 z-10 flex gap-2">
        <Link href={editHref} aria-label="Edit habit">
          <Button variant="secondary" size="sm">
            <Edit className="h-3.5 w-3.5" />
          </Button>
        </Link>
        <form action={deleteAction}>
          <Button
            type="submit"
            variant="danger"
            size="sm"
            aria-label="Delete habit"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>

      <div className="relative z-[2] flex min-h-[15rem] flex-col justify-end p-5 md:min-h-[13rem] md:p-7">
        <p className="section-kicker">Habit</p>
        <h1 className="display-title mt-2 text-3xl font-semibold text-[#fff7ea] md:text-4xl">
          {name}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <CategoryBadge
            name={category.name}
            color={category.color}
            icon={category.icon}
          />
          {hasNfc && <Badge variant="info">NFC</Badge>}
        </div>
        {description && (
          <p className="mt-3 max-w-prose text-sm leading-relaxed text-[#d8c9ad]">
            {description}
          </p>
        )}
      </div>
    </section>
  );
}
