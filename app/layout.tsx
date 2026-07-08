import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { StoreProvider } from "@/components/store-provider";
import AnalyticsConsent from "@/components/analytics-consent";

const site = process.env.NEXT_PUBLIC_SITE_URL || "https://tomoc-store.vercel.app";
export const metadata: Metadata = {
  metadataBase: new URL(site), title:{ default:"TOMOC Store — Өдөр тутмын luxury арчилгаа", template:"%s | TOMOC Store" },
  description:"TOMOC Store-ийн premium үс арчилгаа, гоо сайхан болон эмэгтэй загварын сонголт. Монголд бэлэн бараа, Улаанбаатарт 24–48 цагийн хүргэлт.",
  keywords:["TOMOC Store","үс арчилгаа","арган шампунь","гоо сайхан","premium beauty Mongolia","Монгол онлайн дэлгүүр"],
  alternates:{canonical:"/"},
  openGraph:{ type:"website", locale:"mn_MN", url:site, siteName:"TOMOC Store", title:"Өөртөө итгэх итгэлийг өдөр бүр мэдрээрэй", description:"Чанартай бүтээгдэхүүн • Түргэн хүргэлт • Баталгаатай үйлчилгээ", images:[{url:"/images/tomoc-hero.png",width:1536,height:1024,alt:"TOMOC Store premium collection"}] },
  twitter:{card:"summary_large_image",title:"TOMOC Store",description:"Гоо сайхан, загварын premium сонголт",images:["/images/tomoc-hero.png"]}, robots:{index:true,follow:true}
};

export default function RootLayout({children}:{children:React.ReactNode}) {
  const ga=process.env.NEXT_PUBLIC_GA4_ID, pixel=process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const schema={"@context":"https://schema.org","@type":"Store",name:"TOMOC Store",url:site,description:"Гоо сайхан, загварын premium онлайн дэлгүүр",areaServed:"MN",currenciesAccepted:"MNT",paymentAccepted:"Bank transfer, QPay"};
  return <html lang="mn" suppressHydrationWarning data-scroll-behavior="smooth"><body><StoreProvider>{children}</StoreProvider><AnalyticsConsent gaId={ga} metaPixelId={pixel}/>
    <Script id="schema" type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema)}} />
  </body></html>;
}
