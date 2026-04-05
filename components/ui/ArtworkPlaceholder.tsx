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
        <Image src={src} alt={alt} fill className="object-cover" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(7,9,9,0.22)_55%,rgba(7,9,9,0.84))]" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          {eyebrow ? (
            <p className="section-kicker">{eyebrow}</p>
          ) : null}
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
