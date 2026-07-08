"use client";
import Link from "next/link";
import { Heart } from "lucide-react";
import { useStore } from "./store-provider";

export default function WishlistLink({className=""}:{className?:string}){const {wishCount}=useStore();return <Link href="/wishlist" aria-label={`Хадгалсан бүтээгдэхүүн: ${wishCount}`} className={`relative grid h-11 w-11 place-items-center rounded-full transition hover:bg-cloud dark:hover:bg-neutral-800 ${className}`}><Heart size={20}/>{wishCount>0&&<b className="absolute right-0 top-0 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] text-white">{wishCount}</b>}</Link>}
