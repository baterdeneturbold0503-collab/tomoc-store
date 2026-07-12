"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

const fallbackImage = "/images/tomoc-beauty-campaign.png";

export default function ProductGallery({name,images,badge}:{name:string;images?:string[];badge?:string}){
  const gallery=useMemo(()=>Array.from(new Set((images&&images.length?images:[fallbackImage]).map(image=>image?.trim()).filter(Boolean))).slice(0,8),[images]);
  const safeGallery=gallery.length?gallery:[fallbackImage];
  const [selected,setSelected]=useState(0);
  const [broken,setBroken]=useState<Record<string,boolean>>({});
  const current=safeGallery[Math.min(selected,safeGallery.length-1)]||fallbackImage;
  const showFallback=broken[current];
  return <div>
    <div className="relative aspect-[4/4.8] overflow-hidden rounded-[34px] bg-cloud">
      {showFallback?<div className="grid h-full w-full place-items-center p-8 text-center text-sm font-bold text-neutral-400">Зураг харагдахгүй байна</div>:<Image src={current} alt={name} fill priority sizes="(max-width:768px) 100vw, 55vw" className="object-cover" onError={()=>setBroken(previous=>({...previous,[current]:true}))}/>}
      {badge&&<span className="absolute left-5 top-5 rounded-full bg-white px-4 py-2 text-xs font-bold text-ink shadow">{badge}</span>}
      {safeGallery.length>1&&<span className="absolute bottom-5 right-5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-bold text-white backdrop-blur">{Math.min(selected,safeGallery.length-1)+1} / {safeGallery.length}</span>}
    </div>
    {safeGallery.length>1&&<div className="hide-scroll mt-4 flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-4 md:overflow-visible">
      {safeGallery.map((image,index)=><button key={`${image}-${index}`} type="button" onClick={()=>setSelected(index)} aria-label={`${name} зураг ${index+1} харах`} className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border transition md:h-24 md:w-full ${index===selected?"border-ink ring-2 ring-ink/10":"border-black/10 opacity-70 hover:opacity-100 dark:border-white/10"}`}>
        {broken[image]?<span className="grid h-full w-full place-items-center px-2 text-[10px] font-bold text-neutral-400">Зураг алга</span>:<Image src={image} alt="" fill sizes="96px" className="object-cover" onError={()=>setBroken(previous=>({...previous,[image]:true}))}/>}
        {index===0&&<span className="absolute left-1 top-1 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-black text-ink">Үндсэн</span>}
      </button>)}
    </div>}
  </div>
}
