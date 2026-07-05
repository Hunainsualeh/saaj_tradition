"use client";

import { useEffect, useRef } from "react";

import { NavbarUI } from "./NavbarUI";
import { useCartCount } from "@/providers";

type NavbarProps = {
  collections?: { id: string; name: string; slug: string }[];
  categories?: { id: string; name: string; slug: string }[];
};

export function Navbar({ collections = [], categories = [] }: NavbarProps) {
  const { itemCount, refreshCartCount } = useCartCount();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      refreshCartCount();
    }
  }, [refreshCartCount]);

  return (
    <NavbarUI
      itemCount={itemCount}
      collections={collections}
      categories={categories}
    />
  );
}
