import "server-only";
import { products as fallbackProducts, type Product } from "./products";
import { getSupabaseAdmin } from "./supabase-server";

type DbProduct={id:string;name:string;slug:string;description:string|null;benefits:string[]|null;price:number;images:string[]|null;is_featured:boolean|null;categories:{name:string}|{name:string}[]|null};
export function mapDbProduct(item:DbProduct):Product{
  const category=Array.isArray(item.categories)?item.categories[0]?.name:item.categories?.name;
  const images=(item.images||[]).filter(Boolean).slice(0,8);
  const image=images[0]||"/images/tomoc-beauty-campaign.png";
  return {id:item.slug,name:item.name,category:category||"Бүтээгдэхүүн",price:item.price,benefit:item.benefits?.join(", ")||item.description||"",description:item.description||"",image,images:images.length?images:[image],badge:item.is_featured?"Онцлох":undefined};
}export async function getServerProducts():Promise<Product[]>{
  const supabase=getSupabaseAdmin();if(!supabase)return fallbackProducts;
  const {data,error}=await supabase.from("products").select("id,name,slug,description,benefits,price,images,is_featured,categories(name)").eq("is_active",true).order("created_at",{ascending:false});
  if(error||!data)return fallbackProducts;return (data as unknown as DbProduct[]).map(mapDbProduct);
}
export async function getServerProduct(slug:string){const catalog=await getServerProducts();return catalog.find(product=>product.id===slug)||null}
