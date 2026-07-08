import "server-only";

type TokenResponse={access_token:string;expires_in?:number;expires_at?:string};
export type QPayInvoice={invoice_id:string;qr_text?:string;qr_image?:string;qPay_shortUrl?:string;urls?:{name?:string;description?:string;logo?:string;link?:string}[]};
export type QPayCheck={count?:number;paid_amount?:number;rows?:{payment_id?:string;payment_status?:string;payment_amount?:number;amount?:number}[]};

let tokenCache:{token:string;expiresAt:number}|null=null;
const baseUrl=()=>process.env.QPAY_BASE_URL|| (process.env.NODE_ENV==="production"?"https://merchant.qpay.mn":"https://merchant-sandbox.qpay.mn");
export const isQPayConfigured=()=>Boolean(process.env.QPAY_USERNAME&&process.env.QPAY_PASSWORD&&process.env.QPAY_INVOICE_CODE&&process.env.QPAY_CALLBACK_URL);

async function qpayFetch<T>(path:string,options:RequestInit={}){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);try{const response=await fetch(`${baseUrl()}${path}`,{...options,signal:controller.signal,cache:"no-store"});const text=await response.text();let data:unknown={};try{data=text?JSON.parse(text):{}}catch{data={message:text}}if(!response.ok)throw new Error(`QPAY_${response.status}:${JSON.stringify(data).slice(0,500)}`);return data as T}finally{clearTimeout(timer)}}

async function accessToken(){if(tokenCache&&tokenCache.expiresAt>Date.now()+60_000)return tokenCache.token;const username=process.env.QPAY_USERNAME,password=process.env.QPAY_PASSWORD;if(!username||!password)throw new Error("QPAY_NOT_CONFIGURED");const data=await qpayFetch<TokenResponse>("/v2/auth/token",{method:"POST",headers:{Authorization:`Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`}});if(!data.access_token)throw new Error("QPAY_TOKEN_MISSING");const expiresAt=data.expires_at?new Date(data.expires_at).getTime():Date.now()+(Number(data.expires_in)||3600)*1000;tokenCache={token:data.access_token,expiresAt};return data.access_token}

async function authorized<T>(path:string,options:RequestInit={}){const token=await accessToken();try{return await qpayFetch<T>(path,{...options,headers:{"content-type":"application/json",Authorization:`Bearer ${token}`,...options.headers}})}catch(error){if(error instanceof Error&&error.message.startsWith("QPAY_401")){tokenCache=null;const retryToken=await accessToken();return qpayFetch<T>(path,{...options,headers:{"content-type":"application/json",Authorization:`Bearer ${retryToken}`,...options.headers}})}throw error}}

export async function createQPayInvoice(input:{orderNumber:string;amount:number;description:string}){if(!isQPayConfigured())throw new Error("QPAY_NOT_CONFIGURED");const callback=new URL(process.env.QPAY_CALLBACK_URL!);callback.searchParams.set("order_number",input.orderNumber);return authorized<QPayInvoice>("/v2/invoice",{method:"POST",body:JSON.stringify({invoice_code:process.env.QPAY_INVOICE_CODE,sender_invoice_no:input.orderNumber,invoice_receiver_code:"terminal",invoice_description:input.description,amount:input.amount,callback_url:callback.toString()})})}
export async function checkQPayInvoice(invoiceId:string){return authorized<QPayCheck>("/v2/payment/check",{method:"POST",body:JSON.stringify({object_type:"INVOICE",object_id:invoiceId,offset:{page_number:1,page_limit:100}})})}
export async function cancelQPayInvoice(invoiceId:string){return authorized<Record<string,unknown>>(`/v2/invoice/${encodeURIComponent(invoiceId)}`,{method:"DELETE"})}

export function qpayPaidAmount(result:QPayCheck){const direct=Number(result.paid_amount)||0;if(direct>0)return Math.round(direct);return Math.round((result.rows||[]).filter(row=>!row.payment_status||row.payment_status.toUpperCase()==="PAID").reduce((sum,row)=>sum+(Number(row.payment_amount)||Number(row.amount)||0),0))}
export function qpayPaymentId(result:QPayCheck){return result.rows?.find(row=>!row.payment_status||row.payment_status.toUpperCase()==="PAID")?.payment_id||null}

