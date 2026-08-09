import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Cookies & More",
    short_name: "Cookies & More",
    description:
      "Fresh cookies, cakes and cinnamon rolls for delivery or pickup.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3e6d4",
    theme_color: "#964534",
    icons: [
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
