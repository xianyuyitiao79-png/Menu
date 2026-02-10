export type Category = {
  id: number;
  name: string;
};

export type Dish = {
  id: number;
  categoryId: number;
  name: string;
  tags?: string;
  image?: string;
  description?: string;
};

export type OrderItem = {
  dishId: number;
  name?: string;
  quantity: number;
};

export type Order = {
  id: number;
  createdAt: string;
  note?: string;
  status: string;
  items: OrderItem[];
};

export type AvatarRecord = {
  role: string;
  avatar?: string;
};

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

function withBase(path: string) {
  if (!API_BASE) return path;
  return `${API_BASE}${path}`;
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(withBase("/api/categories"));
  return res.json();
}

export async function getDishes(categoryId?: number): Promise<Dish[]> {
  const url = categoryId
    ? withBase(`/api/dishes?categoryId=${categoryId}`)
    : withBase("/api/dishes");
  const res = await fetch(url);
  return res.json();
}

export async function createOrder(payload: { items: OrderItem[]; note?: string }) {
  const res = await fetch(withBase("/api/orders"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("下单失败");
  return res.json();
}

export async function getOrders(): Promise<Order[]> {
  const res = await fetch(withBase("/api/orders"));
  return res.json();
}

export async function updateOrderStatus(id: number, status: string) {
  const res = await fetch(withBase(`/api/orders/${id}/status`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  if (!res.ok) throw new Error("更新失败");
  return res.json();
}

export async function createDish(payload: {
  categoryId: number;
  name: string;
  tags?: string;
  image?: string;
  description?: string;
}) {
  const res = await fetch(withBase("/api/dishes"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("创建失败");
  return res.json();
}

export async function updateDish(
  id: number,
  payload: Partial<{
    categoryId: number;
    name: string;
    tags: string;
    image: string;
    description: string;
  }>
) {
  const res = await fetch(withBase(`/api/dishes/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("更新失败");
  return res.json();
}

export async function deleteDish(id: number) {
  const res = await fetch(withBase(`/api/dishes/${id}`), {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("删除失败");
  return res.json();
}

export async function getAvatars(): Promise<AvatarRecord[]> {
  const res = await fetch(withBase("/api/avatars"));
  return res.json();
}

export async function setAvatar(payload: { role: string; avatar?: string | null }) {
  const res = await fetch(withBase("/api/avatars"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("更新头像失败");
  return res.json();
}
