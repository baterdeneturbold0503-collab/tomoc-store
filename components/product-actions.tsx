"use client";

import Link from "next/link";
import { Check, Heart, MessageCircle, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/products";
import { whatsappUrl } from "@/lib/store-config";
import { useStore } from "./store-provider";
import { analyticsItem, trackItems } from "@/lib/analytics";

export default function ProductActions({product}:{product:Product}){
  const {add,toggleWish,wishlist}=useStore();
  const [added,setAdded]=useState(false);
  useEffect(()=>{const track=()=>trackItems("view_item",[analyticsItem(product)],{},{dedupeKey:`view_item:${product.id}`,dedupeMs:1000});track();window.addEventListener("tomoc:analytics-ready",track);return()=>window.removeEventListener("tomoc:analytics-ready",track)},[product]);
  const addProduct=()=>{add(product);setAdded(true);window.setTimeout(()=>setAdded(false),1800)};
  const message=encodeURIComponent(`Сайн байна уу! ${product.name} бүтээгдэхүүний талаар дэлгэрэнгүй мэдээлэл авъя.`);
  return <div className="space-y-3">
    <button onClick={addProduct} className="btn btn-black w-full">{added?<><Check size={18}/> Сагсанд нэмэгдлээ</>:<><ShoppingBag size={18}/> Сагсанд нэмэх</>}</button>
    <div className="grid grid-cols-[1fr_auto] gap-3"><Link href="/checkout" onClick={()=>add(product)} className="btn bg-[#b59662] text-white">Шууд захиалах</Link><button aria-label="Хадгалах" onClick={()=>toggleWish(product.id,product)} className="grid h-[52px] w-[52px] place-items-center rounded-full border border-[var(--line)]"><Heart size={20} fill={wishlist.includes(product.id)?"currentColor":"none"}/></button></div>
    <a href={`${whatsappUrl}?text=${message}`} target="_blank" rel="noreferrer" className="btn w-full bg-[#25D366] text-white"><MessageCircle size={18}/> WhatsApp-аар асуух</a>
  </div>
}
