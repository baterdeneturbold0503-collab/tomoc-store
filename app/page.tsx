import Storefront from "@/components/storefront";
import { defaultSiteContent, normalizeSiteContent } from "@/lib/site-content";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(): Promise<Metadata> {
  const supabase = getSupabaseAdmin();
  const { data } = supabase
    ? await supabase.from("site_content").select("value").eq("key", "homepage").maybeSingle()
    : { data: null };
  const content = normalizeSiteContent(data?.value);
  const image = content.socialShareImage || content.heroImage || defaultSiteContent.socialShareImage;
  return {
    title: content.heroTitle || "TOMOC Store",
    description: content.heroSubtitle,
    openGraph: {
      title: content.heroTitle,
      description: content.heroSubtitle,
      images: [{ url: image, alt: "TOMOC Store" }],
    },
    twitter: {
      card: "summary_large_image",
      title: content.heroTitle,
      description: content.heroSubtitle,
      images: [image],
    },
  };
}

export default function Page(){return <Storefront/>}
