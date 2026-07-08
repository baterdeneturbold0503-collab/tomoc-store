export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  benefit: string;
  description: string;
  image: string;
  rating?: number;
  reviews?: number;
  badge?: string;
  oldPrice?: number;
};

// To replace a placeholder, keep the filename below and overwrite the matching
// file in /public/products/. PNG, WebP, AVIF, JPG, and SVG paths are supported.
export const products: Product[] = [
  {
    id: "argan-oil-nourishing-shampoo",
    name: "Argan Oil Nourishing Shampoo",
    category: "Үс арчилгаа",
    price: 49_900,
    benefit: "Үсийг зөөлрүүлнэ, тэжээл өгнө, хуурайшилтыг багасгана.",
    description: "Үсийг зөөлрүүлж, шаардлагатай тэжээлээр ханган, хуурайшилтыг багасгахад зориулсан өдөр тутмын арчилгаа.",
    image: "/products/argan-oil-shampoo.svg",
    badge: "Онцлох",
  },
  {
    id: "anti-hair-loss-shampoo",
    name: "Anti Hair Loss Shampoo",
    category: "Үс арчилгаа",
    price: 49_900,
    benefit: "Үс уналтын эсрэг, хуйх арчилна, үсний угийг дэмжинэ.",
    description: "Хуйхыг зөөлөн арчилж, үсний угийг дэмжихэд зориулсан үс уналтын эсрэг шампунь.",
    image: "/products/anti-hair-loss-shampoo.svg",
  },
  {
    id: "high-waist-seamless-leggings",
    name: "High Waist Seamless Leggings",
    category: "Загвар",
    price: 69_900,
    benefit: "Бэлхүүс барина, биед эвтэйхэн, өдөр тутам өмсөхөд тохиромжтой.",
    description: "Бэлхүүсийг зөөлөн барих seamless хийцтэй, биед эвтэйхэн, өдөр тутмын хөдөлгөөнд тохиромжтой леггинс.",
    image: "/products/seamless-leggings.svg",
    badge: "Эрэлттэй",
  },
  {
    id: "slim-body-shapewear",
    name: "Slim Body Shapewear",
    category: "Загвар",
    price: 79_900,
    benefit: "Галбир тодруулна, гэдэс барина, хувцасны доор мэдэгдэхгүй.",
    description: "Галбирыг жигд тодруулж, гэдэс хэсгийг барих бөгөөд хувцасны доор үл мэдэгдэх цэвэр хийцтэй.",
    image: "/products/slim-body-shapewear.svg",
  },
  {
    id: "womens-sportswear",
    name: "Women's Sportswear",
    category: "Загвар",
    price: 89_900,
    benefit: "Дасгал, өдөр тутамд тохиромжтой, уян хатан материалтай.",
    description: "Дасгал болон өдөр тутмын хөдөлгөөнд тохирсон, биед эвтэйхэн уян хатан материалтай спорт хувцас.",
    image: "/products/womens-sportswear.svg",
  },
];

export const money = (amount: number) =>
  new Intl.NumberFormat("mn-MN").format(amount) + "₮";
