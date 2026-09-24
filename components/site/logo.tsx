import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Official Virelo Academy logo. The file is used as supplied: never recolored, stretched or redrawn.
 * It is a square image with its own navy background, so it is always shown as a square tile
 * (width === height) which preserves the original aspect ratio. To replace the logo, overwrite
 * public/logo/virelo-logo.jpeg (keep it square) — nothing else needs to change.
 */
export function Logo({ size = 56, priority = false, className }: { size?: number; priority?: boolean; className?: string }) {
  return (
    <Image
      src="/logo/virelo-logo.jpeg"
      alt="شعار Virelo Academy"
      width={640}
      height={640}
      priority={priority}
      sizes={`${size}px`}
      className={cn("shrink-0 rounded-xl ring-1 ring-white/10", className)}
      style={{ width: size, height: size }}
    />
  );
}
