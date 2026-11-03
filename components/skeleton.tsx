import { cn } from "cn";

/** A placeholder bar, the shape of what loads into it */
export function Bone({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block rounded-md bg-soft motion-safe:animate-pulse",
        className
      )}
    />
  );
}
