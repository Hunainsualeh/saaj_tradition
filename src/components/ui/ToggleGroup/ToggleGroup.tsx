"use client";

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";

import { cn } from "@/lib/utils";

function ToggleGroup({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  // Separated chips (not a connected segmented bar) — flex-wrap so long labels
  // like "One Size" or many sizes reflow cleanly on narrow screens.
  return (
    <ToggleGroupPrimitive.Root
      className={cn("flex flex-wrap gap-2", className)}
      {...props}
    />
  );
}

function ToggleGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      className={cn(
        "cursor-pointer inline-flex items-center justify-center h-11 min-w-11 px-3.5 text-sm font-medium rounded-lg select-none",
        "border border-neutral-05 bg-white text-neutral-11",
        "transition-[colors,transform] duration-150 hover:border-neutral-11 active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-11 focus-visible:ring-offset-1",
        "data-[state=on]:border-neutral-11 data-[state=on]:bg-neutral-11 data-[state=on]:text-neutral-01",
        "disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
