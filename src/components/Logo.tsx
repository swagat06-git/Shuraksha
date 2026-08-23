import shieldAsset from "@/assets/shuraksha-shield.png.asset.json";
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
      <img
        src={shieldAsset.url}
        alt="Shuraksha shield logo"
        className="size-10 shrink-0 object-contain"
        width={40}
        height={40}
      />
      <span className="leading-none">
        <span className="block font-display text-lg font-bold tracking-tight text-navy dark:text-foreground">
          SHURAKSHA
        </span>
        {showTagline ? (
          <span className="mt-1 block text-[10px] font-semibold tracking-[0.18em] text-primary">
            PREPARE · ACT · RECOVER
          </span>
        ) : null}
      </span>
    </span>
  );
}
