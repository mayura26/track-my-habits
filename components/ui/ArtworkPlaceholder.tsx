import Image from "next/image";

interface ArtworkPlaceholderProps {
  src: string;
  alt: string;
  title: string;
  eyebrow?: string;
  subtitle?: string;
  className?: string;
}

export function ArtworkPlaceholder({
  src,
  alt,
  title,
  eyebrow,
  subtitle,
  className = "",
}: ArtworkPlaceholderProps) {
  return (
    <div
      className={`surface-panel overflow-hidden rounded-[32px] ${className}`}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={src}
          alt={alt}
          fill
          className="artwork-placeholder-photo object-cover"
        />
        <div className="artwork-placeholder-scrim" aria-hidden />
        <div className="absolute inset-x-0 bottom-0 z-[1] p-5">
          {eyebrow ? <p className="section-kicker">{eyebrow}</p> : null}
          <p
            className={`display-title text-3xl font-semibold text-[#fff7ea] ${eyebrow ? "mt-2" : ""}`}
          >
            {title}
          </p>
          {subtitle ? (
            <p className="mt-2 text-sm leading-6 text-[#d8c4a0]">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
