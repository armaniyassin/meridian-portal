import type { NextConfig } from "next";
// Keep cacheComponents / partialPrefetching OFF: they conflict with revalidate and our Supabase cache.
const nextConfig: NextConfig = {};
export default nextConfig;
