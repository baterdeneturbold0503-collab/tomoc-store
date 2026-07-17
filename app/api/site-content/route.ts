import { NextResponse } from "next/server";
import { defaultSiteContent, normalizeSiteContent } from "@/lib/site-content";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ content: defaultSiteContent });
  const { data, error } = await supabase.from("site_content").select("value").eq("key", "homepage").maybeSingle();
  if (error || !data?.value) return NextResponse.json({ content: defaultSiteContent });
  return NextResponse.json({ content: normalizeSiteContent(data.value) }, { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
