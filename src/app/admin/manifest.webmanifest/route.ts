/**
 * A second web manifest, just for the admin panel.
 *
 * Next.js only treats `app/manifest.ts` as a manifest, and that one has to keep
 * `start_url: "/"` for the shop. Without this route, an admin who adds the
 * panel to their Home Screen gets an icon that opens the storefront.
 */
export const dynamic = "force-static";

export function GET() {
  const manifest = {
    id: "/admin",
    name: "Cookies & More — Admin",
    short_name: "Cookies Admin",
    description: "Orders, menu and sales for Cookies & More.",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#f3e6d4",
    theme_color: "#964534",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };

  return new Response(JSON.stringify(manifest, null, 2), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=0, must-revalidate",
    },
  });
}
