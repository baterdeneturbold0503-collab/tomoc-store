import { NextResponse } from "next/server";
import { defaultSiteContent, normalizeSiteContent } from "@/lib/site-content";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStore = { "cache-control": "no-store, no-cache, must-revalidate" };

export async function GET() {
  const supabase = getSupabaseAdmin();
  if (!supabase) return NextResponse.json({ content: defaultSiteContent }, { headers: noStore });
  const { data, error } = await supabase.from("site_content").select("value").eq("key", "homepage").maybeSingle();
  if (error || !data?.value) {
    if (error) console.error("[site-content]", { message: error.message, code: error.code });
    return NextResponse.json({ content: defaultSiteContent, error: error?.message }, { headers: noStore });
  }
  return NextResponse.json({ content: normalizeSiteContent(data.value) }, { headers: noStore });
}
