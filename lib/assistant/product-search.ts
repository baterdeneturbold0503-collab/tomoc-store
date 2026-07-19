import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import type { AssistantProduct, ProductVariant } from "./types";
import { normalizeText } from "./intent";

type DbProduct = {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  benefits: string[] | null;
  price: number;
  stock: number | null;
  images: string[] | null;
};

type DbVariant = {
  product_id: string;
  name: string;
  value: string;
  stock: number | null;
  price_delta: number | null;
};

const builtInAliases: Record<string, string[]> = {
  "ann-chery": ["ann chery", "annchery", "анн чери", "анн чэри", "аннчери", "анн чери корсет", "латекс корсет", "корсет"],
};

export function searchableText(product: AssistantProduct) {
  const aliases = builtInAliases[product.slug] || [];
  return normalizeText([
    product.name,
    product.slug,
    product.category || "",
    product.description,
    ...product.benefits,
    ...aliases,
  ].join(" "));
}

function scoreProduct(message: string, product: AssistantProduct) {
  const text = normalizeText(message);
  const haystack = searchableText(product);
  const aliases = (builtInAliases[product.slug] || []).map(normalizeText);
  let score = 0;
  if (normalizeText(product.name) && text.includes(normalizeText(product.name))) score += 100;
  if (text.includes(normalizeText(product.slug))) score += 90;
  if (aliases.some((alias) => text.includes(alias))) score += 95;
  for (const token of text.split(" ").filter((token) => token.length >= 3)) {
    if (haystack.includes(token)) score += token.length > 4 ? 12 : 6;
  }
  return score;
}

export async function loadProductKnowledgeBase(): Promise<AssistantProduct[]> {
  const supabase =
    getSupabaseAdmin() ||
    (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
          auth: { autoRefreshToken: false, persistSession: false },
        })
      : null);
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("products")
    .select("id,category_id,name,slug,description,benefits,price,stock,images")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(80);

  if (error || !data?.length) return [];

  const ids = data.map((item) => item.id);
  const categoryIds = Array.from(new Set(data.map((item) => item.category_id).filter(Boolean)));
  const [{ data: variants }, { data: categories }] = await Promise.all([
    supabase.from("product_variants").select("product_id,name,value,stock,price_delta").in("product_id", ids),
    categoryIds.length ? supabase.from("categories").select("id,name").in("id", categoryIds) : Promise.resolve({ data: [] }),
  ]);

  const categoryMap = new Map((categories || []).map((item) => [item.id, item.name]));

  const variantMap = new Map<string, ProductVariant[]>();
  for (const item of (variants || []) as DbVariant[]) {
    const list = variantMap.get(item.product_id) || [];
    list.push({
      name: item.name,
      value: item.value,
      stock: item.stock ?? 0,
      priceDelta: item.price_delta ?? 0,
    });
    variantMap.set(item.product_id, list);
  }

  return (data as unknown as DbProduct[]).map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description || "",
    benefits: item.benefits || [],
    price: item.price,
    stock: item.stock ?? 0,
    images: item.images || [],
    category: item.category_id ? categoryMap.get(item.category_id) : undefined,
    variants: variantMap.get(item.id) || [],
  }));
}

export function findProduct(message: string, products: AssistantProduct[], activeProductId?: string): AssistantProduct | null {
  const scored = products
    .map((product) => ({ product, score: scoreProduct(message, product) }))
    .sort((a, b) => b.score - a.score);
  if (scored[0]?.score >= 18) return scored[0].product;
  if (activeProductId) return products.find((product) => product.id === activeProductId) || null;
  return null;
}
