import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { commerceError, customerHash, sanitizeItems } from "@/lib/commerce";
import { cancelQPayInvoice, createQPayInvoice, isQPayConfigured, type QPayInvoice } from "@/lib/qpay";

type OrderRequest={customerName?:string;phone?:string;email?:string;location?:string;address?:string;notes?:string;website?:string;items?:{id?:string;qty?:number}[];couponCode?:string;shippingMethodId?:string;paymentMethod?:string};
const clean=(value:unknown,max=300)=>typeof value==="string"?value.trim().slice(0,max):"";

export async function POST(request:Request){
  let body:OrderRequest;
  try{body=await request.json()}catch{return NextResponse.json({error:"Хүсэлтийн формат буруу байна."},{status:400})}
  if(body.website)return NextResponse.json({error:"Invalid request"},{status:400});
  const customerName=clean(body.customerName,80),phone=clean(body.phone,30),location=clean(body.location,40),address=clean(body.address,300),notes=clean(body.notes,500),email=clean(body.email,120);
  if(!customerName||!phone||!address||!Array.isArray(body.items)||body.items.length===0)return NextResponse.json({error:"Захиалгын мэдээлэл дутуу байна."},{status:400});
  const supabase=getSupabaseAdmin();
  if(!supabase)return NextResponse.json({error:"Захиалгын систем түр тохируулагдаагүй байна. Админтай холбогдоно уу."},{status:503});
  const requested=sanitizeItems(body.items);
  if(!requested.length)return NextResponse.json({error:"Бүтээгдэхүүн олдсонгүй."},{status:400});
  if(!body.shippingMethodId)return NextResponse.json({error:"Хүргэлтийн арга сонгоно уу."},{status:400});
  const paymentMethod=body.paymentMethod==="qpay"?"qpay":"bank_transfer";
  if(paymentMethod==="qpay"&&!isQPayConfigured())return NextResponse.json({error:"QPay төлбөрийн тохиргоо хийгдээгүй байна."},{status:503});
  let userId:string|null=null;const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");if(token){const {data}=await supabase.auth.getUser(token);userId=data.user?.id||null}
  const orderNumber=`TOM-${Date.now().toString().slice(-8)}`;
  const {data,error}=await supabase.rpc("create_store_order",{p_order_number:orderNumber,p_customer_name:customerName,p_phone:phone,p_email:email,p_shipping_address:{location,address},p_notes:notes,p_items:requested,p_coupon_code:clean(body.couponCode,40).toUpperCase(),p_shipping_method_id:body.shippingMethodId,p_customer_hash:customerHash(phone),p_payment_provider:paymentMethod,p_user_id:userId});
  if(error){const mapped=commerceError(error.message);return NextResponse.json({error:mapped.message,detail:process.env.NODE_ENV==="development"?error.message:undefined},{status:mapped.status})}
  const quote={subtotal:data?.subtotal,discount:data?.discount,shippingFee:data?.shipping_fee,total:data?.total,shippingMethod:data?.shipping_method,estimatedMinDays:data?.estimated_min_days,estimatedMaxDays:data?.estimated_max_days};
  if(paymentMethod==="qpay"){
    let invoice:QPayInvoice|undefined;
    try{invoice=await createQPayInvoice({orderNumber,amount:data.total,description:`TOMOC Store ${orderNumber}`});const {error:invoiceError}=await supabase.from("qpay_invoices").insert({order_id:data.id,invoice_id:invoice.invoice_id,qr_text:invoice.qr_text||null,qpay_short_url:invoice.qPay_shortUrl||null,status:"pending",raw_response:invoice});if(invoiceError)throw invoiceError;const qrImage=invoice.qr_image?(invoice.qr_image.startsWith("data:")?invoice.qr_image:`data:image/png;base64,${invoice.qr_image}`):null;return NextResponse.json({orderNumber,orderId:data.id,persisted:true,quote,qpay:{invoiceId:invoice.invoice_id,qrText:invoice.qr_text||null,qrImage,shortUrl:invoice.qPay_shortUrl||null,urls:invoice.urls||[]}})}catch(cause){if(invoice?.invoice_id)try{await cancelQPayInvoice(invoice.invoice_id)}catch{}await supabase.rpc("rollback_store_order",{p_order_id:data.id});return NextResponse.json({error:"QPay нэхэмжлэл үүсгэж чадсангүй. Түр хүлээгээд дахин оролдоно уу.",detail:process.env.NODE_ENV==="development"&&cause instanceof Error?cause.message:undefined},{status:502})}
  }
  return NextResponse.json({orderNumber:data?.order_number||orderNumber,orderId:data?.id,persisted:true,quote});
}
