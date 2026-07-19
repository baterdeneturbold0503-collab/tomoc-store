import { money } from "@/lib/products";
import { storeConfig } from "@/lib/store-config";
import type { AssistantAnswer, AssistantIntent, AssistantProduct, ChatContext, ProductVariant } from "./types";

function joinList(items: string[]) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} болон ${items.at(-1)}`;
}

function availableVariants(variants: ProductVariant[], name: string) {
  return variants
    .filter((variant) => variant.name.toLowerCase().includes(name) && variant.stock > 0)
    .map((variant) => variant.value)
    .filter(Boolean);
}

function extractSizesFromText(product: AssistantProduct) {
  const text = `${product.description} ${product.benefits.join(" ")}`;
  const matches = text.match(/\b(?:XS|S|M|L|XL|XXL|XXXL|[2-6]XL|55\s*[–-]\s*75\s*кг|S\s*[–-]\s*3XL)\b/gi) || [];
  return Array.from(new Set(matches.map((item) => item.replace(/\s+/g, " ").toUpperCase())));
}

function extractColorsFromText(product: AssistantProduct) {
  const colors = ["хар", "цагаан", "beige", "беж", "саарал", "бор", "ногоон", "ягаан"];
  const text = `${product.description} ${product.benefits.join(" ")}`.toLowerCase();
  return colors.filter((color) => text.includes(color));
}

function productContext(context: ChatContext, product: AssistantProduct, intent: AssistantIntent): ChatContext {
  return { ...context, activeProductId: product.id, activeProductName: product.name, lastIntent: intent, failedAttempts: 0 };
}

function unknown(context: ChatContext, message: string): AssistantAnswer {
  const failedAttempts = Math.min(2, (context.failedAttempts || 0) + 1);
  const fallback =
    failedAttempts >= 2
      ? `Таны асуултад яг тохирох мэдээлэл олдсонгүй. Хүсвэл Messenger эсвэл WhatsApp-аар зөвлөхтэй холбож өгч болно.\nMessenger: ${storeConfig.contact.messengerUrl}\nWhatsApp: ${storeConfig.contact.whatsappDisplay}`
      : "Та ямар бүтээгдэхүүний талаар асууж байгаагаа нэрээр нь бичээрэй. Жишээ: “Ann Chery хэд вэ?”";
  return {
    reply: fallback,
    context: { ...context, lastIntent: "unknown", failedAttempts },
    matchedProduct: false,
    quickReplies: failedAttempts >= 2 ? ["Messenger", "WhatsApp", "Бүтээгдэхүүн"] : ["Бүтээгдэхүүн", "Үнэ асуух", "Хүргэлт"],
  };
}

function deliveryText() {
  return "Улаанбаатарт 24–48 цагийн дотор хүргэнэ.\nОрон нутагт унаанд дайж илгээнэ.";
}

function paymentText() {
  return `${storeConfig.payment.instructions}\nQPay боломжтой бол checkout дээр сонгоно.`;
}

export function buildAssistantResponse(message: string, intent: AssistantIntent, product: AssistantProduct | null, context: ChatContext): AssistantAnswer {
  if (intent === "human") {
    return {
      reply: `Мэдээж, зөвлөхтэй холбогдох боломжтой.\nMessenger: ${storeConfig.contact.messengerUrl}\nWhatsApp: ${storeConfig.contact.whatsappDisplay}`,
      context: { ...context, lastIntent: "human", failedAttempts: 0 },
      matchedProduct: Boolean(product),
      quickReplies: ["WhatsApp", "Messenger"],
    };
  }

  if (!product && intent === "delivery") {
    return { reply: deliveryText(), context: { ...context, lastIntent: intent, failedAttempts: 0 }, matchedProduct: false, quickReplies: ["Үнэ асуух", "Бүтээгдэхүүн", "Захиалга"] };
  }
  if (!product && intent === "payment") {
    return { reply: paymentText(), context: { ...context, lastIntent: intent, failedAttempts: 0 }, matchedProduct: false, quickReplies: ["Хүргэлт", "Бүтээгдэхүүн", "Захиалга"] };
  }
  if (!product) return unknown(context, message);

  const nextContext = productContext(context, product, intent);
  const sizeVariants = availableVariants(product.variants, "size").concat(availableVariants(product.variants, "размер"), availableVariants(product.variants, "хэмжээ"));
  const sizes = Array.from(new Set(sizeVariants.length ? sizeVariants : extractSizesFromText(product)));
  const colorVariants = availableVariants(product.variants, "color").concat(availableVariants(product.variants, "өнгө"));
  const colors = Array.from(new Set(colorVariants.length ? colorVariants : extractColorsFromText(product)));
  const stockLine = product.stock > 0 ? `Одоогоор бэлэн байна. Үлдэгдэл: ${product.stock} ширхэг.` : "Уучлаарай, энэ бүтээгдэхүүн одоогоор дууссан байна.";

  let reply = "";
  if (intent === "price") {
    reply = `${product.name}-ийн үнэ ${money(product.price)}.`;
    if (sizes.length) reply += `\nХэмжээ: ${joinList(sizes)}.`;
    reply += `\nХүргэлт: Улаанбаатарт 24–48 цаг.`;
  } else if (intent === "sizes") {
    reply = sizes.length
      ? `Одоогоор ${joinList(sizes)} размер бэлэн байна.\nТа өндөр, жингээ хэлбэл тохирох размер санал болгоё.`
      : `${product.name}-ийн размерын мэдээлэл одоогоор бүрэн ороогүй байна. Та өндөр, жингээ бичвэл зөвлөхтэй шалгаж өгье.`;
  } else if (intent === "colors") {
    reply = colors.length ? `${product.name}-ийн боломжтой өнгө: ${joinList(colors)}.` : `${product.name}-ийн өнгөний мэдээлэл одоогоор бүрэн ороогүй байна.`;
  } else if (intent === "stock") {
    reply = `${product.name}: ${stockLine}`;
    if (sizes.length) reply += `\nХэмжээ: ${joinList(sizes)}.`;
  } else if (intent === "delivery") {
    reply = `${product.name} хүргэлттэй.\n${deliveryText()}`;
    if (sizes.length) reply += `\nХэмжээ: ${joinList(sizes)}.`;
  } else if (intent === "payment") {
    reply = paymentText();
  } else if (intent === "benefits") {
    reply = product.benefits.length ? `${product.name}-ийн давуу тал:\n${product.benefits.slice(0, 5).map((benefit) => `• ${benefit}`).join("\n")}` : `${product.name}-ийн давуу талын мэдээлэл одоогоор бүрэн ороогүй байна.`;
  } else if (intent === "usage") {
    reply = product.description ? `${product.name}: ${product.description}` : `${product.name}-ийн хэрэглээний тайлбар одоогоор бүрэн ороогүй байна.`;
  } else if (intent === "order") {
    reply = product.stock > 0 ? `Захиалах бол размер болон утасны дугаараа бичээрэй. ${product.name}-ийн үнэ ${money(product.price)}.` : `Уучлаарай, ${product.name} одоогоор дууссан байна.`;
  } else {
    reply = `${product.name}\nҮнэ: ${money(product.price)}\n${stockLine}`;
    if (sizes.length) reply += `\nХэмжээ: ${joinList(sizes)}.`;
  }

  if (!reply.includes("Захиалах уу") && product.stock > 0 && ["price", "stock", "delivery"].includes(intent)) reply += "\nЗахиалах уу?";
  return { reply, context: nextContext, matchedProduct: true, quickReplies: ["Үнэ", "Размер", "Үлдэгдэл", "Хүргэлт", "Захиалах"] };
}
