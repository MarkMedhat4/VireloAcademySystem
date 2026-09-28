import type { MetadataRoute } from "next";

/** Keeps crawlers out of the admin area. NOTE: this is not security — real protection is Supabase Auth + RLS. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/admin/"] }],
  };
}
