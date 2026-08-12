export type ProductCategory = "Teint" | "Joues" | "Soin";

export type Product = {
  id: number;
  name: string;
  kind: string;
  category: ProductCategory;
  price: number;
  shade: string;
  image: string;
  badge?: string;
  description: string;
};

export const products: Product[] = [
  { id: 1, name: "Palette Bronzy", kind: "Palette teint · 6 teintes", category: "Teint", price: 36, shade: "Light à Deep Dark", badge: "Best-seller", image: "/img01.jpeg", description: "Six poudres modulables pour réchauffer, structurer et illuminer chaque carnation." },
  { id: 2, name: "Palette Cheeksy N°02", kind: "Palette joues · 9 teintes", category: "Joues", price: 32, shade: "Collection 02", badge: "Nouveau", image: "/img02.jpeg", description: "Neuf fards vibrants, faciles à superposer, pour une couleur qui vous ressemble." },
  { id: 3, name: "Daily Defense SPF 50+", kind: "Soin protecteur · 50 ml", category: "Soin", price: 24, shade: "Protection invisible", image: "/img03.jpeg", description: "Une crème quotidienne hydratante, légère et résistante à l'eau." },
  { id: 4, name: "Moist Essence", kind: "Crème hydratante · 60 ml", category: "Soin", price: 28, shade: "Acide hyaluronique", image: "/img04.jpeg", description: "Une hydratation fraîche et confortable, formulée pour révéler l'éclat." },
];
