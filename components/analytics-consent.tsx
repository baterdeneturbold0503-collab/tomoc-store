"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { markAnalyticsReady, setAnalyticsConsent, trackEvent } from "@/lib/analytics";

type StoredConsent = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

const key = "tomoc-cookie-preferences";
const legacyKey = "tomoc-analytics-consent";

const defaultConsent: StoredConsent = {
  necessary: true,
  analytics: false,
  marketing: false,
};

function readConsent(): StoredConsent | null {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<StoredConsent>;
      return {
        necessary: true,
        analytics: Boolean(parsed.analytics),
        marketing: Boolean(parsed.marketing),
      };
    }
    const legacy = localStorage.getItem(legacyKey);
    if (legacy === "accepted") return { necessary: true, analytics: true, marketing: true };
    if (legacy === "rejected") return defaultConsent;
  } catch {}
  return null;
}

export default function AnalyticsConsent({ gaId, metaPixelId }: { gaId?: string; metaPixelId?: string }) {
  const pathname = usePathname();
  const [consent, setConsent] = useState<StoredConsent | null>(null);
  const [draft, setDraft] = useState<StoredConsent>(defaultConsent);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [gaReady, setGaReady] = useState(!gaId);
  const [metaReady, setMetaReady] = useState(!metaPixelId);
  const analyticsAllowed = Boolean(consent?.analytics);
  const marketingAllowed = Boolean(consent?.marketing);

  useEffect(() => {
    const stored = readConsent();
    setConsent(stored);
    setDraft(stored || defaultConsent);
    setAnalyticsConsent(Boolean(stored?.analytics));
    setIsOpen(!stored);
    setHydrated(true);
  }, []);

  useEffect(() => {
    const open = () => {
      const next = readConsent() || defaultConsent;
      setDraft(next);
      setIsOpen(true);
    };
    window.addEventListener("tomoc:open-consent", open);
    return () => window.removeEventListener("tomoc:open-consent", open);
  }, []);

  useEffect(() => {
    if (analyticsAllowed && gaReady && metaReady) {
      markAnalyticsReady();
      trackEvent(
        "page_view",
        { page_path: pathname, page_location: `${window.location.origin}${pathname}`, page_title: document.title },
        { dedupeKey: `page_view:${pathname}`, dedupeMs: 500 },
      );
    }
  }, [pathname, analyticsAllowed, gaReady, metaReady]);

  const save = (value: StoredConsent) => {
    const next = { ...value, necessary: true as const };
    localStorage.setItem(key, JSON.stringify(next));
    localStorage.removeItem(legacyKey);
    setConsent(next);
    setDraft(next);
    setAnalyticsConsent(next.analytics);
    setIsOpen(false);
  };

  return (
    <>
      {analyticsAllowed && gaId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="lazyOnload" />
          <Script id="tomoc-ga4" strategy="lazyOnload" onReady={() => setGaReady(true)}>
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}window.gtag=gtag;gtag('consent','default',{analytics_storage:'granted',ad_storage:'${marketingAllowed ? "granted" : "denied"}',ad_user_data:'${marketingAllowed ? "granted" : "denied"}',ad_personalization:'${marketingAllowed ? "granted" : "denied"}'});gtag('js',new Date());gtag('config','${gaId}',{send_page_view:false,anonymize_ip:true});`}
          </Script>
        </>
      )}
      {marketingAllowed && metaPixelId && (
        <Script id="tomoc-meta-pixel" strategy="lazyOnload" onReady={() => setMetaReady(true)}>
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${metaPixelId}');`}
        </Script>
      )}
      {hydrated && isOpen && (
        <div className="fixed inset-0 z-[80] grid place-items-end bg-black/35 p-3 backdrop-blur-sm md:place-items-center" role="presentation">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-title"
            className="w-full max-w-xl rounded-[28px] border border-black/10 bg-white p-5 text-ink shadow-2xl dark:border-white/10 dark:bg-neutral-900 dark:text-white"
          >
            <p className="eyebrow">COOKIE ТОХИРГОО</p>
            <h2 id="cookie-title" className="mt-2 text-2xl font-bold tracking-tight">
              Таны нууцлалыг хүндэтгэнэ
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              TOMOC Store нь сайтын үндсэн ажиллагаанд шаардлагатай cookie ашиглана. Analytics болон marketing cookie-г зөвхөн таны зөвшөөрлөөр идэвхжүүлнэ.
            </p>
            <div className="mt-5 space-y-3">
              <label className="flex items-start gap-3 rounded-2xl bg-cloud p-4 text-sm dark:bg-neutral-800">
                <input type="checkbox" checked disabled className="mt-1" />
                <span>
                  <b>Зайлшгүй шаардлагатай cookie</b>
                  <span className="mt-1 block text-xs leading-5 text-neutral-500">Сагс, checkout, аюулгүй ажиллагаанд хэрэгтэй тул үргэлж идэвхтэй.</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-cloud p-4 text-sm dark:bg-neutral-800">
                <input type="checkbox" checked={draft.analytics} onChange={(event) => setDraft({ ...draft, analytics: event.target.checked })} className="mt-1" />
                <span>
                  <b>Analytics cookie</b>
                  <span className="mt-1 block text-xs leading-5 text-neutral-500">Сайтын хэрэглээг ойлгож, хурд болон туршлагыг сайжруулахад ашиглана.</span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-cloud p-4 text-sm dark:bg-neutral-800">
                <input type="checkbox" checked={draft.marketing} onChange={(event) => setDraft({ ...draft, marketing: event.target.checked })} className="mt-1" />
                <span>
                  <b>Marketing cookie</b>
                  <span className="mt-1 block text-xs leading-5 text-neutral-500">Meta Pixel зэрэг сурталчилгааны үр дүн хэмжих хэрэгслүүдэд ашиглана.</span>
                </span>
              </label>
            </div>
            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <button onClick={() => save({ necessary: true, analytics: true, marketing: true })} className="btn btn-black h-11 text-xs">
                Бүгдийг зөвшөөрөх
              </button>
              <button onClick={() => save(draft)} className="btn h-11 bg-cloud text-xs dark:bg-neutral-800">
                Сонголтоо хадгалах
              </button>
              <button onClick={() => save(defaultConsent)} className="btn h-11 text-xs">
                Татгалзах
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
