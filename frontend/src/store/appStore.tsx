import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import type { StoredOrder, StoredOrderItem, StoredOrderStatus } from "../lib/orders";
import { loadOrders, saveOrders } from "../lib/orders";
import type { Dish } from "../lib/api";

type UserRole = "girlfriend_view" | "boyfriend_admin";

type Category = {
  id: number;
  name: string;
};

type MenuItem = Dish & {
  description?: string;
};

type Message = {
  id: string;
  sender: "me" | "him";
  text: string;
  createdAt: string;
};

type AppState = {
  userRole: UserRole;
  categories: Category[];
  menuList: MenuItem[];
  orders: StoredOrder[];
  messages: Message[];
  avatars: Partial<Record<UserRole, string>>;
};

type StoreContextValue = {
  state: AppState;
  actions: {
    setUserRole: (role: UserRole) => void;
    addMessage: (input: { sender: Message["sender"]; text: string }) => void;
    setAvatar: (role: UserRole, value: string | null) => void;
    placeOrder: (input: { items: StoredOrderItem[]; note?: string }) => StoredOrder | null;
    updateOrderStatus: (
      orderId: string,
      status: StoredOrderStatus,
      options?: { notify?: boolean }
    ) => void;
    adjustOrderItemQty: (orderId: string, dishId: number, delta: number) => void;
    addMenuItem: (input: Omit<MenuItem, "id">) => void;
    updateMenuItem: (id: number, patch: Partial<MenuItem>) => void;
    deleteMenuItem: (id: number) => void;
  };
};

const STORAGE_KEY = "couple-kitchen-store";
const LEGACY_MESSAGES_KEY = "coupleChatMessages";
const LEGACY_GIRL_AVATAR_KEY = "myAvatar";
const LEGACY_BOY_AVATAR_KEY = "boyfriendAvatar";

const defaultCategories: Category[] = [
  { id: 1, name: "招牌 🍖" },
  { id: 2, name: "私房 🍲" },
  { id: 3, name: "轻食 🥗" },
  { id: 4, name: "甜品 🍰" },
  { id: 5, name: "饮品 🥤" }
];

const defaultMenuList: MenuItem[] = [
  {
    id: 1,
    categoryId: 1,
    name: "秘制红烧肉",
    tags: "她最爱",
    image: "",
    description: "祖传配方，肥而不腻"
  },
  {
    id: 2,
    categoryId: 1,
    name: "手工狮子头",
    tags: "招牌",
    image: "",
    description: "纯手工制作，鲜嫩多汁"
  },
  {
    id: 3,
    categoryId: 2,
    name: "私房酱牛肉",
    tags: "",
    image: "",
    description: "秘制酱汁，入味三分"
  },
  {
    id: 4,
    categoryId: 3,
    name: "蜜汁烤南瓜",
    tags: "她最爱",
    image: "",
    description: "软糯香甜，带点奶香"
  },
  {
    id: 5,
    categoryId: 4,
    name: "草莓云朵杯",
    tags: "",
    image: "",
    description: "粉色甜品，心动满分"
  },
  {
    id: 6,
    categoryId: 5,
    name: "玫瑰花茶",
    tags: "",
    image: "",
    description: "清香柔和，暖心暖胃"
  }
];

const defaultMessages: Message[] = [
  {
    id: "m-1",
    sender: "me",
    text: "今天想吃红烧肉啦～",
    createdAt: "2026-02-08T14:23:00.000Z"
  },
  {
    id: "m-2",
    sender: "him",
    text: "好的宝贝，马上安排 💗",
    createdAt: "2026-02-08T14:25:00.000Z"
  },
  {
    id: "m-3",
    sender: "me",
    text: "狮子头做得太好吃了！",
    createdAt: "2026-02-08T15:10:00.000Z"
  }
];

const defaultState: AppState = {
  userRole: "girlfriend_view",
  categories: defaultCategories,
  menuList: defaultMenuList,
  orders: [],
  messages: defaultMessages,
  avatars: {}
};

function safeParse(json: string | null) {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function normalizeMessages(input: any): Message[] {
  if (!Array.isArray(input)) return [];
  return input.filter(
    (item) =>
      item &&
      typeof item.id === "string" &&
      (item.sender === "me" || item.sender === "him") &&
      typeof item.text === "string" &&
      typeof item.createdAt === "string"
  );
}

function normalizeMenuList(input: any): MenuItem[] {
  if (!Array.isArray(input)) return [];
  return input.filter(
    (item) => item && typeof item.id === "number" && typeof item.name === "string"
  );
}

function normalizeCategories(input: any): Category[] {
  if (!Array.isArray(input)) return [];
  return input.filter(
    (item) => item && typeof item.id === "number" && typeof item.name === "string"
  );
}

function loadState(): AppState {
  if (typeof window === "undefined") return defaultState;
  const stored = safeParse(window.localStorage.getItem(STORAGE_KEY));
  if (stored) {
    return {
      userRole: stored.userRole === "boyfriend_admin" ? "boyfriend_admin" : "girlfriend_view",
      categories: normalizeCategories(stored.categories) || defaultCategories,
      menuList: normalizeMenuList(stored.menuList) || defaultMenuList,
      orders: Array.isArray(stored.orders) ? stored.orders : loadOrders(),
      messages: normalizeMessages(stored.messages) || defaultMessages,
      avatars: typeof stored.avatars === "object" && stored.avatars ? stored.avatars : {}
    };
  }

  const legacyMessages = safeParse(window.localStorage.getItem(LEGACY_MESSAGES_KEY));
  const legacyGirlAvatar = window.localStorage.getItem(LEGACY_GIRL_AVATAR_KEY) || "";
  const legacyBoyAvatar = window.localStorage.getItem(LEGACY_BOY_AVATAR_KEY) || "";
  const legacyAvatars: Partial<Record<UserRole, string>> = {};
  if (legacyGirlAvatar) legacyAvatars.girlfriend_view = legacyGirlAvatar;
  if (legacyBoyAvatar) legacyAvatars.boyfriend_admin = legacyBoyAvatar;
  const legacy = normalizeMessages(
    Array.isArray(legacyMessages)
      ? legacyMessages.map((item: any) => ({
          ...item,
          createdAt: item.createdAt ?? item.date ?? new Date().toISOString()
        }))
      : []
  );

  return {
    ...defaultState,
    orders: loadOrders(),
    messages: legacy.length ? legacy : defaultMessages,
    avatars: legacyAvatars
  };
}

function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore localStorage errors
  }
}

function getStatusMessage(status: StoredOrderStatus) {
  switch (status) {
    case "已接单":
      return "已接单啦，正在安排厨房火力～";
    case "烹饪中":
      return "正在烹饪中，香味已经飘出来啦～";
    case "完成":
      return "完成啦，可以开饭了 💗";
    default:
      return "收到啦，我先看一下订单～";
  }
}

const AppStoreContext = createContext<StoreContextValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
    saveOrders(state.orders);
  }, [state]);

  const setUserRole = useCallback((role: UserRole) => {
    setState((prev) => ({ ...prev, userRole: role }));
  }, []);

  const addMessage = useCallback(
    (input: { sender: Message["sender"]; text: string }) => {
      const text = input.text.trim();
      if (!text) return;
      const newMessage: Message = {
        id: `m-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        sender: input.sender,
        text,
        createdAt: new Date().toISOString()
      };
      setState((prev) => ({ ...prev, messages: [...prev.messages, newMessage] }));
    },
    []
  );

  const setAvatar = useCallback((role: UserRole, value: string | null) => {
    setState((prev) => ({
      ...prev,
      avatars: {
        ...prev.avatars,
        [role]: value ?? ""
      }
    }));
  }, []);

  const placeOrder = useCallback(
    (input: { items: StoredOrderItem[]; note?: string }) => {
      if (!input.items.length) return null;
      let created: StoredOrder | null = null;
      setState((prev) => {
        const nextNumber =
          prev.orders.reduce((max, order) => {
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
          status: "未接单",
          items: input.items,
          note: input.note
        };
        created = order;
        return { ...prev, orders: [order, ...prev.orders] };
      });
      return created;
    },
    []
  );

  const updateOrderStatus = useCallback(
    (orderId: string, status: StoredOrderStatus, options?: { notify?: boolean }) => {
      setState((prev) => {
        const nextOrders = prev.orders.map((order) =>
          order.id === orderId ? { ...order, status } : order
        );
        const nextMessages = options?.notify
          ? [
              ...prev.messages,
              {
                id: `m-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
                sender: "him",
                text: getStatusMessage(status),
                createdAt: new Date().toISOString()
              }
            ]
          : prev.messages;
        return { ...prev, orders: nextOrders, messages: nextMessages };
      });
    },
    []
  );

  const adjustOrderItemQty = useCallback((orderId: string, dishId: number, delta: number) => {
    setState((prev) => {
      const nextOrders = prev.orders.map((order) => {
        if (order.id !== orderId) return order;
        const nextItems = order.items.flatMap((item) => {
          if (item.dishId !== dishId) return [item];
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return [];
          return [{ ...item, quantity: nextQty }];
        });
        return { ...order, items: nextItems };
      });
      return { ...prev, orders: nextOrders };
    });
  }, []);

  const addMenuItem = useCallback((input: Omit<MenuItem, "id">) => {
    setState((prev) => {
      const nextId =
        prev.menuList.reduce((max, item) => Math.max(max, item.id), 0) + 1;
      const newItem: MenuItem = { ...input, id: nextId };
      return { ...prev, menuList: [newItem, ...prev.menuList] };
    });
  }, []);

  const updateMenuItem = useCallback((id: number, patch: Partial<MenuItem>) => {
    setState((prev) => ({
      ...prev,
      menuList: prev.menuList.map((item) => (item.id === id ? { ...item, ...patch } : item)),
      orders: Object.prototype.hasOwnProperty.call(patch, "image")
        ? prev.orders.map((order) => ({
            ...order,
            items: order.items.map((item) =>
              item.dishId === id ? { ...item, image: patch.image } : item
            )
          }))
        : prev.orders
    }));
  }, []);

  const deleteMenuItem = useCallback((id: number) => {
    setState((prev) => ({
      ...prev,
      menuList: prev.menuList.filter((item) => item.id !== id)
    }));
  }, []);

  const value = useMemo(
    () => ({
      state,
      actions: {
        setUserRole,
        addMessage,
        setAvatar,
        placeOrder,
        updateOrderStatus,
        adjustOrderItemQty,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem
      }
    }),
    [
      state,
      setUserRole,
      addMessage,
      setAvatar,
      placeOrder,
      updateOrderStatus,
      adjustOrderItemQty,
      addMenuItem,
      updateMenuItem,
      deleteMenuItem
    ]
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const context = useContext(AppStoreContext);
  if (!context) {
    throw new Error("useAppStore must be used within AppStoreProvider");
  }
  return { ...context.state, ...context.actions };
}

export type { AppState, Category, MenuItem, Message, UserRole };

export function formatMessageDate(isoString: string) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatMessageTime(isoString: string) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}
