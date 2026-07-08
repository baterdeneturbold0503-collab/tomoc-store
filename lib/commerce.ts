import "server-only";
import { createHmac } from "node:crypto";

export type CheckoutItem={slug:string;qty:number};
export type CheckoutQuote={subtotal:number;discount:number;shipping_fee:number;total:number;coupon_code:string|null;shipping_method_id:string;shipping_method:string;estimated_min_days:number;estimated_max_days:number};

export function customerHash(phone:string){const secret=process.env.SUPABASE_SERVICE_ROLE_KEY||"tomoc-development";return createHmac("sha256",secret).update(phone.replace(/\D/g,"")).digest("hex")}

export function commerceError(message:string){
  if(message.includes("INSUFFICIENT_STOCK"))return {message:"Бүтээгдэхүүний үлдэгдэл хүрэлцэхгүй байна.",status:409};
  if(message.includes("PRODUCT_NOT_FOUND"))return {message:"Зарим бүтээгдэхүүн олдсонгүй эсвэл идэвхгүй байна.",status:404};
  if(message.includes("COUPON_INVALID"))return {message:"Купоны код буруу эсвэл идэвхгүй байна.",status:400};
  if(message.includes("COUPON_NOT_STARTED"))return {message:"Энэ купоны хугацаа эхлээгүй байна.",status:400};
  if(message.includes("COUPON_EXPIRED"))return {message:"Купоны хүчинтэй хугацаа дууссан байна.",status:400};
  if(message.includes("COUPON_LIMIT"))return {message:"Купоны ашиглах дээд хязгаар дууссан байна.",status:409};
  if(message.includes("COUPON_MIN_ORDER")){const amount=message.split(":")[1]?.replace(/\D/g,"");return {message:`Купон ашиглах доод худалдан авалт ${amount||"шаардлагатай"}₮ байна.`,status:400}}
  if(message.includes("COUPON_PHONE_REQUIRED"))return {message:"Нэг удаагийн купон шалгахад утасны дугаар шаардлагатай.",status:400};
  if(message.includes("COUPON_ALREADY_USED"))return {message:"Та энэ нэг удаагийн купоныг өмнө ашигласан байна.",status:409};
  if(message.includes("SHIPPING_METHOD_INVALID"))return {message:"Хүргэлтийн сонголт олдсонгүй.",status:400};
  return {message:"Тооцоолол хийхэд алдаа гарлаа.",status:500};
}

export function sanitizeItems(items:unknown):CheckoutItem[]{return Array.isArray(items)?items.slice(0,20).map(item=>{const value=item as {id?:unknown;slug?:unknown;qty?:unknown};return {slug:String(value.slug||value.id||"").slice(0,160),qty:Math.max(1,Math.min(10,Math.round(Number(value.qty)||1)))}}).filter(item=>item.slug):[]}
