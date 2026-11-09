import { Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ className, onDark }: { className?: string; onDark?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-accent text-accent-foreground shadow-sm">
        <Wallet className="size-5" />
      </span>
      <span
        className={cn(
          "font-display text-lg font-bold leading-none tracking-tight",
          onDark ? "text-on-dark" : "text-foreground",
        )}
      >
        Student <span className={onDark ? "text-accent" : "text-primary"}>Wallet</span>
      </span>
    </span>
  );
}
