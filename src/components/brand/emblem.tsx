import Image from "next/image";
import logoFbi from "./logo_fbi.png";

/**
 * Marque de l'agence — image fournie dans le dépôt (src/components/brand/logo_fbi.png).
 * Remplace l'icône générique `Shield` de lucide partout où elle sert de logo.
 * `size` correspond à la hauteur affichée ; la largeur suit le ratio de l'image.
 */
export function Emblem({
  size = 44,
  className,
  alt = "Federal Bureau of Investigation",
}: {
  size?: number;
  className?: string;
  alt?: string;
}) {
  const width = Math.round((size * logoFbi.width) / logoFbi.height);
  return (
    <Image
      src={logoFbi}
      alt={alt}
      height={size}
      width={width}
      className={className}
      unoptimized
    />
  );
}
