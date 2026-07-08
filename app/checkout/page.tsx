import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import CheckoutForm from "@/components/checkout-form";

export const metadata:Metadata={title:"Захиалга баталгаажуулах",description:"TOMOC Store-ийн хурдан, найдвартай захиалгын хэсэг.",robots:{index:false,follow:false}};
export default function CheckoutPage(){return <main className="min-h-screen bg-[#f4f1ec] py-5 dark:bg-neutral-950 md:py-12"><div className="container max-w-2xl"><div className="mb-5 flex items-center justify-between"><Link href="/#products" className="flex items-center gap-2 text-sm font-bold"><ArrowLeft size={17}/> Дэлгүүр рүү</Link><div className="flex items-center gap-2 text-xs font-bold text-neutral-500"><LockKeyhole size={15}/> Аюулгүй захиалга</div></div><section className="rounded-[30px] bg-[var(--bg)] p-5 shadow-soft md:p-9"><CheckoutForm/></section></div></main>}
