import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";

export async function POST(request:Request){
  const supabase=getSupabaseAdmin();if(!supabase)return NextResponse.json({error:"Захиалгын систем тохируулагдаагүй байна."},{status:503});
  let body:{orderNumber?:string;phone?:string};try{body=await request.json()}catch{return NextResponse.json({error:"Хүсэлтийн формат буруу байна."},{status:400})}
  const orderNumber=body.orderNumber?.trim().toUpperCase().slice(0,30),phone=body.phone?.replace(/\s/g,"").slice(0,30);
  if(!orderNumber||!phone)return NextResponse.json({error:"Захиалгын дугаар болон утсаа оруулна уу."},{status:400});
  const {data:order,error}=await supabase.from("orders").select("id,order_number,customer_name,phone,total,status,payment_status,created_at,shipping_address,order_items(product_name,quantity,unit_price)").eq("order_number",orderNumber).eq("phone",phone).maybeSingle();
  if(error)return NextResponse.json({error:"Захиалга шалгахад алдаа гарлаа."},{status:500});
  if(!order)return NextResponse.json({error:"Тохирох захиалга олдсонгүй."},{status:404});
  const {data:history}=await supabase.from("order_status_history").select("status,created_at").eq("order_id",order.id).order("created_at",{ascending:true});
  return NextResponse.json({order:{orderNumber:order.order_number,customerName:order.customer_name,total:order.total,status:order.status,paymentStatus:order.payment_status,createdAt:order.created_at,items:order.order_items||[],history:history||[]}});
}
