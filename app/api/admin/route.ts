import { NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin-auth";

export async function GET(request:Request){
  const auth=await authorizeAdmin(request);if(auth.error)return auth.error;const {supabase}=auth;
  const [{data:orders,error:orderError},{data:products,error:productError},{data:categories,error:categoryError},{data:reviews,error:reviewError},{data:coupons,error:couponError},{data:shippingMethods,error:shippingError}]=await Promise.all([supabase.from("orders").select("id,order_number,customer_name,phone,total,status,payment_status,created_at").order("created_at",{ascending:false}).limit(100),supabase.from("products").select("id,name,slug,description,benefits,price,stock,is_active,is_featured,images,category_id").order("created_at",{ascending:false}),supabase.from("categories").select("id,name,slug").eq("is_active",true).order("sort_order"),supabase.from("reviews").select("id,customer_name,rating,title,body,is_verified,moderation_status,created_at,products(name)").order("created_at",{ascending:false}).limit(200),supabase.from("coupons").select("id,code,discount_type,discount_value,min_order,max_uses,used_count,starts_at,expires_at,single_use,is_active").order("created_at",{ascending:false}),supabase.from("shipping_methods").select("id,zone_id,name,code,method_type,flat_rate,free_shipping_threshold,estimated_min_days,estimated_max_days,is_active,sort_order,shipping_zones(name,code)").order("sort_order")]);
  if(orderError||productError||categoryError||reviewError||couponError||shippingError)return NextResponse.json({error:orderError?.message||productError?.message||categoryError?.message||reviewError?.message||couponError?.message||shippingError?.message},{status:500});
  return NextResponse.json({orders,products,categories,reviews,coupons,shippingMethods,admin:auth.profile});
}

export async function POST(request:Request){
  const auth=await authorizeAdmin(request);if(auth.error)return auth.error;const {supabase}=auth;const body=await request.json();
  if(body.resource==="coupons"){
    const code=String(body.code||"").trim().toUpperCase().replace(/[^A-Z0-9_-]/g,"").slice(0,40),discountType=body.discount_type==="fixed"?"fixed":"percent",discountValue=Math.max(1,Math.round(Number(body.discount_value)||0)),minOrder=Math.max(0,Math.round(Number(body.min_order)||0)),maxUses=body.max_uses===null||body.max_uses===""?null:Math.max(1,Math.round(Number(body.max_uses)||1));
    if(!code||(discountType==="percent"&&discountValue>100))return NextResponse.json({error:"Купоны мэдээлэл буруу байна."},{status:400});
    const {data,error}=await supabase.from("coupons").insert({code,discount_type:discountType,discount_value:discountValue,min_order:minOrder,max_uses:maxUses,starts_at:body.starts_at||new Date().toISOString(),expires_at:body.expires_at||null,single_use:Boolean(body.single_use),is_active:Boolean(body.is_active)}).select().single();
    if(error)return NextResponse.json({error:error.code==="23505"?"Купоны код давхардсан байна.":error.message},{status:400});return NextResponse.json({coupon:data},{status:201});
  }
  const name=String(body.name||"").trim().slice(0,160),slug=String(body.slug||"").trim().toLowerCase().replace(/[^a-z0-9-]/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,160);
  const price=Math.max(0,Math.round(Number(body.price)||0)),stock=Math.max(0,Math.round(Number(body.stock)||0));
  if(!name||!slug||price<=0)return NextResponse.json({error:"Нэр, slug болон үнэ шаардлагатай."},{status:400});
  const images=Array.isArray(body.images)?body.images.filter((url:unknown)=>typeof url==="string").slice(0,8):[];
  const {data,error}=await supabase.from("products").insert({name,slug,description:String(body.description||"").slice(0,3000),benefits:Array.isArray(body.benefits)?body.benefits.map(String).slice(0,12):[],price,stock,images,category_id:body.category_id||null,is_active:Boolean(body.is_active),is_featured:Boolean(body.is_featured)}).select().single();
  if(error)return NextResponse.json({error:error.code==="23505"?"Slug давхардсан байна.":error.message},{status:400});return NextResponse.json({product:data},{status:201});
}

export async function PATCH(request:Request){
  const auth=await authorizeAdmin(request);if(auth.error)return auth.error;const {supabase}=auth;
  const body=await request.json();
  if(body.resource==="orders"){
    const allowed=["pending","confirmed","packing","shipped","delivered","cancelled","refunded"];
    if(!allowed.includes(body.status))return NextResponse.json({error:"Төлөв буруу байна."},{status:400});
    const {error}=await supabase.from("orders").update({status:body.status}).eq("id",body.id);if(error)return NextResponse.json({error:error.message},{status:500});
  }else if(body.resource==="products"){
    const price=Math.max(0,Math.round(Number(body.price)||0)),stock=Math.max(0,Math.round(Number(body.stock)||0));
    const payload:Record<string,unknown>={price,stock,is_active:Boolean(body.is_active),is_featured:Boolean(body.is_featured)};
    if(body.name)payload.name=String(body.name).trim().slice(0,160);if(body.description!==undefined)payload.description=String(body.description).slice(0,3000);if(Array.isArray(body.benefits))payload.benefits=body.benefits.map(String).slice(0,12);if(Array.isArray(body.images))payload.images=body.images.filter((url:unknown)=>typeof url==="string").slice(0,8);if(body.category_id!==undefined)payload.category_id=body.category_id||null;
    const {error}=await supabase.from("products").update(payload).eq("id",body.id);if(error)return NextResponse.json({error:error.message},{status:500});
  }else if(body.resource==="reviews"){
    if(!["approved","rejected"].includes(body.status))return NextResponse.json({error:"Moderation төлөв буруу байна."},{status:400});
    const {error}=await supabase.from("reviews").update({moderation_status:body.status}).eq("id",body.id);if(error)return NextResponse.json({error:error.message},{status:500});
  }else if(body.resource==="coupons"){
    const discountType=body.discount_type==="fixed"?"fixed":"percent",discountValue=Math.max(1,Math.round(Number(body.discount_value)||0));if(discountType==="percent"&&discountValue>100)return NextResponse.json({error:"Хувийн хөнгөлөлт 100-аас их байж болохгүй."},{status:400});
    const payload={discount_type:discountType,discount_value:discountValue,min_order:Math.max(0,Math.round(Number(body.min_order)||0)),max_uses:body.max_uses===null||body.max_uses===""?null:Math.max(1,Math.round(Number(body.max_uses)||1)),starts_at:body.starts_at||new Date().toISOString(),expires_at:body.expires_at||null,single_use:Boolean(body.single_use),is_active:Boolean(body.is_active)};
    const {error}=await supabase.from("coupons").update(payload).eq("id",body.id);if(error)return NextResponse.json({error:error.message},{status:500});
  }else if(body.resource==="shipping_methods"){
    const minDays=Math.max(0,Math.round(Number(body.estimated_min_days)||0)),maxDays=Math.max(minDays,Math.round(Number(body.estimated_max_days)||0));
    const payload={name:String(body.name||"").trim().slice(0,120),flat_rate:Math.max(0,Math.round(Number(body.flat_rate)||0)),free_shipping_threshold:body.free_shipping_threshold===null||body.free_shipping_threshold===""?null:Math.max(0,Math.round(Number(body.free_shipping_threshold)||0)),estimated_min_days:minDays,estimated_max_days:maxDays,is_active:Boolean(body.is_active)};
    if(!payload.name)return NextResponse.json({error:"Хүргэлтийн нэр шаардлагатай."},{status:400});const {error}=await supabase.from("shipping_methods").update(payload).eq("id",body.id);if(error)return NextResponse.json({error:error.message},{status:500});
  }else return NextResponse.json({error:"Resource буруу байна."},{status:400});
  return NextResponse.json({ok:true});
}

export async function DELETE(request:Request){
  const auth=await authorizeAdmin(request);if(auth.error)return auth.error;const {supabase}=auth;const url=new URL(request.url),id=url.searchParams.get("id"),resource=url.searchParams.get("resource")||"products";if(!id)return NextResponse.json({error:"ID шаардлагатай."},{status:400});
  if(!["products","reviews","coupons"].includes(resource))return NextResponse.json({error:"Resource буруу байна."},{status:400});
  const {error}=await supabase.from(resource).delete().eq("id",id);if(error)return NextResponse.json({error:error.message},{status:500});return NextResponse.json({ok:true});
}
