import Image from "next/image";

interface BrandLogoProps {
  alt?: string;
  className?: string;
  priority?: boolean;
  size?: number;
}

export function BrandLogo({
  alt = "Track My Habits logo",
  className = "",
  priority = false,
  size = 48,
}: BrandLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={`shrink-0 rounded-full object-cover shadow-[0_12px_28px_rgba(0,0,0,0.28)] ${className}`}
    />
  );
}
