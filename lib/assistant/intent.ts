import type { AssistantIntent } from "./types";

const cyrillicMap: Record<string, string> = {
  ү: "у",
  Ү: "у",
  ө: "о",
  Ө: "о",
  ё: "е",
  Ё: "е",
  й: "и",
  Й: "и",
};

export function normalizeText(value: string) {
  return value
    .replace(/[ҮӨЁЙүөёй]/g, (letter) => cyrillicMap[letter] || letter)
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasAny(text: string, words: string[]) {
  return words.some((word) => text.includes(normalizeText(word)));
}

export function detectIntent(message: string): AssistantIntent {
  const text = normalizeText(message);
  if (hasAny(text, ["хүнтэй", "оператор", "зөвлөх", "админ", "хүний тусламж", "human", "messenger", "whatsapp"])) return "human";
  if (hasAny(text, ["үнэ", "хэд вэ", "хэдэн төгрөг", "үнэ хэд", "ямар үнэтэй", "үнийн мэдээлэл", "une", "price"])) return "price";
  if (hasAny(text, ["размер", "раз", "размэр", "хэмжээ", "ямар размер", "ямар ямар раз", "хэдэн размер", "надад таарах уу", "size"])) return "sizes";
  if (hasAny(text, ["өнгө", "өнгөтэй", "ямар өнгө", "хар", "цагаан", "beige", "беж", "color"])) return "colors";
  if (hasAny(text, ["байгаа юу", "бэлэн үү", "үлдэгдэл", "дууссан уу", "захиалж болох уу", "stock"])) return "stock";
  if (hasAny(text, ["хүргэлт", "хүргэх үү", "хүргэлттэй юу", "хэд хоног", "орон нутаг", "унаанд", "хүргэлтийн үнэ", "delivery"])) return "delivery";
  if (hasAny(text, ["төлбөр", "төлөх", "данс", "шилжүүлэг", "qpay", "карт", "payment"])) return "payment";
  if (hasAny(text, ["давуу тал", "ашиг тус", "юунд сайн", "benefit"])) return "benefits";
  if (hasAny(text, ["тайлбар", "юунд зориулсан", "яаж хэрэглэх", "хэрхэн хэрэглэх", "хэрэглээ", "usage"])) return "usage";
  if (hasAny(text, ["захиалах", "авъя", "авах", "сагс", "order"])) return "order";
  return "unknown";
}

export function wantsGeneralStoreInfo(intent: AssistantIntent) {
  return intent === "delivery" || intent === "payment";
}
