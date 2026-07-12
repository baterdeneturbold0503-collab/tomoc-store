import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin-auth";

const jsonError = (error: string, status = 400) => NextResponse.json({ error }, { status });
const slugify = (value: unknown) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 160);
const cleanImages = (value: unknown) =>
  Array.isArray(value)
    ? value
        .filter((url): url is string => typeof url === "string" && Boolean(url.trim()))
        .map((url) => url.trim())
        .slice(0, 8)
    : [];
const productError = (message: string) => `Бүтээгдэхүүн хадгалахад алдаа гарлаа: ${message}`;
const schemaHint = (message: string) => (message.includes("column") ? `Supabase products table-ийн багана зөрж байна: ${message}` : message);
const logProductAdmin = (action: string, details: Record<string, unknown>) => console.error("[admin-products]", { action, ...details });

export async function GET(request: Request) {
  const auth = await authorizeAdmin(request);
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const [
    { data: orders, error: orderError },
    { data: products, error: productErrorResult },
    { data: categories, error: categoryError },
    { data: reviews, error: reviewError },
    { data: coupons, error: couponError },
    { data: shippingMethods, error: shippingError },
  ] = await Promise.all([
    supabase.from("orders").select("id,order_number,customer_name,phone,total,status,payment_status,created_at").order("created_at", { ascending: false }).limit(100),
    supabase.from("products").select("id,name,slug,description,benefits,price,stock,is_active,is_featured,images,category_id").order("created_at", { ascending: false }),
    supabase.from("categories").select("id,name,slug").eq("is_active", true).order("sort_order"),
    supabase.from("reviews").select("id,customer_name,rating,title,body,is_verified,moderation_status,created_at,products(name)").order("created_at", { ascending: false }).limit(200),
    supabase.from("coupons").select("id,code,discount_type,discount_value,min_order,max_uses,used_count,starts_at,expires_at,single_use,is_active").order("starts_at", { ascending: false }).order("code", { ascending: true }),
    supabase.from("shipping_methods").select("id,zone_id,name,code,method_type,flat_rate,free_shipping_threshold,estimated_min_days,estimated_max_days,is_active,sort_order,shipping_zones(name,code)").order("sort_order"),
  ]);
  const error = orderError || productErrorResult || categoryError || reviewError || couponError || shippingError;
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ orders, products, categories, reviews, coupons, shippingMethods, admin: auth.profile });
}

export async function POST(request: Request) {
  const auth = await authorizeAdmin(request);
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const body = await request.json();

  if (body.resource === "coupons") {
    const code = String(body.code || "").trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 40);
    const discountType = body.discount_type === "fixed" ? "fixed" : "percent";
    const discountValue = Math.max(1, Math.round(Number(body.discount_value) || 0));
    const minOrder = Math.max(0, Math.round(Number(body.min_order) || 0));
    const maxUses = body.max_uses === null || body.max_uses === "" ? null : Math.max(1, Math.round(Number(body.max_uses) || 1));
    if (!code || (discountType === "percent" && discountValue > 100)) return jsonError("Купоны мэдээлэл буруу байна.");
    const { data, error } = await supabase
      .from("coupons")
      .insert({ code, discount_type: discountType, discount_value: discountValue, min_order: minOrder, max_uses: maxUses, starts_at: body.starts_at || new Date().toISOString(), expires_at: body.expires_at || null, single_use: Boolean(body.single_use), is_active: Boolean(body.is_active) })
      .select()
      .single();
    if (error) return jsonError(error.code === "23505" ? "Купоны код давхардсан байна." : error.message);
    return NextResponse.json({ coupon: data }, { status: 201 });
  }

  const name = String(body.name || "").trim().slice(0, 160);
  const slug = slugify(body.slug);
  const price = Math.max(0, Math.round(Number(body.price) || 0));
  const stock = Math.max(0, Math.round(Number(body.stock) || 0));
  const images = cleanImages(body.images);
  if (!name) { logProductAdmin("create_validation", { slug, reason: "missing_name" }); return jsonError("Нэр оруулна уу"); }
  if (!slug) { logProductAdmin("create_validation", { slug, reason: "missing_slug" }); return jsonError("Slug оруулна уу"); }
  if (price <= 0) { logProductAdmin("create_validation", { slug, reason: "invalid_price" }); return jsonError("Үнэ зөв оруулна уу"); }
  if (!body.category_id) { logProductAdmin("create_validation", { slug, reason: "missing_category" }); return jsonError("Ангилал сонгоно уу"); }
  if (!images.length) { logProductAdmin("create_validation", { slug, reason: "missing_image" }); return jsonError("Зурагны холбоос оруулна уу"); }
  const { data, error } = await supabase
    .from("products")
    .insert({ name, slug, description: String(body.description || "").slice(0, 3000), benefits: Array.isArray(body.benefits) ? body.benefits.map(String).slice(0, 12) : [], price, stock, images, category_id: body.category_id, is_active: Boolean(body.is_active), is_featured: Boolean(body.is_featured) })
    .select()
    .single();
  if (error) {
    logProductAdmin("create_error", { slug, code: error.code, message: error.message });
    return jsonError(error.code === "23505" ? "Slug давхардсан байна. Өөр нэр оруулна уу." : productError(schemaHint(error.message)));
  }
  return NextResponse.json({ product: data }, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await authorizeAdmin(request);
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const body = await request.json();

  if (body.resource === "orders") {
    const allowed = ["pending", "confirmed", "packing", "shipped", "delivered", "cancelled", "refunded"];
    if (!allowed.includes(body.status)) return jsonError("Төлөв буруу байна.");
    const { error } = await supabase.from("orders").update({ status: body.status }).eq("id", body.id);
    if (error) return jsonError(error.message, 500);
  } else if (body.resource === "products") {
    const id = String(body.id || "").trim();
    const name = String(body.name || "").trim().slice(0, 160);
    const price = Math.max(0, Math.round(Number(body.price) || 0));
    const stock = Math.max(0, Math.round(Number(body.stock) || 0));
    const images = cleanImages(body.images);
    if (!id) { logProductAdmin("update_validation", { reason: "missing_id" }); return jsonError("Бүтээгдэхүүний ID олдсонгүй."); }
    if (!name) { logProductAdmin("update_validation", { id, reason: "missing_name" }); return jsonError("Нэр оруулна уу"); }
    if (price <= 0) { logProductAdmin("update_validation", { id, reason: "invalid_price" }); return jsonError("Үнэ зөв оруулна уу"); }
    if (!body.category_id) { logProductAdmin("update_validation", { id, reason: "missing_category" }); return jsonError("Ангилал сонгоно уу"); }
    if (!images.length) { logProductAdmin("update_validation", { id, reason: "missing_image" }); return jsonError("Зурагны холбоос оруулна уу"); }
    const payload = {
      name,
      price,
      stock,
      is_active: Boolean(body.is_active),
      is_featured: Boolean(body.is_featured),
      description: String(body.description || "").slice(0, 3000),
      benefits: Array.isArray(body.benefits) ? body.benefits.map(String).slice(0, 12) : [],
      images,
      category_id: body.category_id,
    };
    const { data, error } = await supabase.from("products").update(payload).eq("id", id).select("id").single();
    if (error) {
      logProductAdmin("update_error", { id, code: error.code, message: error.message });
      return jsonError(productError(schemaHint(error.message)), 500);
    }
    if (!data) return jsonError("Бүтээгдэхүүн олдсонгүй.", 404);
  } else if (body.resource === "reviews") {
    if (!["approved", "rejected"].includes(body.status)) return jsonError("Moderation төлөв буруу байна.");
    const { error } = await supabase.from("reviews").update({ moderation_status: body.status }).eq("id", body.id);
    if (error) return jsonError(error.message, 500);
  } else if (body.resource === "coupons") {
    const discountType = body.discount_type === "fixed" ? "fixed" : "percent";
    const discountValue = Math.max(1, Math.round(Number(body.discount_value) || 0));
    if (discountType === "percent" && discountValue > 100) return jsonError("Хувийн хөнгөлөлт 100-аас их байж болохгүй.");
    const payload = {
      discount_type: discountType,
      discount_value: discountValue,
      min_order: Math.max(0, Math.round(Number(body.min_order) || 0)),
      max_uses: body.max_uses === null || body.max_uses === "" ? null : Math.max(1, Math.round(Number(body.max_uses) || 1)),
      starts_at: body.starts_at || new Date().toISOString(),
      expires_at: body.expires_at || null,
      single_use: Boolean(body.single_use),
      is_active: Boolean(body.is_active),
    };
    const { error } = await supabase.from("coupons").update(payload).eq("id", body.id);
    if (error) return jsonError(error.message, 500);
  } else if (body.resource === "shipping_methods") {
    const minDays = Math.max(0, Math.round(Number(body.estimated_min_days) || 0));
    const maxDays = Math.max(minDays, Math.round(Number(body.estimated_max_days) || 0));
    const payload = {
      name: String(body.name || "").trim().slice(0, 120),
      flat_rate: Math.max(0, Math.round(Number(body.flat_rate) || 0)),
      free_shipping_threshold: body.free_shipping_threshold === null || body.free_shipping_threshold === "" ? null : Math.max(0, Math.round(Number(body.free_shipping_threshold) || 0)),
      estimated_min_days: minDays,
      estimated_max_days: maxDays,
      is_active: Boolean(body.is_active),
    };
    if (!payload.name) return jsonError("Хүргэлтийн нэр шаардлагатай.");
    const { error } = await supabase.from("shipping_methods").update(payload).eq("id", body.id);
    if (error) return jsonError(error.message, 500);
  } else {
    return jsonError("Resource буруу байна.");
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await authorizeAdmin(request);
  if (auth.error) return auth.error;
  const { supabase } = auth;
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const resource = url.searchParams.get("resource") || "products";
  if (!id) return jsonError("ID шаардлагатай.");
  if (!["products", "reviews", "coupons"].includes(resource)) return jsonError("Resource буруу байна.");
  if (resource === "products") {
    const { data, error } = await supabase.from("products").update({ is_active: false }).eq("id", id).select("id").single();
    if (error) {
      logProductAdmin("deactivate_error", { id, code: error.code, message: error.message });
      return jsonError(`Бүтээгдэхүүн нуухад алдаа гарлаа: ${schemaHint(error.message)}`, 500);
    }
    if (!data) return jsonError("Бүтээгдэхүүн олдсонгүй.", 404);
    return NextResponse.json({ ok: true, deactivated: true });
  }
  const { error } = await supabase.from(resource).delete().eq("id", id);
  if (error) return jsonError(error.message, 500);
  return NextResponse.json({ ok: true });
}
