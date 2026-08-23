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
      <img
        src={logoAsset.url}
        alt="Shuraksha logo"
        className="h-9 w-9 shrink-0 object-cover object-[52%_28%] scale-[2.6] [clip-path:circle(48%)]"
        width={36}
        height={36}
      />
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
