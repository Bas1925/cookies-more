import type { ReactNode } from "react";
import AppFrame from "@/components/AppFrame";

export default function ShopLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <AppFrame>{children}</AppFrame>
    </>
  );
}
