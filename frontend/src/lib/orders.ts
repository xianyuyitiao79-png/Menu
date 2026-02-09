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

const ORDERS_KEY = "myOrders";

function isValidOrderItem(value: any): value is StoredOrderItem {
  return (
    value &&
    typeof value === "object" &&
    typeof value.dishId === "number" &&
    typeof value.quantity === "number"
  );
}

function isValidOrder(value: any): value is StoredOrder {
  return (
    value &&
    typeof value === "object" &&
    typeof value.id === "string" &&
    typeof value.orderNo === "string" &&
    typeof value.createdAt === "string" &&
    (value.status === "未接单" ||
      value.status === "已接单" ||
      value.status === "烹饪中" ||
      value.status === "完成") &&
    Array.isArray(value.items) &&
    value.items.every(isValidOrderItem)
  );
}

export function loadOrders(): StoredOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidOrder);
  } catch {
    return [];
  }
}

export function saveOrders(orders: StoredOrder[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch {
    // ignore localStorage errors
  }
}

export function addOrder(input: {
  items: StoredOrderItem[];
  note?: string;
  status?: StoredOrderStatus;
}): StoredOrder {
  const existing = loadOrders();
  const nextNumber =
    existing.reduce((max, order) => {
      const parsed = Number(order.orderNo);
      if (Number.isFinite(parsed)) {
        return Math.max(max, parsed);
      }
      return max;
    }, 0) + 1;
  const order: StoredOrder = {
    id: `o-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    orderNo: String(nextNumber).padStart(3, "0"),
    createdAt: new Date().toISOString(),
    status: input.status ?? "未接单",
    items: input.items,
    note: input.note
  };
  saveOrders([order, ...existing]);
  return order;
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
