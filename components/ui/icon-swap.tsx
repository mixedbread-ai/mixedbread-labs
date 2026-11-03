import { cn } from "cn";

function slot(active: boolean): string {
  return cn(
    "transition-[opacity,filter,transform] duration-150 ease-out [grid-area:1/1] motion-reduce:transition-none",
    active
      ? "blur-0 scale-100 opacity-100"
      : "**:paused scale-90 opacity-0 blur-[2px]"
  );
}

interface IconSwapProps {
  state: "a" | "b";
  a: React.ReactNode;
  b: React.ReactNode;
  className?: string;
}

export function IconSwap({ state, a, b, className }: IconSwapProps) {
  return (
    <span
      data-slot="icon-swap"
      data-state={state}
      className={cn("grid place-items-center", className)}
    >
      <span className={slot(state === "a")}>{a}</span>
      <span className={slot(state === "b")}>{b}</span>
    </span>
  );
}
