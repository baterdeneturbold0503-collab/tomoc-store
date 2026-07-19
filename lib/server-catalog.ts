import "server-only";
import { products as fallbackProducts, type Product } from "./products";
import { getSupabaseAdmin } from "./supabase-server";

type DbProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  benefits: string[] | null;
  price: number;
  stock: number | null;
  images: string[] | null;
  is_active: boolean | null;
  is_featured: boolean | null;
  created_at: string | null;
  categories: { name: string } | { name: string }[] | null;
};

export function mapDbProduct(item: DbProduct): Product {
  const category = Array.isArray(item.categories)
    ? item.categories[0]?.name
    : item.categories?.name;
  const images = (item.images || []).filter(Boolean).slice(0, 8);
  const image = images[0] || "/images/tomoc-beauty-campaign.png";

  return {
    id: item.slug,
    name: item.name,
    category: category || "Бүтээгдэхүүн",
    price: item.price,
    benefit: item.benefits?.join(", ") || item.description || "",
    description: item.description || "",
    image,
    images: images.length ? images : [image],
    stock: item.stock ?? 0,
    isActive: item.is_active ?? true,
    isFeatured: Boolean(item.is_featured),
    badge: item.is_featured ? "Онцлох" : undefined,
  };
}

export async function getServerProducts(): Promise<Product[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return fallbackProducts;

  const { data, error } = await supabase
    .from("products")
    .select("id,name,slug,description,benefits,price,stock,images,is_active,is_featured,created_at,categories(name)")
    .eq("is_active", true)
    .order("is_featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data || data.length === 0) return fallbackProducts;
  return (data as unknown as DbProduct[]).map(mapDbProduct);
}

export async function getServerProduct(slug: string) {
  const catalog = await getServerProducts();
  return catalog.find((product) => product.id === slug) || null;
}
