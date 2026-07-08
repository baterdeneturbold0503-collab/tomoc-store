"use client";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/lib/products";
import { getSupabase } from "@/lib/supabase";
import { analyticsItem, trackItems } from "@/lib/analytics";

type CartItem = Product & { qty:number };
type Store = { cart:CartItem[]; wishlist:string[]; cartCount:number; wishCount:number; wishlistReady:boolean; add:(p:Product)=>void; remove:(id:string)=>void; setQty:(id:string,qty:number)=>void; toggleWish:(id:string,product?:Product)=>void; clear:()=>void };
const Ctx = createContext<Store | null>(null);

export function StoreProvider({children}:{children:React.ReactNode}) {
  const [cart,setCart] = useState<CartItem[]>([]),[wishlist,setWishlist] = useState<string[]>([]),[ready,setReady] = useState(false),[wishlistReady,setWishlistReady]=useState(false),[userId,setUserId]=useState<string|null>(null);
  const wishlistRef=useRef<string[]>([]);
  useEffect(()=>{wishlistRef.current=wishlist},[wishlist]);
  useEffect(()=>{ try { setCart(JSON.parse(localStorage.getItem("tomoc-cart")||"[]")); setWishlist(JSON.parse(localStorage.getItem("tomoc-wishlist")||"[]")); } finally { setReady(true); } },[]);
  useEffect(()=>{ if(ready){ localStorage.setItem("tomoc-cart",JSON.stringify(cart)); localStorage.setItem("tomoc-wishlist",JSON.stringify(wishlist)); } },[cart,wishlist,ready]);
  useEffect(()=>{if(!ready)return;const supabase=getSupabase();if(!supabase){setWishlistReady(true);return}let active=true;const sync=async(nextUserId:string|null)=>{if(!active)return;setUserId(nextUserId);if(!nextUserId){setWishlistReady(true);return}setWishlistReady(false);const local=wishlistRef.current;const {data}=await supabase.from("wishlists").select("product_id,products!inner(slug)").eq("user_id",nextUserId);const remote=(data||[]).map(row=>{const relation=(row as unknown as {products:{slug:string}|{slug:string}[]}).products;return Array.isArray(relation)?relation[0]?.slug:relation?.slug}).filter((slug):slug is string=>Boolean(slug));const merged=Array.from(new Set([...remote,...local]));if(local.length){const {data:rows}=await supabase.from("products").select("id,slug").in("slug",local);if(rows?.length)await supabase.from("wishlists").upsert(rows.map(row=>({user_id:nextUserId,product_id:row.id})),{onConflict:"user_id,product_id"})}if(active){setWishlist(merged);setWishlistReady(true)}};supabase.auth.getSession().then(({data})=>sync(data.session?.user.id||null));const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{void sync(session?.user.id||null)});return()=>{active=false;subscription.unsubscribe()}},[ready]);
  const persistWish=async(slug:string,adding:boolean)=>{const supabase=getSupabase();if(!supabase||!userId)return;const {data:product}=await supabase.from("products").select("id").eq("slug",slug).maybeSingle();if(!product)return;if(adding)await supabase.from("wishlists").upsert({user_id:userId,product_id:product.id},{onConflict:"user_id,product_id"});else await supabase.from("wishlists").delete().eq("user_id",userId).eq("product_id",product.id)};
  const value = useMemo(()=>({cart,wishlist,cartCount:cart.reduce((sum,item)=>sum+item.qty,0),wishCount:wishlist.length,wishlistReady,
    add:(product:Product)=>{trackItems("add_to_cart",[analyticsItem(product)],{},{dedupeMs:250});setCart(current=>current.some(item=>item.id===product.id)?current.map(item=>item.id===product.id?{...item,qty:item.qty+1}:item):[...current,{...product,qty:1}])},
    remove:(id:string)=>{const product=cart.find(item=>item.id===id);if(product)trackItems("remove_from_cart",[analyticsItem(product,product.qty)],{},{dedupeMs:250});setCart(current=>current.filter(item=>item.id!==id))},
    setQty:(id:string,qty:number)=>{const product=cart.find(item=>item.id===id),next=Math.max(1,qty);if(product&&next!==product.qty){const delta=Math.abs(next-product.qty);trackItems(next>product.qty?"add_to_cart":"remove_from_cart",[analyticsItem(product,delta)],{},{dedupeMs:250})}setCart(current=>current.map(item=>item.id===id?{...item,qty:next}:item))},
    toggleWish:(id:string,product?:Product)=>setWishlist(current=>{const adding=!current.includes(id);void persistWish(id,adding);const item=product?analyticsItem(product):{item_id:id,item_name:id,price:0,quantity:1};trackItems(adding?"wishlist_add":"wishlist_remove",[item],{},{dedupeMs:250});return adding?[...current,id]:current.filter(item=>item!==id)}),
    clear:()=>setCart([])
  }),[cart,wishlist,wishlistReady,userId]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useStore=()=>{ const c=useContext(Ctx); if(!c) throw new Error("StoreProvider missing"); return c; };
