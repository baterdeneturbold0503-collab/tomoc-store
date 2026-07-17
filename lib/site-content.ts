export type FaqItem = { question: string; answer: string };

export type SiteContent = {
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  mobileHeroImage: string;
  socialShareImage: string;
  primaryCtaText: string;
  signatureTitle: string;
  signatureSubtitle: string;
  signatureImage: string;
  aboutTitle: string;
  aboutBody: string;
  aboutImage: string;
  beforeImage: string;
  afterImage: string;
  deliveryText: string;
  faqItems: FaqItem[];
  contactPhone: string;
  whatsappNumber: string;
  messengerText: string;
  messengerUrl: string;
  footerDescription: string;
  testimonialsEnabled: boolean;
};

export const defaultSiteContent: SiteContent = {
  heroEyebrow: "ӨДӨР БҮРТ ТАНЫ ТӨЛӨӨ",
  heroTitle: "Өөртөө итгэх итгэлийг өдөр бүр мэдрээрэй",
  heroSubtitle: "Чанартай бүтээгдэхүүн • Түргэн хүргэлт • Баталгаатай үйлчилгээ",
  heroImage: "/images/tomoc-hero.png",
  mobileHeroImage: "",
  socialShareImage: "/images/tomoc-hero.png",
  primaryCtaText: "Одоо худалдаж авах",
  signatureTitle: "Үсний тань өдөр тутмын жижиг luxury.",
  signatureSubtitle: "Зөөлөн цэвэрлэгээ, тэжээллэг арчилгаа, торгомсог мэдрэмжийг нэг энгийн ritual болгон хувирга.",
  signatureImage: "/images/tomoc-beauty-campaign.png",
  aboutTitle: "Өдөр тутмын арчилгаа, хөдөлгөөнд зориулсан сонголт.",
  aboutBody: "TOMOC Store нь үс арчилгаа болон эмэгтэй загварын хэрэгцээт бүтээгдэхүүнийг нэг дороос, ойлгомжтой захиалгын туршлагатай хүргэхийг зорьдог.",
  aboutImage: "/images/tomoc-beauty-campaign.png",
  beforeImage: "/images/tomoc-beauty-campaign.png",
  afterImage: "/images/tomoc-beauty-campaign.png",
  deliveryText: "Улаанбаатарт 24–48 цагт хүргэнэ. Орон нутагт унаанд дайж явуулна.",
  faqItems: [
    { question: "Хэд хоногт хүрэх вэ?", answer: "Улаанбаатарт 24–48 цагт хүргэнэ. Орон нутагт унаанд дайж явуулна." },
    { question: "Төлбөр яаж хийх вэ?", answer: "Банкны шилжүүлгээр төлбөр баталгаажна." },
    { question: "Бараа буцаах боломжтой юу?", answer: "Буцаалт, солилцооны нөхцөлийг захиалга баталгаажуулах үед мэдээлнэ." },
    { question: "Хүргэлт орон нутагт явдаг уу?", answer: "Тийм. Орон нутаг руу унаанд дайж явуулна." },
  ],
  contactPhone: "96052141",
  whatsappNumber: "89057004",
  messengerText: "Messenger",
  messengerUrl: "https://m.me/TOMOCStore",
  footerDescription: "Өөртөө итгэх итгэлийг өдөр бүр мэдрүүлэх premium сонголт.",
  testimonialsEnabled: false,
};

export function normalizeSiteContent(value: unknown): SiteContent {
  const source = typeof value === "object" && value ? value as Partial<SiteContent> : {};
  const faqItems = Array.isArray(source.faqItems) && source.faqItems.length
    ? source.faqItems
        .map(item => ({ question: String(item?.question || "").trim(), answer: String(item?.answer || "").trim() }))
        .filter(item => item.question && item.answer)
        .slice(0, 8)
    : defaultSiteContent.faqItems;
  return {
    ...defaultSiteContent,
    ...source,
    faqItems,
    testimonialsEnabled: Boolean(source.testimonialsEnabled),
  };
}
