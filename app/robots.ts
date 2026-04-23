import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/about", "/songs/"],
        disallow: ["/controlpanel/"],
      },
    ],
    sitemap: "https://www.beatsbykai.com/sitemap.xml",
  };
}
