import Image from "next/image";
import { type ArtworkId, artworkBriefs } from "@/lib/artwork";

const variantAspect: Record<"inline" | "banner" | "card", string> = {
  banner: "aspect-[21/9] min-h-[120px] sm:min-h-[140px]",
  inline: "aspect-[2/1] min-h-[100px] sm:min-h-[120px]",
  card: "aspect-[4/3] min-h-[140px] sm:min-h-[180px]",
};

interface SectionArtworkProps {
  artifactId: ArtworkId;
  variant?: "inline" | "banner" | "card";
  className?: string;
  /** Softer gradient for use behind readable text overlays */
  dimmed?: boolean;
}

export function SectionArtwork({
  artifactId,
  variant = "inline",
  className = "",
  dimmed = true,
}: SectionArtworkProps) {
  const brief = artworkBriefs[artifactId];
  const isSvg = brief.assetPath.endsWith(".svg");

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[24px] border border-[rgba(216,196,160,0.12)] ${variantAspect[variant]} ${className}`}
    >
      <Image
        src={brief.assetPath}
        alt={brief.alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 896px"
        unoptimized={isSvg}
        priority={false}
      />
      {dimmed && (
        <div
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(7,9,9,0.55)_0%,transparent_45%,rgba(7,9,9,0.25)_100%)]"
          aria-hidden
        />
      )}
    </div>
  );
}
