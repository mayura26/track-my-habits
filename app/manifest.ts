import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Track My Habits",
    short_name: "Habits",
    description:
      "An atmospheric habit tracker for rituals, streaks, and steady progress.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#191019",
    theme_color: "#191019",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
