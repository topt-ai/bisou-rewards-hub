import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Capitalize a person's name for UI display only (does not mutate DB).
 * "JUAN pérez" → "Juan Pérez"
 */
export function capitalizeName(name: string | null | undefined): string {
  if (!name) return "";
  return name
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase())
    .join(" ");
}
