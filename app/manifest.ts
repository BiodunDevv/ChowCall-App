import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ChowCall",
    short_name: "ChowCall",
    description: "Professional call management for modern restaurants.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    theme_color: "#000000",
    background_color: "#ffffff",
    icons: [
      {
        src: "/chowcall-logo.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
