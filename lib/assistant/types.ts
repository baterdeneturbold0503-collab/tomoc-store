export type AssistantIntent =
  | "price"
  | "sizes"
  | "colors"
  | "stock"
  | "delivery"
  | "payment"
  | "benefits"
  | "usage"
  | "order"
  | "human"
  | "unknown";

export type ChatContext = {
  activeProductId?: string;
  activeProductName?: string;
  lastIntent?: AssistantIntent;
  failedAttempts?: number;
};

export type AssistantProduct = {
  id: string;
  name: string;
  slug: string;
  description: string;
  benefits: string[];
  price: number;
  stock: number;
  images: string[];
  category?: string;
  aliases?: string[];
  variants: ProductVariant[];
};

export type ProductVariant = {
  name: string;
  value: string;
  stock: number;
  priceDelta: number;
};

export type AssistantAnswer = {
  reply: string;
  context: ChatContext;
  matchedProduct: boolean;
  quickReplies?: string[];
};
