"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { markAnalyticsReady, setAnalyticsConsent, trackEvent } from "@/lib/analytics";

type Consent="accepted"|"rejected"|null;
const key="tomoc-analytics-consent";

export default function AnalyticsConsent({gaId,metaPixelId}:{gaId?:string;metaPixelId?:string}){
  const pathname=usePathname(),[consent,setConsent]=useState<Consent>(null),[hydrated,setHydrated]=useState(false),[gaReady,setGaReady]=useState(!gaId),[metaReady,setMetaReady]=useState(!metaPixelId);
  useEffect(()=>{const stored=localStorage.getItem(key) as Consent;const value=stored==="accepted"||stored==="rejected"?stored:null;setConsent(value);setAnalyticsConsent(value==="accepted");setHydrated(true)},[]);
  useEffect(()=>{const open=()=>setConsent(null);window.addEventListener("tomoc:open-consent",open);return()=>window.removeEventListener("tomoc:open-consent",open)},[]);
  useEffect(()=>{if(consent==="accepted"&&gaReady&&metaReady){markAnalyticsReady();trackEvent("page_view",{page_path:pathname,page_location:`${window.location.origin}${pathname}`,page_title:document.title},{dedupeKey:`page_view:${pathname}`,dedupeMs:500})}},[pathname,consent,gaReady,metaReady]);
  const choose=(value:Exclude<Consent,null>)=>{localStorage.setItem(key,value);setAnalyticsConsent(value==="accepted");setConsent(value)};
  return <>
    {consent==="accepted"&&<>
      {gaId&&<><Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="lazyOnload"/><Script id="tomoc-ga4" strategy="lazyOnload" onReady={()=>setGaReady(true)}>{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('consent','default',{analytics_storage:'granted',ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'});gtag('js',new Date());gtag('config','${gaId}',{send_page_view:false,anonymize_ip:true});`}</Script></>}
      {metaPixelId&&<Script id="tomoc-meta-pixel" strategy="lazyOnload" onReady={()=>setMetaReady(true)}>{`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');`}</Script>}
    </>}
    {hydrated&&consent===null&&<aside role="dialog" aria-modal="false" aria-label="Аналитик зөвшөөрөл" className="fixed inset-x-3 bottom-24 z-[70] mx-auto max-w-3xl rounded-[24px] border border-black/10 bg-white p-5 text-ink shadow-2xl md:bottom-5 md:flex md:items-center md:gap-6 dark:border-white/10 dark:bg-neutral-900 dark:text-white"><div className="flex-1"><b className="text-sm">Таны нууцлалыг хүндэтгэнэ</b><p className="mt-1 text-xs leading-5 text-neutral-500">Сайтын хэрэглээ болон сурталчилгааны үр дүнг хэмжих GA4, Meta Pixel-ийг зөвхөн таны зөвшөөрлөөр ачаална. Хувийн мэдээлэл илгээхгүй.</p></div><div className="mt-4 grid grid-cols-2 gap-2 md:mt-0 md:shrink-0"><button onClick={()=>choose("rejected")} className="btn h-10 px-4 text-xs">Татгалзах</button><button onClick={()=>choose("accepted")} className="btn btn-black h-10 px-4 text-xs">Зөвшөөрөх</button></div></aside>}
  </>;
}
