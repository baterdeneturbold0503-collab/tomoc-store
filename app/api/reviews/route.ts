import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

type ReviewRow={id:string;customer_name:string;rating:number;title:string|null;body:string;is_verified:boolean;created_at:string};
type OrderItem={product_id:string|null};

const clean=(value:unknown,max:number)=>typeof value==="string"?value.trim().slice(0,max):"";
const normalizePhone=(value:string)=>value.replace(/\D/g,"");

function summarize(reviews:ReviewRow[]){
  const distribution:Record<number,number>={1:0,2:0,3:0,4:0,5:0};
  reviews.forEach(review=>distribution[review.rating]=(distribution[review.rating]||0)+1);
  const average=reviews.length?Number((reviews.reduce((sum,review)=>sum+review.rating,0)/reviews.length).toFixed(1)):0;
  return {average,total:reviews.length,distribution};
}

export async function GET(request:Request){
  const slug=new URL(request.url).searchParams.get("product")?.trim().slice(0,160);
  if(!slug)return NextResponse.json({error:"Бүтээгдэхүүн шаардлагатай."},{status:400});
  const supabase=getSupabaseAdmin();
  if(!supabase)return NextResponse.json({reviews:[],summary:summarize([])});
  const {data:product}=await supabase.from("products").select("id").eq("slug",slug).eq("is_active",true).maybeSingle();
  if(!product)return NextResponse.json({error:"Бүтээгдэхүүн олдсонгүй."},{status:404});
  const {data,error}=await supabase.from("reviews").select("id,customer_name,rating,title,body,is_verified,created_at").eq("product_id",product.id).eq("moderation_status","approved").order("created_at",{ascending:false});
  if(error)return NextResponse.json({error:"Сэтгэгдэл ачаалж чадсангүй."},{status:500});
  const reviews=(data||[]) as ReviewRow[];
  return NextResponse.json({reviews,summary:summarize(reviews)},{headers:{"cache-control":"public, s-maxage=60, stale-while-revalidate=300"}});
}

export async function POST(request:Request){
  const supabase=getSupabaseAdmin();
  const secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!supabase||!secret)return NextResponse.json({error:"Сэтгэгдлийн систем тохируулагдаагүй байна."},{status:503});
  let body:Record<string,unknown>;
  try{body=await request.json()}catch{return NextResponse.json({error:"Хүсэлтийн формат буруу байна."},{status:400})}
  const slug=clean(body.product,160),orderNumber=clean(body.orderNumber,30).toUpperCase(),phone=clean(body.phone,30),customerName=clean(body.customerName,80),title=clean(body.title,120),reviewBody=clean(body.body,1500);
  const rating=Math.round(Number(body.rating));
  if(!slug||!orderNumber||!phone||!reviewBody||reviewBody.length<10||!Number.isInteger(rating)||rating<1||rating>5)return NextResponse.json({error:"Үнэлгээ, захиалгын мэдээлэл болон 10-аас дээш тэмдэгттэй сэтгэгдэл шаардлагатай."},{status:400});

  const [{data:product},{data:order,error:orderError}]=await Promise.all([
    supabase.from("products").select("id").eq("slug",slug).eq("is_active",true).maybeSingle(),
    supabase.from("orders").select("id,customer_name,phone,status,order_items(product_id)").eq("order_number",orderNumber).maybeSingle(),
  ]);
  if(!product)return NextResponse.json({error:"Бүтээгдэхүүн олдсонгүй."},{status:404});
  if(orderError||!order||normalizePhone(order.phone)!==normalizePhone(phone))return NextResponse.json({error:"Захиалгын дугаар эсвэл утас тохирохгүй байна."},{status:403});
  if(["cancelled","refunded"].includes(order.status))return NextResponse.json({error:"Цуцлагдсан захиалгад сэтгэгдэл үлдээх боломжгүй."},{status:400});
  const items=(order.order_items||[]) as OrderItem[];
  if(!items.some(item=>item.product_id===product.id))return NextResponse.json({error:"Энэ бүтээгдэхүүн таны захиалгад байхгүй байна."},{status:403});

  let userId:string|null=null;
  const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");
  if(token){const {data}=await supabase.auth.getUser(token);userId=data.user?.id||null}
  const reviewerHash=createHmac("sha256",secret).update(normalizePhone(phone)).digest("hex");
  const {error}=await supabase.from("reviews").insert({product_id:product.id,user_id:userId,order_id:order.id,customer_name:customerName||order.customer_name,rating,title:title||null,body:reviewBody,is_verified:true,is_approved:false,moderation_status:"pending",reviewer_hash:reviewerHash});
  if(error?.code==="23505")return NextResponse.json({error:"Та энэ бүтээгдэхүүнд аль хэдийн сэтгэгдэл үлдээсэн байна."},{status:409});
  if(error)return NextResponse.json({error:"Сэтгэгдэл хадгалж чадсангүй."},{status:500});
  return NextResponse.json({ok:true,message:"Сэтгэгдэл хүлээн авлаа. Админ баталсны дараа нийтлэгдэнэ."},{status:201});
}
