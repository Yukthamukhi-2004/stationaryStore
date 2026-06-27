interface BrandLogoProps {
  size?: number;
  className?: string;
}

export default function BrandLogo({ size = 40, className }: BrandLogoProps) {
  return (
    <img
      src="/logo.png"
      alt="Sarada Stationeries"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain", borderRadius: "40%" }}
    />
  );
}
