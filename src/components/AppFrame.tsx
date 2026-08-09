"use client";

import type { ReactNode } from "react";
import { CartProvider } from "@/lib/cart-context";
import { CatalogProvider } from "@/lib/catalog-context";
import { LanguageProvider } from "@/lib/language-context";
import SmoothScroll from "./SmoothScroll";
import Preloader from "./Preloader";
import Navbar from "./Navbar";
import CartDrawer from "./CartDrawer";

export default function AppFrame({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <CatalogProvider>
        <CartProvider>
          <SmoothScroll>
            <Preloader />
            <Navbar />
            <main id="main">{children}</main>
            <CartDrawer />
          </SmoothScroll>
        </CartProvider>
      </CatalogProvider>
    </LanguageProvider>
  );
}
