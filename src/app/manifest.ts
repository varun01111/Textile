import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Textile Client Conversation Intelligence",
    short_name: "Textile Intelligence",
    description:
      "Consent-based textile conversation capture, analysis, and export for personal business use.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f7f2eb",
    theme_color: "#b55e2d",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "64x64",
        type: "image/x-icon",
      },
    ],
  };
}
