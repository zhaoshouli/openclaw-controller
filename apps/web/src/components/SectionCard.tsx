import type { PropsWithChildren } from "react";
import { cn } from "../lib/cn";

export function SectionCard({
  children,
  className
}: PropsWithChildren<{ className?: string }>) {
  return (
    <section className={cn("rounded-[28px] border border-line bg-white shadow-panel", className)}>
      {children}
    </section>
  );
}

