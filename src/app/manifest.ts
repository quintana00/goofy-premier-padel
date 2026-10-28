import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Goofy Premier Padel",
    short_name: "Goofy Padel",
    description: "El ranking oficial (y despiadado) de La Tropa Goofy",
    start_url: "/",
    display: "standalone",
    background_color: "#0c1530",
    theme_color: "#0c1530",
    icons: [{ src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" }],
  };
}
