"use client";
import type { Product } from "./products";

export type AnalyticsEventName="page_view"|"view_item"|"view_item_list"|"search"|"select_item"|"add_to_cart"|"remove_from_cart"|"begin_checkout"|"add_shipping_info"|"add_payment_info"|"purchase"|"refund"|"wishlist_add"|"wishlist_remove"|"login"|"sign_up";
export type AnalyticsItem={item_id:string;item_name:string;price:number;quantity?:number;item_category?:string};
type EventPayload={name:AnalyticsEventName;params:Record<string,unknown>;key:string;createdAt:number};

declare global{interface Window{dataLayer?:unknown[];gtag?:(...args:unknown[])=>void;fbq?:(...args:unknown[])=>void;tomocAnalyticsConsent?:boolean;tomocAnalyticsReady?:boolean;tomocAnalyticsQueue?:EventPayload[]}}

const metaEvents:Partial<Record<AnalyticsEventName,string>>={page_view:"PageView",view_item:"ViewContent",add_to_cart:"AddToCart",remove_from_cart:"RemoveFromCart",begin_checkout:"InitiateCheckout",purchase:"Purchase",search:"Search",wishlist_add:"AddToWishlist"};
const dedupe=new Map<string,number>();
const forbiddenKey=/^(email|phone|telephone|address|shipping_address|customer_name|first_name|last_name|full_name|password|ip|user_id)$/i;

export const analyticsItem=(product:Product,quantity=1):AnalyticsItem=>({item_id:product.id,item_name:product.name,price:product.price,quantity,item_category:product.category});
function sanitize(value:unknown,key=""):unknown{if(forbiddenKey.test(key))return undefined;if(Array.isArray(value))return value.map(item=>sanitize(item)).filter(item=>item!==undefined);if(value&&typeof value==="object"){return Object.fromEntries(Object.entries(value as Record<string,unknown>).map(([childKey,child])=>[childKey,sanitize(child,childKey)]).filter(([,child])=>child!==undefined))}if(typeof value==="string"&&(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)||/^\+?[\d\s()-]{8,}$/.test(value)))return undefined;if(["string","number","boolean"].includes(typeof value)||value===null)return value;return undefined}
function eventKey(name:AnalyticsEventName,params:Record<string,unknown>,explicit?:string){return explicit||`${name}:${String(params.transaction_id||params.search_term||params.item_list_id||params.item_id||"")}:${JSON.stringify(params.items||[])}`}
function dispatch(event:EventPayload){window.gtag?.("event",event.name,event.params);const metaName=metaEvents[event.name];if(metaName)window.fbq?.("track",metaName,event.params,{eventID:event.key});else window.fbq?.("trackCustom",event.name,event.params,{eventID:event.key})}

export function setAnalyticsConsent(granted:boolean){if(typeof window==="undefined")return;window.tomocAnalyticsConsent=granted;if(!granted){window.tomocAnalyticsReady=false;window.tomocAnalyticsQueue=[]}}
export function markAnalyticsReady(){if(typeof window==="undefined"||!window.tomocAnalyticsConsent)return;window.tomocAnalyticsReady=true;const queue=window.tomocAnalyticsQueue||[];window.tomocAnalyticsQueue=[];queue.forEach(dispatch);window.dispatchEvent(new Event("tomoc:analytics-ready"))}
export function trackEvent(name:AnalyticsEventName,params:Record<string,unknown>={},options:{dedupeKey?:string;dedupeMs?:number;oncePerSession?:boolean}={}){if(typeof window==="undefined"||!window.tomocAnalyticsConsent)return;const safe=(sanitize(params) as Record<string,unknown>)||{},key=eventKey(name,safe,options.dedupeKey),now=Date.now();if(options.oncePerSession&&sessionStorage.getItem(`tomoc-event:${key}`))return;const previous=dedupe.get(key)||0;if(now-previous<(options.dedupeMs??1000))return;dedupe.set(key,now);if(options.oncePerSession)sessionStorage.setItem(`tomoc-event:${key}`,"1");const event={name,params:safe,key,createdAt:now};if(window.tomocAnalyticsReady)dispatch(event);else{window.tomocAnalyticsQueue=window.tomocAnalyticsQueue||[];window.tomocAnalyticsQueue.push(event)}}
export function trackItems(name:AnalyticsEventName,items:AnalyticsItem[],extra:Record<string,unknown>={},options:{dedupeKey?:string;dedupeMs?:number;oncePerSession?:boolean}={}){const value=items.reduce((sum,item)=>sum+item.price*(item.quantity||1),0);trackEvent(name,{currency:"MNT",value,items,content_ids:items.map(item=>item.item_id),contents:items.map(item=>({id:item.item_id,quantity:item.quantity||1,item_price:item.price})),content_type:"product",...extra},options)}
