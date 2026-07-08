export const storeConfig = {
  contact: {
    messengerUrl:
      process.env.NEXT_PUBLIC_MESSENGER_URL || "https://m.me/tomoc-store-placeholder",
    whatsappNumber:
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "97600000000",
    whatsappDisplay:
      process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY || "00000000",
    orderPhone: process.env.NEXT_PUBLIC_ORDER_PHONE || "00000000",
    facebookUrl:
      process.env.NEXT_PUBLIC_FACEBOOK_URL || "https://facebook.com/tomoc-store-placeholder",
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

export const whatsappUrl = `https://wa.me/${storeConfig.contact.whatsappNumber}`;
