import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { notFound } from "next/navigation";
import ProductActions from "@/components/product-actions";
import ProductGallery from "@/components/product-gallery";
import ProductReviews from "@/components/product-reviews";
import RecentlyViewed from "@/components/recently-viewed";
import WishlistLink from "@/components/wishlist-link";
import { money } from "@/lib/products";
import { getServerProduct, getServerProducts } from "@/lib/server-catalog";

export const dynamic="force-dynamic";
export const revalidate=0;

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
  const {slug}=await params; const product=await getServerProduct(slug);
  if(!product)return {title:"Бүтээгдэхүүн олдсонгүй"};
  return {title:product.name,description:product.description,openGraph:{title:`${product.name} | TOMOC Store`,description:product.benefit,images:(product.images?.length?product.images:[product.image]).map(url=>({url,alt:product.name}))},alternates:{canonical:`/products/${product.id}`}};
}

export default async function ProductPage({params}:{params:Promise<{slug:string}>}){
  const {slug}=await params; const product=await getServerProduct(slug); if(!product)notFound();
  const catalog=await getServerProducts();const related=catalog.filter(item=>item.id!==product.id&&item.category===product.category).slice(0,3);
  const productImages=product.images?.length?product.images:[product.image];
  const stockLabel=typeof product.stock==="number"?(product.stock>0?`Бэлэн: ${product.stock} ширхэг`:"Дууссан"):"Бэлэн бараа";
  const schema={"@context":"https://schema.org","@type":"Product",name:product.name,image:productImages,description:product.description,brand:{"@type":"Brand",name:"TOMOC Store"},offers:{"@type":"Offer",priceCurrency:"MNT",price:product.price,availability:"https://schema.org/InStock",url:`${process.env.NEXT_PUBLIC_SITE_URL||"http://localhost:3000"}/products/${product.id}`}};
  return <main className="min-h-screen bg-[var(--bg)]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}}/>
    <header className="border-b border-black/[.06] dark:border-white/10"><div className="container flex h-20 items-center justify-between"><Link href="/#products" className="flex items-center gap-2 text-sm font-bold"><ArrowLeft size={17}/> Буцах</Link><Link href="/" className="text-xl font-black tracking-[-.05em]">TOMOC<span className="text-gold">.</span></Link><div className="flex items-center gap-1"><WishlistLink/><Link href="/checkout" className="px-2 text-sm font-bold">Сагс</Link></div></div></header>
    <section className="container grid gap-10 py-8 md:grid-cols-[1.06fr_.94fr] md:items-start md:py-16">
      <ProductGallery name={product.name} images={productImages} badge={product.badge}/>
      <div className="md:sticky md:top-28"><span className="eyebrow">{product.category}</span><h1 className="display-serif mt-4 text-[48px] leading-[.95] tracking-[-.045em] md:text-[66px]">{product.name}</h1><p className="mt-6 text-[17px] leading-7 text-neutral-500">{product.description}</p><div className="mt-6 text-3xl font-bold">{money(product.price)}</div><div className="my-7 grid grid-cols-3 gap-2 text-center text-[11px] font-bold"><div className="card p-3"><Truck className="mx-auto mb-2" size={19}/>24–48 цаг</div><div className="card p-3"><ShieldCheck className="mx-auto mb-2" size={19}/>Баталгаатай</div><div className="card p-3"><Check className="mx-auto mb-2" size={19}/>{stockLabel}</div></div><ProductActions product={product}/><div className="mt-8 border-t border-black/10 pt-7 dark:border-white/10"><h2 className="flex items-center gap-2 font-bold"><Sparkles size={18} className="text-gold"/> Гол давуу тал</h2><p className="mt-3 leading-7 text-neutral-500">{product.benefit}</p></div></div>
    </section>
    <ProductReviews slug={product.id}/>
    {related.length>0&&<section className="section bg-cloud dark:bg-neutral-900"><div className="container"><span className="eyebrow">ИЖИЛ АНГИЛАЛ</span><h2 className="display-serif mt-3 text-4xl">Танд бас таалагдаж магадгүй</h2><div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{related.map(item=><Link href={`/products/${item.id}`} key={item.id} className="group"><div className="relative aspect-square overflow-hidden rounded-3xl bg-white"><Image src={item.image} alt={item.name} fill sizes="(max-width:640px) 100vw, 33vw" className="object-cover transition duration-500 group-hover:scale-105"/></div><h3 className="mt-4 font-bold">{item.name}</h3><p className="mt-1 text-sm text-neutral-500">{money(item.price)}</p></Link>)}</div></div></section>}
    <RecentlyViewed currentSlug={product.id} catalog={catalog}/>
  </main>
}
