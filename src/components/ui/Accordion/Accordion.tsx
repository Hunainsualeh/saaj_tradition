"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      suppressHydrationWarning
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  smallVariant = false,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger> & {
  smallVariant?: boolean;
}) {
  return (
    <AccordionPrimitive.Header className="flex" suppressHydrationWarning>
      <AccordionPrimitive.Trigger
        suppressHydrationWarning
        data-slot="accordion-trigger"
        className={cn(
          "cursor-pointer focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md text-neutral-11 text-left font-normal tracking-tight transition-all outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
          smallVariant
            ? "py-3 text-sm xl:text-base items-center"
            : "py-4 text-base xl:text-lg",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon
          className={cn(
            "text-neutral-08 pointer-events-none shrink-0 translate-y-0.5 transition-transform duration-200",
            smallVariant ? "size-3.5" : "size-4",
          )}
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  smallVariant = false,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content> & {
  smallVariant?: boolean;
}) {
  return (
    <AccordionPrimitive.Content
      suppressHydrationWarning
      data-slot="accordion-content"
      className={cn(
        "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden text-neutral-10",
        smallVariant ? "text-sm xl:text-base" : "text-base xl:text-lg",
        className,
      )}
      {...props}
    >
      <div suppressHydrationWarning className={cn(smallVariant ? "pt-0 pb-3" : "pt-0 pb-4", className)}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
