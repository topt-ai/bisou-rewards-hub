import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Mobile-first container. On mobile = full width.
 * On desktop = centered phone-frame appearance, max 430px.
 */
export function PhoneFrame({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="min-h-screen w-full bg-near-black/5 md:py-8">
      <div
        className={cn(
          "mx-auto min-h-screen w-full max-w-[430px] bg-background md:min-h-[calc(100vh-4rem)] md:rounded-[2rem] md:shadow-2xl md:overflow-hidden md:border md:border-border",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
