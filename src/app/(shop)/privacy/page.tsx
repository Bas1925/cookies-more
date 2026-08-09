import type { Metadata } from "next";
import PrivacyPolicy from "@/components/sections/PrivacyPolicy";
import Footer from "@/components/sections/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Cookies & More collects, uses, stores, and protects order information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <PrivacyPolicy />
      <Footer />
    </>
  );
}
