import { routes } from "@/lib/routing/routes";
import { NavItemType } from "../types";

export const HOME_NAVBAR_TEXT = "Home";
export const SHOP_NAVBAR_TEXT = "Shop";
export const ABOUT_NAVBAR_TEXT = "About";
export const LOCATION_NAVBAR_TEXT = "Location";
export const BLOG_NAVBAR_TEXT = "Blog";
export const TRACK_NAVBAR_TEXT = "Track Order";

type CollectionNavItem = {
  id: string;
  name: string;
  slug: string;
};

// Main navigation structure
export function getNavItems(
  collections: CollectionNavItem[] = [],
  categories: CollectionNavItem[] = [],
): NavItemType[] {
  return [
    {
      id: "home",
      text: HOME_NAVBAR_TEXT,
      href: routes.home,
    },
    {
      id: "shop",
      text: SHOP_NAVBAR_TEXT,
      href: routes.shop,
      subItems: [
        {
          id: "shop-browse",
          text: "Browse",
          items: [
            {
              id: "shop-category-all",
              text: "Shop All",
              href: routes.shop,
            },
            {
              id: "shop-category-new",
              text: "New Arrivals",
              href: `${routes.shop}/new-arrivals`,
            },
          ],
        },
        ...(categories.length > 0
          ? [
              {
                id: "shop-categories-list",
                text: "Categories",
                items: categories.map((category) => ({
                  id: `shop-category-${category.id}`,
                  text: category.name,
                  href: `${routes.shop}/categories/${category.slug}`,
                })),
              },
            ]
          : []),
        ...(collections.length > 0
          ? [
              {
                id: "shop-collections",
                text: "Collections",
                items: collections.map((collection) => ({
                  id: `shop-collection-${collection.id}`,
                  text: collection.name,
                  href: `${routes.shop}/collections/${collection.slug}`,
                })),
              },
            ]
          : []),
      ],
    },
    {
      id: "about",
      text: ABOUT_NAVBAR_TEXT,
      href: routes.about,
    },
    {
      id: "location",
      text: LOCATION_NAVBAR_TEXT,
      href: routes.location,
    },
    {
      id: "blog",
      text: BLOG_NAVBAR_TEXT,
      href: routes.blog,
    },
    {
      id: "track",
      text: TRACK_NAVBAR_TEXT,
      href: routes.track,
    },
  ];
}

// Keep backward-compatible export for stories etc.
export const navItems: NavItemType[] = getNavItems();
