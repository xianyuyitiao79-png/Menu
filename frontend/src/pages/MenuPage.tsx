import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Dish } from "../lib/api";
import { useLocation, useNavigate } from "react-router-dom";
import MyOrdersCard from "../components/MyOrdersCard";
import AccountSwitch from "../components/AccountSwitch";
import { formatMessageTime, useAppStore } from "../store/appStore";

const imgFrame = "https://www.figma.com/api/mcp/asset/73d8bdbf-69ae-4735-a992-cb9a722b5ecf";
const imgFrame2 = "https://www.figma.com/api/mcp/asset/1f3e72a0-ce23-420b-9f01-7157bfdc6cd9";
const imgRectangle = "https://www.figma.com/api/mcp/asset/68562002-dcdf-462b-8799-3b64a2698793";
const imgMdiLightClipboardText =
  "https://www.figma.com/api/mcp/asset/b6466591-a199-45ec-99c7-2e359272c15c";
const imgVector = "https://www.figma.com/api/mcp/asset/e2dd9ec9-c047-43fa-98b6-11ac39f8d532";
const imgVector1 = "https://www.figma.com/api/mcp/asset/750b4ede-c927-4584-8497-077fc028bbd4";

type CategoryButton = {
  id: number;
  label: string;
  emoji: string;
  height: number;
};

type ChatMessage = {
  id: string;
  sender: "me" | "him";
  text: string;
  createdAt: string;
};

export default function MenuPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    categories,
    menuList,
    orders,
    messages,
    addMessage,
    avatars,
    setAvatar,
    isLoading,
    loadError,
    refreshData
  } = useAppStore();
  const dishes = menuList;
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<Record<number, { dish: Dish; qty: number }>>({});
  const [activeTab, setActiveTab] = useState<"menu" | "mine">("menu");
  const [brokenImages, setBrokenImages] = useState<Record<number, boolean>>({});
  const defaultPrefs = ["少辣", "不要香菜", "爱甜口", "喜欢汤"];
  const [prefs, setPrefs] = useState<string[]>(defaultPrefs);
  const avatar = avatars.girlfriend_view || null;
  const chatMessages = messages as ChatMessage[];
  const [chatInput, setChatInput] = useState("");
  const longPressTimer = useRef<number | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCart((prev) => {
      let changed = false;
      const next = { ...prev };
      Object.values(prev).forEach((entry) => {
        const updated = dishes.find((dish) => dish.id === entry.dish.id);
        if (!updated) return;
        const hasDiff =
          updated.image !== entry.dish.image ||
          updated.name !== entry.dish.name ||
          updated.description !== entry.dish.description ||
          updated.tags !== entry.dish.tags;
        if (hasDiff) {
          next[entry.dish.id] = {
            ...entry,
            dish: { ...entry.dish, ...updated }
          };
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [dishes]);

  useEffect(() => {
    if (!categories.length) return;
    setActiveCategory((prev) => {
      if (prev && categories.some((item) => item.id === prev)) return prev;
      return categories[0].id;
    });
  }, [categories]);

  useEffect(() => {
    if (activeTab !== "mine") return;
    const timer = window.setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 0);
    return () => {
      window.clearTimeout(timer);
    };
  }, [chatMessages, activeTab]);

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        window.clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    const tab = (location.state as { tab?: "menu" | "mine" } | undefined)?.tab;
    if (tab === "mine") {
      setActiveTab("mine");
    } else if (tab === "menu") {
      setActiveTab("menu");
    }
  }, [location.state]);

  const incomingItems = useMemo(() => {
    const raw = location.state?.items as
      | { dishId: number; quantity: number; name?: string; image?: string; description?: string }[]
      | undefined;
    return Array.isArray(raw) ? raw : [];
  }, [location.state]);

  useEffect(() => {
    if (!incomingItems.length || !dishes.length) return;
    const nextCart: Record<number, { dish: Dish; qty: number }> = {};
    incomingItems.forEach((item) => {
      const found = dishes.find((dish) => dish.id === item.dishId);
      const dish: Dish =
        found ??
        ({
          id: item.dishId,
          categoryId: 0,
          name: item.name ?? "用心烹制",
          image: item.image
        } as Dish);
      if (item.quantity > 0) {
        nextCart[item.dishId] = { dish, qty: item.quantity };
      }
    });
    if (Object.keys(nextCart).length) {
      setCart(nextCart);
    }
  }, [incomingItems, dishes]);

  const categoryButtons: CategoryButton[] = useMemo(() => {
    return categories.map((cat) => {
      const [name, emoji = ""] = cat.name.split(" ");
      return {
        id: cat.id,
        label: name,
        emoji,
        height: 85
      };
    });
  }, [categories]);

  const filteredDishes = useMemo(() => {
    if (!activeCategory) return dishes;
    return dishes.filter((dish) => dish.categoryId === activeCategory);
  }, [activeCategory, dishes]);

  const totalCount = useMemo(
    () => Object.values(cart).reduce((sum, item) => sum + item.qty, 0),
    [cart]
  );

  const frequentMenu = useMemo(() => {
    const counts = new Map<number, number>();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        counts.set(item.dishId, (counts.get(item.dishId) ?? 0) + item.quantity);
      });
    });
    const ranked = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([dishId, count]) => {
        const dish = dishes.find((item) => item.id === dishId);
        return {
          id: `f-${dishId}`,
          name: dish?.name ?? "用心烹制",
          desc: dish?.description ?? "用心烹制，鲜嫩多汁",
          count,
          image: dish?.image ?? ""
        };
      });
    return ranked;
  }, [orders, dishes]);

  const handleSendMessage = () => {
    const text = chatInput.trim();
    if (!text) return;
    addMessage({ sender: "me", text });
    setChatInput("");
  };

  const isMenu = activeTab === "menu";
  const isMine = activeTab === "mine";
  const activeIconColor = "#FFCFD0";
  const inactiveIconColor = "#999999";

  function handleAddPreference() {
    if (typeof window === "undefined") return;
    const input = window.prompt("输入新的口味偏好");
    if (!input) return;
    const value = input.trim();
    if (!value) return;
    setPrefs((prev) => (prev.includes(value) ? prev : [...prev, value]));
  }

  function handleRemovePreference(value: string) {
    setPrefs((prev) => prev.filter((item) => item !== value));
  }

  function handlePrefPressStart(value: string) {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
    }
    longPressTimer.current = window.setTimeout(() => {
      handleRemovePreference(value);
      longPressTimer.current = null;
    }, 600);
  }

  function handlePrefPressCancel() {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function handleAvatarClick() {
    avatarInputRef.current?.click();
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatar("girlfriend_view", reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function addDish(dish: Dish) {
    setCart((prev) => {
      const current = prev[dish.id];
      const nextQty = current ? current.qty + 1 : 1;
      return { ...prev, [dish.id]: { dish, qty: nextQty } };
    });
  }

  function goToConfirm() {
    const items = Object.values(cart).map((entry) => ({
      dishId: entry.dish.id,
      name: entry.dish.name,
      quantity: entry.qty,
      image: entry.dish.image,
      description: entry.dish.description
    }));

    if (!items.length) {
      alert("还没有选择菜品哦～");
      return;
    }

    navigate("/confirm", { state: { items } });
  }

  return (
    <div className="min-h-screen bg-[#f6f2f1] flex items-center justify-center py-6">
      <div
        style={{
          width: 474,
          height: 996,
          position: "relative",
          background: "rgba(240, 240, 240, 0.30)",
          boxShadow:
            "-2px 4px 10px rgba(145,145,145,0.05), -7px 17px 18px rgba(145,145,145,0.04), -15px 37px 24px rgba(145,145,145,0.03), -27px 66px 29px rgba(145,145,145,0.01), -42px 103px 31px rgba(145,145,145,0), 0px 4px 4px rgba(255,255,255,0.25) inset, 0px -5px 4px rgba(255,255,255,0.25) inset",
          overflow: "hidden",
          borderRadius: 20,
          backdropFilter: "blur(10px)"
        }}
      >
        <div
          style={{
            width: 474,
            height: 996,
            position: "absolute",
            left: 0,
            top: 0,
            background: "#FFF8F5"
          }}
        />

        <div
          style={{
            width: 474,
            height: 159,
            position: "absolute",
            left: 0,
            top: 0,
            background: "#FFE9EC",
            borderBottom: "1px solid #EDE7E9"
          }}
        />

        <AccountSwitch iconSrc={imgFrame} />

        {isMenu && (
          <>
            <div
              style={{
                left: 135,
                top: 56,
                position: "absolute",
                textAlign: "center",
                color: "black",
                fontSize: 26,
                fontFamily: "Be Vietnam",
                fontWeight: 700,
                lineHeight: "32.5px"
              }}
            >
              小涵的专属小厨房
            </div>
            <div
              style={{
                left: 171,
                top: 93,
                position: "absolute",
                textAlign: "center",
                color: "#8B7B7E",
                fontSize: 15,
                fontFamily: "Helvetica",
                fontWeight: 400,
                lineHeight: "24px",
                letterSpacing: "0.38px"
              }}
            >
              老婆大人，请点菜
            </div>

            <div
              style={{
                width: 88,
                height: 754,
                left: 0,
                top: 159,
                position: "absolute",
                background: "#FFF8F5",
                borderRight: "1px solid #EDE7E9",
                overflowY: "auto",
                paddingTop: 12,
                paddingBottom: 12,
                boxSizing: "border-box",
                ["--scrollbar-track-margin" as any]: "12px"
              }}
              className="glass-scroll"
            >
              <div className="flex flex-col items-center gap-3">
                {categoryButtons.length === 0 ? (
                  <div
                    style={{
                      width: 60,
                      height: 80,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#B39BA0",
                      fontSize: 12,
                      textAlign: "center"
                    }}
                  >
                    {isLoading ? "加载中" : "暂无分类"}
                  </div>
                ) : (
                  categoryButtons.map((cat) => {
                    const active = activeCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        style={{
                          width: 60,
                          height: cat.height,
                          position: "relative",
                          background: active ? "#FFEEF0" : "transparent",
                          borderRadius: 12,
                          border: active ? "1px solid #FFCFD0" : "none",
                          cursor: "pointer"
                        }}
                      >
                        {active && (
                          <div
                            style={{
                              width: 3,
                              height: 24,
                              left: -1,
                              top: 30,
                              position: "absolute",
                              background: "#F6C1CC",
                              borderTopRightRadius: 9999,
                              borderBottomRightRadius: 9999
                            }}
                          />
                        )}
                        <div
                          style={{
                            width: "100%",
                            position: "absolute",
                            top: 15,
                            left: 0,
                            textAlign: "center",
                            fontSize: 20,
                            fontFamily: "Helvetica",
                            fontWeight: 400,
                            lineHeight: "30px",
                            color: "black"
                          }}
                        >
                          {cat.emoji}
                        </div>
                        <div
                          style={{
                            width: "100%",
                            position: "absolute",
                            top: 52,
                            left: 0,
                            textAlign: "center",
                            fontSize: 13,
                            fontFamily: "Helvetica",
                            fontWeight: 400,
                            lineHeight: "16.9px",
                            letterSpacing: "0.32px",
                            color: active ? "#5A4A4E" : "#8B7B7E"
                          }}
                        >
                          {cat.label}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div
              style={{
                width: 354,
                height: 754,
                left: 96,
                top: 159,
                position: "absolute",
                overflowY: "auto",
                paddingTop: 24,
                paddingBottom: 24,
                boxSizing: "border-box",
                ["--scrollbar-track-margin" as any]: "24px"
              }}
              className="menu-scroll glass-scroll"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {loadError && (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.9)",
                      border: "1px solid rgba(237,231,233,0.8)",
                      color: "#C17B8A",
                      fontSize: 12,
                      textAlign: "center"
                    }}
                  >
                    {loadError}
                    <button
                      onClick={refreshData}
                      style={{
                        marginLeft: 8,
                        border: "1px solid #F6C1CC",
                        background: "#FFEEF0",
                        borderRadius: 999,
                        padding: "4px 10px",
                        fontSize: 11,
                        color: "#C17B8A",
                        cursor: "pointer"
                      }}
                    >
                      重新加载
                    </button>
                  </div>
                )}
                {isLoading && filteredDishes.length === 0 ? (
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      border: "1px dashed rgba(246,193,204,0.6)",
                      background: "rgba(255,255,255,0.85)",
                      color: "#B39BA0",
                      textAlign: "center",
                      fontSize: 12
                    }}
                  >
                    菜单加载中...
                  </div>
                ) : filteredDishes.length === 0 ? (
                  <div
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      border: "1px dashed rgba(246,193,204,0.6)",
                      background: "rgba(255,255,255,0.85)",
                      color: "#B39BA0",
                      textAlign: "center",
                      fontSize: 12
                    }}
                  >
                    暂无菜品
                  </div>
                ) : (
                  filteredDishes.map((dish) => {
                  const isFavorite = dish.tags?.includes("她最爱");
                  const isSignature = dish.tags?.includes("招牌");
                  const isSelected = Boolean(cart[dish.id]);
                  const cardBg = isSelected ? "#FFEEF0" : "white";
                  const cardBorder = isSelected ? "1px solid #FFCFD0" : "1px solid #DEDEE2";
                  const tagBg = isFavorite
                    ? "rgba(193, 123, 138, 0.12)"
                    : "rgba(184, 147, 110, 0.12)";
                  const tagColor = isFavorite ? "#C17B8A" : "#B8936E";
                  const rawImage = typeof dish.image === "string" ? dish.image.trim() : "";
                  const normalizedImage =
                    rawImage.startsWith("data:image") ? rawImage.replace(/\s+/g, "") : rawImage;
                  const imageSrc =
                    normalizedImage &&
                    !brokenImages[dish.id] &&
                    (normalizedImage.startsWith("data:image") ||
                      normalizedImage.startsWith("http://") ||
                      normalizedImage.startsWith("https://"))
                      ? normalizedImage
                      : "";

                  return (
                    <div
                      key={dish.id}
                      style={{
                        width: 354,
                        height: 100,
                        position: "relative",
                        background: cardBg,
                        borderRadius: 16,
                        border: cardBorder
                      }}
                    >
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          left: 16,
                          top: 22,
                          position: "absolute",
                          background: isSelected ? "#FFEEF0" : "#FFEEF0",
                          borderRadius: 10,
                          border: "1px solid rgba(246,193,204,0.6)",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#C4C4C4",
                          fontSize: 11,
                          fontFamily: "Helvetica"
                        }}
                      >
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={dish.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            onError={() =>
                              setBrokenImages((prev) => ({ ...prev, [dish.id]: true }))
                            }
                          />
                        ) : (
                          "暂无图片"
                        )}
                      </div>
                      <div
                        style={{
                          left: 92,
                          top: 26,
                          position: "absolute",
                          color: "#5A4A4E",
                          fontSize: 16,
                          fontFamily: "Helvetica",
                          fontWeight: 700,
                          lineHeight: "20.8px"
                        }}
                      >
                        {dish.name}
                      </div>
                      {dish.tags && (
                        <div
                          style={{
                            position: "absolute",
                            left: 176,
                            top: 24,
                            background: tagBg,
                            borderRadius: 8,
                            padding: "3px 8px",
                            color: tagColor,
                            fontSize: 12,
                            fontFamily: "Helvetica",
                            lineHeight: "18px",
                            letterSpacing: "0.3px"
                          }}
                        >
                          {dish.tags}
                        </div>
                      )}
                      <div
                        style={{
                          left: 92,
                          top: 54,
                          position: "absolute",
                          color: "#A89B9E",
                          fontSize: 13,
                          fontFamily: "Helvetica",
                          lineHeight: "20.15px",
                          letterSpacing: "0.32px"
                        }}
                      >
                        {dish.description ?? (dish.tags ? "纯手工制作，鲜嫩多汁" : "")}
                      </div>
                      <button
                        onClick={() => addDish(dish)}
                        style={{
                          width: 36,
                          height: 36,
                          right: 14,
                          top: 20,
                          position: "absolute",
                          background: "white",
                          borderRadius: "50%",
                          border: "2px solid #F6C1CC",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer"
                        }}
                      >
                        <img
                          src={imgFrame2}
                          alt=""
                          style={{ width: 16, height: 16, display: "block" }}
                        />
                      </button>
                    </div>
                  );
                  })
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={goToConfirm}
              aria-label="查看下单"
              style={{
                position: "absolute",
                left: 378,
                top: 833,
                width: 73,
                height: 72,
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                zIndex: 5
              }}
            >
              <svg
                viewBox="0 0 73 72"
                width="73"
                height="72"
                style={{ display: "block" }}
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="32.9216"
                  cy="38.647"
                  r="32.4216"
                  fill="white"
                  stroke="#FFCFD0"
                />
                <path
                  d="M45.3259 47.0994H25.7956C25.1678 47.0994 24.6285 46.6617 24.5003 46.0517L20.1858 25.8185H15.9464C15.2126 25.8185 14.6202 25.2261 14.6202 24.4923C14.6202 23.7585 15.2126 23.1661 15.9464 23.1661H21.2556C21.8833 23.1661 22.4226 23.6038 22.5508 24.2138L26.8654 44.447H45.3214C46.0553 44.447 46.6476 45.0394 46.6476 45.7732C46.6476 46.507 46.0553 47.0994 45.3259 47.0994Z"
                  fill="#FFCFD0"
                />
                <path
                  d="M46.2984 40.5744H24.4163C23.6825 40.5744 23.0901 39.9821 23.0901 39.2482C23.0901 38.5144 23.6825 37.922 24.4163 37.922H45.4363L48.3053 31.4856H22.9044C22.1706 31.4856 21.5782 30.8933 21.5782 30.1594C21.5782 29.4256 22.1706 28.8333 22.9044 28.8333H50.3432C50.7941 28.8333 51.2097 29.0587 51.4572 29.4389C51.7048 29.8191 51.7401 30.2921 51.5545 30.6988L47.5096 39.7875C47.2974 40.265 46.82 40.5744 46.2984 40.5744Z"
                  fill="#FFCFD0"
                />
                <path
                  d="M24.5931 51.9487C24.5931 52.6979 24.8907 53.4163 25.4205 53.9461C25.9502 54.4758 26.6687 54.7735 27.4179 54.7735C28.1671 54.7735 28.8856 54.4758 29.4153 53.9461C29.9451 53.4163 30.2427 52.6979 30.2427 51.9487C30.2427 51.1995 29.9451 50.481 29.4153 49.9513C28.8856 49.4215 28.1671 49.1239 27.4179 49.1239C26.6687 49.1239 25.9502 49.4215 25.4205 49.9513C24.8907 50.481 24.5931 51.1995 24.5931 51.9487Z"
                  fill="#FFCFD0"
                />
                <path
                  d="M38.7169 51.9487C38.7169 52.3196 38.79 52.687 38.9319 53.0297C39.0739 53.3724 39.282 53.6838 39.5443 53.9461C39.8066 54.2084 40.118 54.4165 40.4607 54.5584C40.8034 54.7004 41.1707 54.7735 41.5417 54.7735C41.9127 54.7735 42.28 54.7004 42.6227 54.5584C42.9654 54.4165 43.2768 54.2084 43.5391 53.9461C43.8014 53.6838 44.0095 53.3724 44.1514 53.0297C44.2934 52.687 44.3665 52.3196 44.3665 51.9487C44.3665 51.5777 44.2934 51.2104 44.1514 50.8677C44.0095 50.525 43.8014 50.2136 43.5391 49.9513C43.2768 49.689 42.9654 49.4809 42.6227 49.3389C42.28 49.197 41.9127 49.1239 41.5417 49.1239C41.1707 49.1239 40.8034 49.197 40.4607 49.3389C40.118 49.4809 39.8066 49.689 39.5443 49.9513C39.282 50.2136 39.0739 50.525 38.9319 50.8677C38.79 51.2104 38.7169 51.5777 38.7169 51.9487Z"
                  fill="#FFCFD0"
                />
              </svg>
              {totalCount > 0 && (
                <div
                  style={{
                    position: "absolute",
                    right: -2,
                    top: -4,
                    width: 32,
                    height: 32,
                    borderRadius: 9999,
                    background: "#FF4D4F",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700
                  }}
                >
                  {totalCount > 99 ? "99+" : totalCount}
                </div>
              )}
            </button>
          </>
        )}

        {isMine && (
          <div
            style={{
              position: "absolute",
              left: 24,
              top: 90,
              width: 426,
              height: 790,
              overflowY: "auto",
              paddingTop: 24,
              paddingBottom: 24,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              ["--scrollbar-track-margin" as any]: "24px"
            }}
            className="mine-scroll glass-scroll"
          >
            <div
              style={{
                background: "rgba(255,255,255,0.75)",
                borderRadius: 18,
                border: "1px solid rgba(246,193,204,0.7)",
                boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
                backdropFilter: "blur(16px)",
                padding: 16,
                display: "flex",
                alignItems: "center",
                gap: 14
              }}
            >
              <button
                onClick={handleAvatarClick}
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: "50%",
                  border: "2px solid #F6C1CC",
                  background: "rgba(255,255,255,0.7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#C17B8A",
                  fontSize: 10,
                  fontWeight: 500,
                  cursor: "pointer",
                  padding: 0,
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt="头像"
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <span style={{ lineHeight: "12px" }}>点击添加</span>
                )}
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                />
              </button>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#5A4A4E",
                    lineHeight: "20.8px"
                  }}
                >
                  小涵老婆
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 6,
                    flexWrap: "wrap"
                  }}
                >
                  {prefs.map((tag) => (
                    <div
                      key={tag}
                      style={{
                        padding: "3px 8px",
                        borderRadius: 999,
                        background: "#FEF2F1",
                        border: "1px solid #FFCFD0",
                        color: "#C17B8A",
                        fontSize: 11,
                        lineHeight: "14px"
                      }}
                    >
                      {tag}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.72)",
                borderRadius: 18,
                border: "1px solid rgba(246,193,204,0.6)",
                boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
                backdropFilter: "blur(16px)",
                padding: 16
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#5A4A4E",
                  marginBottom: 10
                }}
              >
                口味偏好
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {prefs.map((item) => (
                  <div
                    key={item}
                    onPointerDown={() => handlePrefPressStart(item)}
                    onPointerUp={handlePrefPressCancel}
                    onPointerLeave={handlePrefPressCancel}
                    onPointerCancel={handlePrefPressCancel}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 999,
                      border: "1px solid #F6C1CC",
                      background: "rgba(255,255,255,0.8)",
                      color: "#C17B8A",
                      fontSize: 12,
                      lineHeight: "16px",
                      cursor: "pointer",
                      userSelect: "none"
                    }}
                  >
                    {item}
                  </div>
                ))}
                <button
                  onClick={handleAddPreference}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 999,
                    border: "1px solid #F6C1CC",
                    background: "rgba(255,255,255,0.8)",
                    color: "#C17B8A",
                    fontSize: 14,
                    lineHeight: "16px",
                    cursor: "pointer",
                    minWidth: 36
                  }}
                >
                  +
                </button>
              </div>
              <div
                style={{
                  marginTop: 8,
                  fontSize: 11,
                  color: "#B39BA0",
                  letterSpacing: "0.2px"
                }}
              >
                长按偏好可删除
              </div>
            </div>

            <MyOrdersCard orders={orders} />

            <div
              style={{
                background: "rgba(255,255,255,0.72)",
                borderRadius: 18,
                border: "1px solid rgba(246,193,204,0.6)",
                boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
                backdropFilter: "blur(16px)",
                padding: 16
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#5A4A4E",
                  marginBottom: 12
                }}
              >
                常点菜单
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {frequentMenu.length === 0 ? (
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      background: "rgba(255,255,255,0.85)",
                      border: "1px solid rgba(237,231,233,0.8)",
                      color: "#A89B9E",
                      fontSize: 12
                    }}
                  >
                    还没有常点记录，先去点菜吧～
                  </div>
                ) : (
                  frequentMenu.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: 12,
                        borderRadius: 14,
                        background: "rgba(255,255,255,0.85)",
                        border: "1px solid rgba(237,231,233,0.8)"
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 10,
                          background: "#FFEEF0",
                          border: "1px solid rgba(246,193,204,0.6)",
                          overflow: "hidden",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#C4C4C4",
                          fontSize: 11
                        }}
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          "暂无图片"
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#5A4A4E",
                            lineHeight: "18px"
                          }}
                        >
                          {item.name}
                        </div>
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 12,
                            color: "#A89B9E",
                            lineHeight: "16px"
                          }}
                        >
                          {item.desc}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", minWidth: 42 }}>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: "#C17B8A",
                            lineHeight: "20px"
                          }}
                        >
                          {item.count}
                        </div>
                        <div style={{ fontSize: 11, color: "#A89B9E" }}>次</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div
              style={{
                background: "rgba(254,242,241,0.5)",
                borderRadius: 24,
                border: "1px solid rgba(255,207,208,0.6)",
                boxShadow: "0 4px 16px rgba(246,193,204,0.08)",
                backdropFilter: "blur(12px)",
                padding: 16
              }}
            >
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#5A4A4E",
                  marginBottom: 12
                }}
              >
                他的小留言
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                  maxHeight: 240,
                  overflowY: "auto",
                  padding: 12,
                  borderRadius: 20,
                  border: "1px solid rgba(237,231,233,0.4)",
                  background: "rgba(255,255,255,0.65)",
                  ["--scrollbar-track-margin" as any]: "10px"
                }}
                className="glass-scroll"
              >
                {chatMessages.map((item) => {
                  const isMe = item.sender === "me";
                  return (
                    <div
                      key={item.id}
                      style={{
                        display: "flex",
                        justifyContent: isMe ? "flex-end" : "flex-start"
                      }}
                    >
                      <div
                        style={{
                          maxWidth: "78%",
                          padding: "8px 12px",
                          borderRadius: 16,
                          border: isMe
                            ? "1px solid rgba(237,231,233,0.6)"
                            : "1px solid #FFCfd0",
                          background: isMe
                            ? "rgba(255,255,255,0.95)"
                            : "rgba(255,207,208,0.3)",
                          boxShadow: "0 6px 16px rgba(0,0,0,0.05)",
                          color: "#5A4A4E",
                          display: "flex",
                          flexDirection: "column",
                          gap: 4
                        }}
                      >
                        <div style={{ fontSize: 12, lineHeight: "18px", whiteSpace: "pre-wrap" }}>
                          {item.text}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: "#A89B9E",
                            textAlign: isMe ? "right" : "left"
                          }}
                        >
                          {formatMessageTime(item.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginTop: 12,
                  alignItems: "center"
                }}
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="回复他的留言..."
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 14,
                    border: "1px solid rgba(237,231,233,0.6)",
                    background: "rgba(255,255,255,0.9)",
                    padding: "0 12px",
                    fontSize: 12,
                    color: "#5A4A4E",
                    outline: "none"
                  }}
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  style={{
                    width: 46,
                    height: 38,
                    borderRadius: 14,
                    border: "none",
                    background: "linear-gradient(135deg,#F6C1CC,#FFCFD0)",
                    color: "#fff",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(246,193,204,0.2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 12L20 4L13 20L11 13L4 12Z"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div style={{ height: 96 }} />
          </div>
        )}

        <div
          style={{
            width: 491,
            height: 83,
            left: -11,
            top: 913,
            position: "absolute",
            overflow: "hidden"
          }}
        >
          <img
            src={imgRectangle}
            alt=""
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        </div>

        <div
          style={{
            width: 402,
            left: 36,
            top: 941,
            position: "absolute",
            display: "flex",
            justifyContent: "space-between"
          }}
        >
          <div style={{ flex: 1, position: "relative", height: 40 }}>
            <button
              onClick={() => setActiveTab("menu")}
              style={{
                position: "absolute",
                inset: 0,
                background: "transparent",
                border: "none",
                cursor: "pointer"
              }}
            >
              <div
                style={{
                  width: 136.79,
                  left: -1.4,
                  top: 28,
                  position: "absolute",
                  textAlign: "center",
                  color: isMenu ? "#FFCFD0" : "#999999",
                  fontSize: 10,
                  fontFamily: "SF Pro",
                  fontWeight: 510
                }}
              >
                点餐
              </div>
              <div
                style={{
                  width: 30,
                  height: 30,
                  left: 52,
                  top: -5,
                  position: "absolute",
                  overflow: "hidden"
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    backgroundColor: isMenu ? activeIconColor : inactiveIconColor,
                    WebkitMaskImage: `url(${imgMdiLightClipboardText})`,
                    maskImage: `url(${imgMdiLightClipboardText})`,
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    WebkitMaskSize: "contain",
                    maskSize: "contain"
                  }}
                />
              </div>
            </button>
          </div>
          <div style={{ flex: 1, position: "relative", height: 40 }}>
            <button
              onClick={goToConfirm}
              style={{
                position: "absolute",
                inset: 0,
                background: "transparent",
                border: "none",
                cursor: "pointer"
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  left: 52,
                  top: -5,
                  position: "absolute",
                  display: "block",
                  backgroundColor: inactiveIconColor,
                  WebkitMaskImage: `url(${imgVector})`,
                  maskImage: `url(${imgVector})`,
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  WebkitMaskSize: "contain",
                  maskSize: "contain"
                }}
              />
              <div
                style={{
                  width: 136.79,
                  left: -1.4,
                  top: 28,
                  position: "absolute",
                  textAlign: "center",
                  color: "#999999",
                  fontSize: 10,
                  fontFamily: "SF Pro",
                  fontWeight: 510
                }}
              >
                下单{totalCount > 0 ? ` (${totalCount})` : ""}
              </div>
            </button>
          </div>
          <div style={{ flex: 1, position: "relative", height: 40 }}>
            <button
              onClick={() => setActiveTab("mine")}
              style={{
                position: "absolute",
                inset: 0,
                background: "transparent",
                border: "none",
                cursor: "pointer"
              }}
            >
              <div
                style={{
                  width: 136.79,
                  left: -1.4,
                  top: 28,
                  position: "absolute",
                  textAlign: "center",
                  color: isMine ? "#FFCFD0" : "#999999",
                  fontSize: 10,
                  fontFamily: "SF Pro",
                  fontWeight: 510
                }}
              >
                我的
              </div>
              <div
                style={{
                  width: 30,
                  height: 30,
                  left: 52,
                  top: -6,
                  position: "absolute",
                  overflow: "hidden"
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    backgroundColor: isMine ? activeIconColor : inactiveIconColor,
                    WebkitMaskImage: `url(${imgVector1})`,
                    maskImage: `url(${imgVector1})`,
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    WebkitMaskSize: "contain",
                    maskSize: "contain"
                  }}
                />
              </div>
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}
