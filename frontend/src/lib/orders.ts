export type StoredOrderStatus = "未接单" | "已接单" | "烹饪中" | "完成";

export type StoredOrderItem = {
  dishId: number;
  name?: string;
  quantity: number;
  image?: string;
  description?: string;
};

export type StoredOrder = {
  id: string;
  orderNo: string;
  createdAt: string;
  status: StoredOrderStatus;
  items: StoredOrderItem[];
  note?: string;
};

export function loadOrders(): StoredOrder[] {
  return [];
}

export function saveOrders(_orders: StoredOrder[]) {
  // no-op: orders are stored in the database
}

export function addOrder(_input: {
  items: StoredOrderItem[];
  note?: string;
  status?: StoredOrderStatus;
}): StoredOrder {
  throw new Error("addOrder is deprecated. Use API-backed order creation.");
}

export function formatOrderTime(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}
