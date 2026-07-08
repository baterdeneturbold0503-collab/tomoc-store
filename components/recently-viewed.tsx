"use client";

import Image from "next/image";
import Link from "next/link";
import { Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { money, type Product } from "@/lib/products";

const storageKey="tomoc-recently-viewed";

export default function RecentlyViewed({currentSlug,catalog}:{currentSlug:string;catalog:Product[]}){
  const [items,setItems]=useState<Product[]>([]);
  useEffect(()=>{try{const previous=JSON.parse(localStorage.getItem(storageKey)||"[]") as string[];setItems(previous.filter(slug=>slug!==currentSlug).map(slug=>catalog.find(product=>product.id===slug)).filter((product):product is Product=>Boolean(product)).slice(0,4));const next=[currentSlug,...previous.filter(slug=>slug!==currentSlug)].slice(0,8);localStorage.setItem(storageKey,JSON.stringify(next))}catch{setItems([])}},[currentSlug,catalog]);
  if(!items.length)return null;
  return <section className="section" aria-labelledby="recently-viewed-title"><div className="container"><div className="flex items-center gap-3"><Clock3 className="text-gold" size={20}/><div><span className="eyebrow">ТАНЫ ҮЗСЭН</span><h2 id="recently-viewed-title" className="display-serif mt-2 text-4xl">Сүүлд үзсэн бүтээгдэхүүн</h2></div></div><div className="hide-scroll mt-8 flex snap-x gap-4 overflow-x-auto pb-3">{items.map(item=><Link href={`/products/${item.id}`} key={item.id} className="group w-[72vw] max-w-[270px] shrink-0 snap-start"><div className="relative aspect-[4/4.6] overflow-hidden rounded-3xl bg-cloud dark:bg-neutral-900"><Image src={item.image} alt={item.name} fill sizes="270px" className="object-cover transition duration-500 group-hover:scale-105"/></div><h3 className="mt-4 truncate font-bold">{item.name}</h3><p className="mt-1 text-sm text-neutral-500">{money(item.price)}</p></Link>)}</div></div></section>;
}
