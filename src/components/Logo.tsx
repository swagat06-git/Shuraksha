import logoAsset from "@/assets/shuraksha-logo.png.asset.json";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  showTagline = false,
}: {
  className?: string;
  showTagline?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="relative block size-9 shrink-0 overflow-hidden rounded-lg">
        <img
          src={logoAsset.url}
          alt="Shuraksha logo"
          className="absolute left-1/2 top-1/2 h-auto w-[340%] max-w-none -translate-x-1/2 -translate-y-[46%]"
        />
      </span>
      <span className="leading-none">
        <span className="block font-display text-lg font-bold tracking-tight text-navy dark:text-foreground">
          SHURAKSHA
        </span>
        {showTagline ? (
          <span className="mt-0.5 block text-[10px] font-semibold tracking-[0.18em] text-primary">
            PREPARE · ACT · RECOVER
          </span>
        ) : null}
      </span>
    </span>
  );
}
