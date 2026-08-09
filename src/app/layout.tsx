import type { Metadata, Viewport } from "next";
import { Cairo, Fraunces, Heebo, Outfit } from "next/font/google";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: {
    default: "Cookies & More — Fresh cookies, cakes & boxes",
    template: "%s · Cookies & More",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "cookies",
    "كوكيز",
    "bakery",
    "handmade cookies",
    "cookie delivery",
    "build a box",
    "سينابون",
    "cinnamon rolls",
    "كعك",
    "cakes",
  ],
  authors: [{ name: "Cookies & More" }],
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "64x64", type: "image/x-icon" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Cookies & More — Shop cookies, cakes & boxes",
    description: SITE_DESCRIPTION,
    siteName: "Cookies & More",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cookies & More — Shop cookies & boxes",
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#964534",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${fraunces.variable} ${outfit.variable} ${cairo.variable} ${heebo.variable} antialiased`}
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
