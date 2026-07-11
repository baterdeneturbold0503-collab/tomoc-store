import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

const WRONG_VERCEL_SUPABASE_MESSAGE =
  "Vercel дээр Supabase тохиргоо буруу байна. NEXT_PUBLIC_SUPABASE_URL болон NEXT_PUBLIC_SUPABASE_ANON_KEY-г шалгана уу.";

export function getSupabasePublicDiagnostics() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const details: string[] = [];

  if (!url) {
    details.push("NEXT_PUBLIC_SUPABASE_URL байхгүй байна.");
  } else {
    if (/abcde/i.test(url)) details.push("NEXT_PUBLIC_SUPABASE_URL placeholder утгатай хэвээр байна.");
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) details.push("NEXT_PUBLIC_SUPABASE_URL Supabase Project URL форматтай биш байна.");
  }

  if (!key) {
    details.push("NEXT_PUBLIC_SUPABASE_ANON_KEY байхгүй байна.");
  } else {
    if (key.includes("…") || !/^[\x21-\x7E]+$/.test(key)) details.push("NEXT_PUBLIC_SUPABASE_ANON_KEY дотор буруу тэмдэгт байна.");
    if (key.startsWith("sb_secret_")) details.push("NEXT_PUBLIC_SUPABASE_ANON_KEY дээр service role/secret key тавьж болохгүй.");
  }

  return details;
}

export function getSupabasePublicConfigError() {
  const details = getSupabasePublicDiagnostics();
  if (!details.length) return null;
  return `${WRONG_VERCEL_SUPABASE_MESSAGE} ${details.join(" ")}`;
}

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (getSupabasePublicConfigError() || !url || !key) return null;
  if (!client) client = createClient(url, key);
  return client;
}
