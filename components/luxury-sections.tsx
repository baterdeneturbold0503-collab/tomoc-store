"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Check, MessageCircle, ShieldCheck, ShoppingBag, Sparkles, Star, Truck } from "lucide-react";
import { money, products, type Product } from "@/lib/products";
import { whatsappUrl } from "@/lib/store-config";

const reveal = {
  initial: { opacity: 0, y: 26 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: "easeOut" as const },
};

export function LuxuryShowcase({ onProduct,title,subtitle,image="/images/tomoc-beauty-campaign.png" }:{ onProduct:(product:Product)=>void;title?:string;subtitle?:string;image?:string }) {
  const heroProduct = products[0];
  return <section className="section overflow-hidden">
    <div className="container">
      <motion.div {...reveal} className="luxury-panel relative overflow-hidden rounded-[38px] bg-[#171512] text-white">
        <div className="grid min-h-[680px] md:grid-cols-[.88fr_1.12fr]">
          <div className="relative z-10 flex flex-col justify-between p-8 md:p-14 lg:p-16">
            <div><span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.24em] text-[#d6bd91]"><Sparkles size={14}/> TOMOC SIGNATURE</span><h2 className="display-serif mt-7 text-[48px] leading-[.92] tracking-[-.045em] md:text-[72px]">{title||"Үсний тань өдөр тутмын жижиг luxury."}</h2><p className="mt-7 max-w-md text-[16px] leading-7 text-white/65">{subtitle||"Зөөлөн цэвэрлэгээ, тэжээллэг арчилгаа, торгомсог мэдрэмжийг нэг энгийн ritual болгон хувирга."}</p></div>
            <div className="mt-10"><div className="mb-6 flex items-end gap-3"><b className="text-3xl">{money(heroProduct.price)}</b><span className="pb-1 text-xs text-white/45">Монголд бэлэн</span></div><button onClick={()=>onProduct(heroProduct)} className="btn bg-white text-ink"><ShoppingBag size={17}/> Дэлгэрэнгүй харах</button></div>
          </div>
          <div className="relative min-h-[500px] overflow-hidden md:min-h-full"><Image src={image} alt="TOMOC үс арчилгааны luxury campaign" fill sizes="(max-width:768px) 100vw, 58vw" className="object-cover object-center"/><div className="absolute inset-0 bg-gradient-to-t from-[#171512]/70 via-transparent to-transparent md:bg-gradient-to-r md:from-[#171512]/55 md:via-transparent"/><div className="absolute bottom-6 right-6 rounded-2xl border border-white/20 bg-black/20 px-4 py-3 backdrop-blur-xl"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/55">Daily ritual</p><p className="mt-1 text-sm font-semibold">Nourish • Soften • Shine</p></div></div>
        </div>
      </motion.div>
    </div>
  </section>;
}

export function RoutineComparison({beforeImage="/images/tomoc-beauty-campaign.png",afterImage="/images/tomoc-beauty-campaign.png"}:{beforeImage?:string;afterImage?:string}) {
  return <section className="section bg-[#f3efe9] dark:bg-neutral-900">
    <div className="container">
      <motion.div {...reveal} className="mx-auto max-w-3xl text-center"><span className="eyebrow">Тогтмол арчилгааны мэдрэмж</span><h2 className="title display-serif">Өмнөхөөсөө илүү зөөлөн. Илүү арчилсан.</h2><p className="subtitle">Үсэндээ тохирсон бүтээгдэхүүнийг тогтмол хэрэглэхэд өдөр тутмын мэдрэмж хэрхэн өөрчлөгдөж болохыг харьцууллаа.</p></motion.div>
      <div className="mt-12 grid gap-4 md:grid-cols-2">
        <motion.article {...reveal} className="relative min-h-[520px] overflow-hidden rounded-[34px] bg-[#cbc3b8]"><Image src={beforeImage} alt="Арчилгааны өмнөх мэдрэмжийн жишээ" fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover object-[58%_center] grayscale opacity-65"/><div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent"/><div className="absolute inset-x-0 bottom-0 p-7 text-white md:p-9"><span className="text-[11px] font-bold uppercase tracking-[.22em] text-white/60">Өмнө</span><h3 className="display-serif mt-2 text-4xl">Хуурай, барзгар мэдрэмж</h3><p className="mt-3 max-w-md text-sm leading-6 text-white/65">Чийг дутагдсан үед үс самнахад төвөгтэй, үзүүр хэсгээрээ хуурай мэдрэгдэж болно.</p></div></motion.article>
        <motion.article {...reveal} transition={{...reveal.transition,delay:.08}} className="relative min-h-[520px] overflow-hidden rounded-[34px] bg-[#d8c5aa]"><Image src={afterImage} alt="Тогтмол арчилгааны дараах мэдрэмжийн жишээ" fill sizes="(max-width:768px) 100vw, 50vw" className="object-cover object-[58%_center]"/><div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent"/><div className="absolute inset-x-0 bottom-0 p-7 text-white md:p-9"><span className="text-[11px] font-bold uppercase tracking-[.22em] text-[#ead5af]">Дараа</span><h3 className="display-serif mt-2 text-4xl">Зөөлөн, гялалзсан харагдац</h3><p className="mt-3 max-w-md text-sm leading-6 text-white/70">Тогтмол тэжээллэг арчилгаа нь үсийг илүү зөөлөн, самнахад эвтэйхэн мэдрүүлэхэд тусална.</p></div></motion.article>
      </div>
      <p className="mt-4 text-center text-[11px] leading-5 text-neutral-500">Зураг нь арчилгааны мэдрэмжийг дүрслэн харуулсан болно. Үр дүн үсний төрөл, хэрэглээнээс шалтгаалан хүн бүрт харилцан адилгүй.</p>
    </div>
  </section>;
}

export function LuxuryTestimonials() {
  const reviews = [
    ["Түр байршуулалт", "Энэ хэсэгт бодит худалдан авагчдын баталгаажсан сэтгэгдэл нэмэгдэнэ."],
    ["Түр байршуулалт", "Бүтээгдэхүүн хэрэглэсэн бодит үнэлгээ, зурагтай review-г удахгүй оруулна."],
    ["Түр байршуулалт", "Одоогоор demo бүтэц харуулж байна. Жинхэнэ хэрэглэгчийн сэтгэгдлээр солино."],
  ];
  return <section id="reviews" className="section">
    <div className="container"><motion.div {...reveal} className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><span className="eyebrow">TOMOC COMMUNITY</span><h2 className="title display-serif">Хэрэглэгчийн сэтгэгдэл удахгүй.</h2><p className="subtitle mt-3 max-w-2xl">Доорх картууд нь түр байршуулсан загвар бөгөөд бодит худалдан авагчдын баталгаажсан сэтгэгдэл нэмэгдмэгц солино.</p></div><div className="rounded-full bg-amber-50 px-4 py-2 text-xs font-bold uppercase tracking-[.12em] text-amber-800">Түр контент</div></motion.div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">{reviews.map(([name,quote],index)=><motion.article key={`${name}-${index}`} {...reveal} transition={{...reveal.transition,delay:index*.07}} className="rounded-[28px] border border-black/[.07] bg-white p-7 shadow-[0_20px_70px_rgba(35,24,13,.06)] dark:border-white/10 dark:bg-neutral-900"><div className="flex text-[#b48a52]">{[0,1,2,3,4].map(i=><Star key={i} size={15} fill="currentColor"/>)}</div><blockquote className="display-serif mt-7 min-h-36 text-[25px] leading-[1.25]">“{quote}”</blockquote><div className="mt-7 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-full bg-[#eee7dd] text-sm font-bold text-[#6f5635]">{name[0]}</span><div><b className="text-sm">{name}</b><p className="text-[11px] text-neutral-500">Түр контент • Бодит сэтгэгдлээр солино</p></div></div></motion.article>)}</div>
    </div>
  </section>;
}

export function LuxuryTrustStrip() {
  const items=[[Truck,"24–48 цагийн хүргэлт"],[ShieldCheck,"Чанарын баталгаа"],[Check,"Монголд бэлэн"],[MessageCircle,"Шуурхай зөвлөгөө"]] as const;
  return <section className="border-y border-black/[.07] bg-[#fbfaf8] py-5 dark:border-white/10 dark:bg-neutral-950"><div className="container grid grid-cols-2 gap-y-5 md:grid-cols-4">{items.map(([Icon,label])=><div key={label} className="flex items-center justify-center gap-3 px-2 text-center text-xs font-bold uppercase tracking-[.08em]"><Icon size={18} strokeWidth={1.6} className="text-[#a17d4f]"/>{label}</div>)}</div></section>;
}

export function MobileBuyBar({ onBuy }:{ onBuy:()=>void }) {
  return <div className="fixed inset-x-0 bottom-0 z-40 border-t border-black/10 bg-white/95 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))] shadow-[0_-12px_40px_rgba(0,0,0,.12)] backdrop-blur-xl md:hidden dark:border-white/10 dark:bg-neutral-950/95"><div className="mx-auto flex max-w-md items-center gap-3"><div className="min-w-0 flex-1"><p className="truncate text-[11px] text-neutral-500">Argan Oil Nourishing Shampoo</p><b className="text-base">{money(products[0].price)}</b></div><a href={whatsappUrl} target="_blank" rel="noreferrer" aria-label="WhatsApp-аар захиалах" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#25D366] text-white"><MessageCircle size={20}/></a><button onClick={onBuy} className="flex h-12 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white dark:bg-white dark:text-ink"><ShoppingBag size={17}/> Худалдаж авах</button></div></div>;
}
