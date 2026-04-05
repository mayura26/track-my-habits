import Image from "next/image";
import { type ArtworkId, artworkBriefs } from "@/lib/artwork";

interface ArtworkPlaceholderProps {
  src: string;
  alt: string;
  eyebrow: string;
  title: string;
  artifactId?: ArtworkId;
  className?: string;
}

export function ArtworkPlaceholder({
  src,
  alt,
  eyebrow,
  title,
  artifactId,
  className = "",
}: ArtworkPlaceholderProps) {
  const brief = artifactId ? artworkBriefs[artifactId] : null;

  return (
    <div
      className={`surface-panel overflow-hidden rounded-[32px] ${className}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image src={src} alt={alt} fill className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(7,9,9,0.22)_55%,rgba(7,9,9,0.84))]" />
        <div className="absolute left-5 top-5 rounded-full border border-[rgba(255,244,224,0.2)] bg-[rgba(8,12,10,0.38)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#efe2c3]">
          {brief ? "Artifact brief ready" : "Artwork slot"}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="section-kicker">{eyebrow}</p>
          <p className="display-title mt-2 text-3xl font-semibold text-[#fff7ea]">
            {title}
          </p>
          {brief && (
            <div className="mt-3 rounded-[20px] border border-[rgba(255,244,224,0.12)] bg-[rgba(8,12,10,0.4)] p-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d8c4a0]">
                {brief.intendedUse}
              </p>
              <p className="mt-2 text-sm leading-6 text-[#efe2c3]">
                {brief.promptSummary}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
