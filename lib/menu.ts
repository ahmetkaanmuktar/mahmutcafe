export type MenuItemId = "cay" | "kucuk_su" | "buyuk_su" | "ekstra";

export interface MenuItem {
  id: MenuItemId;
  name: string;
  price: number | null;
  emoji: string;
}

export const MENU_ITEMS: MenuItem[] = [
  { id: "cay", name: "Çay", price: 10, emoji: "🍵" },
  { id: "kucuk_su", name: "Küçük Su", price: 10, emoji: "💧" },
  { id: "buyuk_su", name: "Büyük Su", price: 20, emoji: "🥤" },
  { id: "ekstra", name: "Ekstra", price: null, emoji: "✨" },
];

export function getMenuItem(id: MenuItemId): MenuItem {
  const item = MENU_ITEMS.find((m) => m.id === id);
  if (!item) throw new Error("Geçersiz ürün");
  return item;
}
