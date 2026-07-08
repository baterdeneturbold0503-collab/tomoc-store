export const storeConfig = {
  contact: {
    messengerUrl:
      process.env.NEXT_PUBLIC_MESSENGER_URL || "https://m.me/61591533627346",
    whatsappNumber:
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "89057004",
    whatsappDisplay:
      process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY || "89057004",
    orderPhone: process.env.NEXT_PUBLIC_ORDER_PHONE || "96052141",
    facebookUrl:
      process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://www.facebook.com/profile.php?id=61591533627346",
    email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "hello@tomoc.mn",
  },
  delivery: {
    city: "Улаанбаатарт 24–48 цагт хүргэнэ.",
    countryside: "Орон нутагт унаанд дайж явуулна.",
    short: "Улаанбаатарт 24–48 цагт, орон нутагт унаанд дайж явуулна.",
  },
  payment: {
    instructions: "Банкны шилжүүлгээр төлбөр баталгаажна.",
    method: "Банкны шилжүүлэг",
  },
} as const;

const whatsappDialNumber =
  storeConfig.contact.whatsappNumber.replace(/\D/g, "").length === 8
    ? `976${storeConfig.contact.whatsappNumber.replace(/\D/g, "")}`
    : storeConfig.contact.whatsappNumber.replace(/\D/g, "");

export const whatsappUrl = `https://wa.me/${whatsappDialNumber}`;
