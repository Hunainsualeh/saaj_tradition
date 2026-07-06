"use client";

import Link from "next/link";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui";

import { cn, routes } from "@/lib";
import { ShopSidebarCollectionItem } from "./ShopSidebarCollectionItem";

export const linkClasses =
  "flex text-neutral-11 hover:text-neutral-10 transition-colors text-base";

type ShopSideBarProps = {
  collections: { name: string; slug: string }[];
  categories?: { name: string; slug: string }[];
  collectionsOpenByDefault?: boolean;
};

export function ShopSidebar(props: ShopSideBarProps) {
  // === PROPS ===
  const { collections = [], categories = [], collectionsOpenByDefault = false } = props;

  return (
    <aside className="hidden md:flex flex-col w-full md:w-64 shrink-0 divide-y divide-neutral-6 md:sticky md:top-30 self-start">
      <Link href={routes.shop} className={cn(linkClasses, "pb-3")}>
        All
      </Link>
      <Link
        href={`${routes.shop}/new-arrivals`}
        className={cn(linkClasses, "py-3")}
      >
        New Arrivals
      </Link>
      {categories.length > 0 && (
        <Accordion
          collapsible
          type="single"
          className="w-full"
        >
          <AccordionItem value="categories" className="border-b-0">
            <AccordionTrigger
              className={cn(
                linkClasses,
                "pt-3 hover:no-underline text-base! [&[data-state=open]>svg]:rotate-180",
              )}
            >
              Categories
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-3 pl-1 pt-0">
              {categories.map((category, index) => (
                <ShopSidebarCollectionItem
                  key={index}
                  href={`${routes.shop}/categories/${category.slug}`}
                  label={category.name}
                />
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
      <Accordion
        defaultValue={collectionsOpenByDefault ? "collections" : undefined}
        collapsible
        type="single"
        className="w-full"
      >
        <AccordionItem value="collections" className="border-b-0">
          <AccordionTrigger
            className={cn(
              linkClasses,
              "pt-3 hover:no-underline text-base! [&[data-state=open]>svg]:rotate-180",
            )}
          >
            Collections
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-3 pl-1 pt-0 ">
            {collections.length > 0 &&
              collections.map((collection, index) => (
                <ShopSidebarCollectionItem
                  key={index}
                  href={routes.shopCollections + `/${collection.slug}`}
                  label={collection.name}
                />
              ))}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  );
}
