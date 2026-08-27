import Image from "next/image";

type BrandLogoProps = {
  compact?: boolean;
  inverse?: boolean;
  priority?: boolean;
};

export default function BrandLogo({
  compact = false,
  inverse = false,
  priority = false,
}: BrandLogoProps) {
  const size = compact ? 48 : 72;

  return (
    <div className="flex items-center gap-3">
      <Image
        src="/brand/bhs-ski-academy-logo.png"
        width={size}
        height={size}
        alt="배호성 스키 아카데미 로고"
        priority={priority}
        className="rounded-full bg-white"
      />
      <div className={inverse ? "text-white" : "text-alpine"}>
        <strong className="block">배호성 스키 아카데미</strong>
        <span className="text-[10px] tracking-[0.16em] opacity-60">
          BAE HO SUNG SKI ACADEMY
        </span>
      </div>
    </div>
  );
}
