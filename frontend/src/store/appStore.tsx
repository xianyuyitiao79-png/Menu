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
import type { Dish, Order } from "../lib/api";
import {
  createDish,
  createOrder,
  deleteDish,
  getAvatars,
  getCategories,
  getDishes,
  getOrders,
  setAvatar as setAvatarApi,
  updateDish,
  updateOrderStatus as updateOrderStatusApi
} from "../lib/api";

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
    placeOrder: (
      input: { items: StoredOrderItem[]; note?: string }
    ) => Promise<StoredOrder | null>;
    updateOrderStatus: (
      orderId: string,
      status: StoredOrderStatus,
      options?: { notify?: boolean }
    ) => Promise<void>;
    adjustOrderItemQty: (orderId: string, dishId: number, delta: number) => void;
    addMenuItem: (input: Omit<MenuItem, "id">) => Promise<MenuItem | null>;
    updateMenuItem: (id: number, patch: Partial<MenuItem>) => Promise<MenuItem | null>;
    deleteMenuItem: (id: number) => Promise<boolean>;
    setRemoteData: (input: { categories?: Category[]; menuList?: MenuItem[] }) => void;
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
      orders: [],
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
    orders: [],
    messages: legacy.length ? legacy : defaultMessages,
    avatars: legacyAvatars
  };
}

function saveState(state: AppState) {
  if (typeof window === "undefined") return;
  try {
    const payload = {
      userRole: state.userRole,
      categories: state.categories,
      menuList: state.menuList,
      messages: state.messages,
      avatars: state.avatars
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
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

const STATUS_FROM_API: Record<string, StoredOrderStatus> = {
  new: "未接单",
  seen: "已接单",
  cooking: "烹饪中",
  done: "完成"
};

const STATUS_TO_API: Record<StoredOrderStatus, string> = {
  未接单: "new",
  已接单: "seen",
  烹饪中: "cooking",
  完成: "done"
};

function mapStatusToApi(status: StoredOrderStatus) {
  return STATUS_TO_API[status] ?? null;
}

function mapApiOrderToStored(order: Order, menuList: MenuItem[]): StoredOrder {
  const dishMap = new Map(menuList.map((item) => [item.id, item]));
  const items = (order.items || []).map((item) => {
    const dish = dishMap.get(item.dishId);
    return {
      dishId: item.dishId,
      quantity: item.quantity,
      name: item.name ?? dish?.name ?? "",
      image: dish?.image ?? "",
      description: dish?.description ?? ""
    };
  });
  return {
    id: String(order.id),
    orderNo: String(order.id).padStart(3, "0"),
    createdAt: order.createdAt,
    status: STATUS_FROM_API[order.status] ?? "未接单",
    items,
    note: order.note
  };
}

const AppStoreContext = createContext<StoreContextValue | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  useEffect(() => {
    let active = true;
    async function loadRemote() {
      try {
        const [categories, dishes, avatars] = await Promise.all([
          getCategories(),
          getDishes(),
          getAvatars()
        ]);
        if (!active) return;
        setState((prev) => ({
          ...prev,
          categories: categories.length ? categories : prev.categories,
          menuList: dishes.length ? dishes : prev.menuList,
          avatars:
            avatars && avatars.length
              ? avatars.reduce<Partial<Record<UserRole, string>>>((acc, item) => {
                  if (item?.role) {
                    acc[item.role as UserRole] = item.avatar ?? "";
                  }
                  return acc;
                }, {})
              : prev.avatars
        }));
        const orders = await getOrders();
        if (!active) return;
        setState((prev) => ({
          ...prev,
          orders: orders.map((order) =>
            mapApiOrderToStored(order, dishes.length ? dishes : prev.menuList)
          )
        }));
      } catch {
        // ignore remote load failures
      }
    }
    loadRemote();
    return () => {
      active = false;
    };
  }, []);

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
    void setAvatarApi({ role, avatar: value ?? "" }).catch(() => {
      // ignore avatar sync failures
    });
  }, []);

  const placeOrder = useCallback(
    async (input: { items: StoredOrderItem[]; note?: string }) => {
      if (!input.items.length) return null;
      try {
        const created = await createOrder({
          items: input.items.map((item) => ({
            dishId: item.dishId,
            quantity: item.quantity
          })),
          note: input.note
        });
        const stored = mapApiOrderToStored(created, state.menuList);
        const orders = await getOrders();
        setState((prev) => ({
          ...prev,
          orders: orders.map((order) => mapApiOrderToStored(order, prev.menuList))
        }));
        return stored;
      } catch {
        return null;
      }
    },
    [state.menuList]
  );

  const updateOrderStatus = useCallback(
    async (orderId: string, status: StoredOrderStatus, options?: { notify?: boolean }) => {
      const apiStatus = mapStatusToApi(status);
      if (!apiStatus) return;
      try {
        await updateOrderStatusApi(Number(orderId), apiStatus);
        const nextOrders = await getOrders();
        setState((prev) => {
          const merged = nextOrders.map((order) => mapApiOrderToStored(order, prev.menuList));
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
          return { ...prev, orders: merged, messages: nextMessages };
        });
      } catch {
        // ignore update failures
      }
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

  const addMenuItem = useCallback(
    async (input: Omit<MenuItem, "id">) => {
      try {
        const created = await createDish({
          categoryId: input.categoryId,
          name: input.name,
          tags: input.tags,
          image: input.image,
          description: input.description
        });
        setState((prev) => ({ ...prev, menuList: [created, ...prev.menuList] }));
        return created;
      } catch {
        return null;
      }
    },
    []
  );

  const updateMenuItem = useCallback(
    async (id: number, patch: Partial<MenuItem>) => {
      try {
        const updated = await updateDish(id, {
          categoryId: patch.categoryId,
          name: patch.name,
          tags: patch.tags,
          image: patch.image,
          description: patch.description
        });
        setState((prev) => ({
          ...prev,
          menuList: prev.menuList.map((item) => (item.id === id ? updated : item)),
          orders: prev.orders.map((order) => ({
            ...order,
            items: order.items.map((item) =>
              item.dishId === id
                ? {
                    ...item,
                    name: updated.name,
                    image: updated.image,
                    description: updated.description
                  }
                : item
            )
          }))
        }));
        return updated;
      } catch {
        return null;
      }
    },
    []
  );

  const deleteMenuItem = useCallback(
    async (id: number) => {
      try {
        await deleteDish(id);
        setState((prev) => ({
          ...prev,
          menuList: prev.menuList.filter((item) => item.id !== id)
        }));
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const setRemoteData = useCallback(
    (input: { categories?: Category[]; menuList?: MenuItem[] }) => {
      setState((prev) => ({
        ...prev,
        categories: input.categories ?? prev.categories,
        menuList: input.menuList ?? prev.menuList
      }));
    },
    []
  );

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
        deleteMenuItem,
        setRemoteData
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
      deleteMenuItem,
      setRemoteData
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
