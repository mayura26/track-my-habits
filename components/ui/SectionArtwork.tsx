import Image from "next/image";
import type { ReactNode } from "react";
import { type ArtworkId, artworkBriefs } from "@/lib/artwork";

const variantAspect: Record<"inline" | "banner" | "card", string> = {
  banner: "aspect-[21/9] min-h-[120px] sm:min-h-[140px]",
  inline: "aspect-[2/1] min-h-[100px] sm:min-h-[120px]",
  card: "aspect-[4/3] min-h-[140px] sm:min-h-[180px]",
};

/** Minimum height when artwork fills the card behind content */
const cardModeMinH: Record<"inline" | "banner" | "card", string> = {
  banner: "min-h-[260px] sm:min-h-[280px]",
  card: "min-h-[220px]",
  inline: "min-h-[200px]",
};

interface SectionArtworkProps {
  artifactId: ArtworkId;
  variant?: "inline" | "banner" | "card";
  className?: string;
  /** Softer gradient for use behind readable text overlays */
  dimmed?: boolean;
  /** When set, artwork fills the rounded card behind this content (no separate image strip). */
  children?: ReactNode;
  /** Overrides default padding on the overlaid content (`p-6 md:p-8`). */
  contentClassName?: string;
}

export function SectionArtwork({
  artifactId,
  variant = "inline",
  className = "",
  dimmed = true,
  children,
  contentClassName,
}: SectionArtworkProps) {
  const brief = artworkBriefs[artifactId];
  const isSvg = brief.assetPath.endsWith(".svg");

  if (children != null) {
    return (
      <div
        className={`relative isolate w-full overflow-hidden rounded-[32px] border border-[rgba(216,196,160,0.16)] shadow-[inset_0_1px_0_rgba(255,244,224,0.05),0_24px_60px_rgba(0,0,0,0.28)] ring-1 ring-inset ring-[rgba(216,196,160,0.08)] ${cardModeMinH[variant]} ${className}`}
      >
        <Image
          src={brief.assetPath}
          alt={brief.alt}
          fill
          className={`pointer-events-none z-0 object-cover ${dimmed ? "section-artwork-photo-dimmed" : ""}`}
          sizes="(max-width: 1280px) 100vw, 1152px"
          unoptimized={isSvg}
          priority={false}
        />
        {dimmed ? (
          <div className="section-artwork-card-scrim" aria-hidden />
        ) : (
          <div className="section-artwork-card-scrim-soft" aria-hidden />
        )}
        <div
          className={`relative z-[2] flex flex-col ${contentClassName ?? "p-6 md:p-8"}`}
        >
          {children}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[24px] border border-[rgba(216,196,160,0.12)] ${variantAspect[variant]} ${className}`}
    >
      <Image
        src={brief.assetPath}
        alt={brief.alt}
        fill
        className={`object-cover ${dimmed ? "section-artwork-photo-dimmed" : ""}`}
        sizes="(max-width: 768px) 100vw, 896px"
        unoptimized={isSvg}
        priority={false}
      />
      {dimmed && <div className="section-artwork-scrim" aria-hidden />}
    </div>
  );
}
