import { cn } from "@/lib/utils";

/**
 * BISOU brand logo (celeste on transparent PNG).
 * Use `size` to set rendered height in px; width auto-scales.
 */
export function Logo({
  size = 56,
  className,
  alt = "BISOU",
}: {
  size?: number;
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src="/brand/logo-celeste.png"
      alt={alt}
      style={{ height: size }}
      className={cn("brutalist-keep-radius w-auto select-none", className)}
      draggable={false}
    />
  );
}
