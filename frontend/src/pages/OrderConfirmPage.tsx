import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { OrderItem } from "../lib/api";
import AccountSwitch from "../components/AccountSwitch";
import { useAppStore } from "../store/appStore";

type ConfirmItem = OrderItem & {
  name?: string;
  image?: string;
  description?: string;
};

const imgFrame = "https://www.figma.com/api/mcp/asset/fedd7b33-00c6-40f7-af17-5898e3d9a756";
const imgRectangle = "https://www.figma.com/api/mcp/asset/b91d622e-e710-4cf2-aa95-ac2b0fe8d9f9";
const imgMdiLightClipboardText =
  "https://www.figma.com/api/mcp/asset/89f9f58d-756e-40e8-814a-1cc0ee0dc8c3";
const imgVector = "https://www.figma.com/api/mcp/asset/63827509-5eab-4620-9360-bf5b75bb6123";
const imgVector1 = "https://www.figma.com/api/mcp/asset/eb51a2b8-7acf-4bb6-93af-dfc4875bf2c6";

const placeholderText = "不吃香菜也没关系";
const ITEM_HEIGHT = 86;
const ITEM_GAP = 12;
const VISIBLE_ITEMS = 4;
const LIST_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS + ITEM_GAP * (VISIBLE_ITEMS - 1);
const activeIconColor = "#FFCFD0";
const inactiveIconColor = "#999999";

export default function OrderConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { placeOrder, menuList } = useAppStore();
  const initialItems = (location.state?.items as ConfirmItem[] | undefined) ?? [];
  const [items, setItems] = useState<ConfirmItem[]>(
    Array.isArray(initialItems) ? initialItems : []
  );
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const [thumbStyle, setThumbStyle] = useState({ top: 0, height: 95 });
  const listHeight = LIST_HEIGHT;

  const totalCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  useEffect(() => {
    const el = listRef.current;
    if (!el) return;

    const trackHeight = listHeight;
    const update = () => {
      const scrollHeight = el.scrollHeight;
      const clientHeight = el.clientHeight;
      if (scrollHeight <= clientHeight + 1) {
        setThumbStyle({ top: 0, height: trackHeight });
        return;
      }
      const thumbHeight = Math.max(
        60,
        Math.round((clientHeight / scrollHeight) * trackHeight)
      );
      const maxTop = trackHeight - thumbHeight;
      const ratio = el.scrollTop / (scrollHeight - clientHeight);
      setThumbStyle({
        top: Math.round(maxTop * ratio),
        height: thumbHeight
      });
    };

    update();
    el.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [items.length, listHeight]);

  useEffect(() => {
    // keep list height fixed to exactly 4 cards
  }, []);

  useEffect(() => {
    if (!menuList.length) return;
    setItems((prev) => {
      let changed = false;
      const next = prev.map((item) => {
        const updated = menuList.find((dish) => dish.id === item.dishId);
        if (!updated) return item;
        const hasDiff =
          updated.name !== item.name ||
          updated.image !== item.image ||
          updated.description !== item.description;
        if (!hasDiff) return item;
        changed = true;
        return {
          ...item,
          name: updated.name,
          image: updated.image,
          description: updated.description ?? item.description
        };
      });
      return changed ? next : prev;
    });
  }, [menuList]);

  function adjustQty(dishId: number, delta: number) {
    setItems((prev) =>
      prev.flatMap((item) => {
        if (item.dishId !== dishId) return [item];
        const nextQty = item.quantity + delta;
        if (nextQty <= 0) return [];
        return [{ ...item, quantity: nextQty }];
      })
    );
  }

  async function handleConfirm() {
    const payloadItems = items
      .filter((item) => item.quantity > 0)
      .map((item) => ({
        dishId: item.dishId,
        name: item.name,
        quantity: item.quantity
      }));

    if (!payloadItems.length) {
      navigate("/");
      return;
    }

    try {
      setSubmitting(true);
      placeOrder({
        items: items
          .filter((item) => item.quantity > 0)
          .map((item) => ({
            dishId: item.dishId,
            name: item.name,
            quantity: item.quantity,
            image: item.image,
            description: item.description
          })),
        note: note.trim() ? note.trim() : undefined
      });
      navigate("/", { state: { tab: "mine" } });
    } catch (error) {
      alert("下单失败，请稍后再试");
    } finally {
      setSubmitting(false);
    }
  }

  function goToMenu() {
    const payload = items
      .filter((item) => item.quantity > 0)
      .map(({ dishId, quantity, name, image, description }) => ({
        dishId,
        quantity,
        name,
        image,
        description
      }));
    navigate("/", { state: { tab: "menu", items: payload } });
  }

  function goToMine() {
    const payload = items
      .filter((item) => item.quantity > 0)
      .map(({ dishId, quantity, name, image, description }) => ({
        dishId,
        quantity,
        name,
        image,
        description
      }));
    navigate("/", { state: { tab: "mine", items: payload } });
  }

  function goToConfirmTab() {
    navigate("/confirm", { state: { items } });
  }

  return (
    <div className="min-h-screen bg-[#f6f2f1] flex items-center justify-center py-6">
      <div
        className="relative overflow-hidden rounded-[20px]"
        style={{
          width: 474,
          height: 996,
          background: "rgba(240, 240, 240, 0.30)",
          boxShadow:
            "-2px 4px 10px rgba(145, 145, 145, 0.05), -7px 17px 18px rgba(145, 145, 145, 0.04), -15px 37px 24px rgba(145, 145, 145, 0.03), -27px 66px 29px rgba(145, 145, 145, 0.01), -42px 103px 31px rgba(145, 145, 145, 0), 0px 4px 4px rgba(255, 255, 255, 0.25) inset, 0px -5px 4px rgba(255, 255, 255, 0.25) inset",
          backdropFilter: "blur(10px)",
          fontFamily: "Helvetica, 'Be Vietnam Pro', 'SF Pro', sans-serif"
        }}
      >
        <div
          style={{
            width: 474,
            height: 996,
            left: 0,
            top: 0,
            position: "absolute",
            background: "#FFF8F5"
          }}
        />
        <div
          style={{
            width: 474,
            height: 159,
            left: 0,
            top: 0,
            position: "absolute",
            background: "#FFE9EC",
            borderBottom: "1px solid #EDE7E9"
          }}
        />

        <AccountSwitch iconSrc={imgFrame} />

        <div
          style={{
            left: 185,
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
          下单确认
        </div>
        <div
          style={{
            left: 161,
            top: 91,
            position: "absolute",
            textAlign: "center",
            color: "#8B7B7E",
            fontSize: 15,
            fontFamily: "Helvetica",
            fontWeight: 400,
            lineHeight: "24px",
            letterSpacing: 0.38
          }}
        >
          小的定会如期奉上美味
        </div>

        <div
          style={{
            left: 30,
            top: 172,
            position: "absolute",
            color: "#A89B9E",
            fontSize: 13,
            fontFamily: "Helvetica",
            fontWeight: 400,
            lineHeight: "20.15px",
            letterSpacing: 0.32
          }}
        >
          已选菜品 · {totalCount} 道
        </div>

        <div
          style={{
            width: 434,
            height: 400,
            left: 20,
            top: 197,
            position: "absolute",
            background: "#FEF2F1",
            borderRadius: 20,
            border: "1px solid #FFCFD0",
            backdropFilter: "blur(7.5px)",
            boxSizing: "border-box"
          }}
        >
          <div
            style={{
              position: "absolute",
              left: 10,
              top: 10,
              width: 408,
              height: LIST_HEIGHT,
              minHeight: LIST_HEIGHT,
              maxHeight: LIST_HEIGHT,
              overflow: "hidden",
              boxSizing: "border-box"
            }}
          >
            <div
              ref={listRef}
              className="confirm-scroll glass-scroll"
              style={{
                width: "100%",
                height: "100%",
                overflowY: "auto",
                paddingTop: 12,
                paddingBottom: 12,
                paddingRight: 12,
                display: "flex",
                flexDirection: "column",
                gap: ITEM_GAP,
                boxSizing: "border-box",
                ["--scrollbar-track-margin" as any]: "12px"
              }}
            >
            {items.length === 0 ? (
              <div
                style={{
                  height: 80,
                  borderRadius: 16,
                  background: "white",
                  border: "1px solid rgba(237, 231, 233, 0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#C4C4C4",
                  fontSize: 12
                }}
              >
                还没有选菜哦
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.dishId}
                  style={{
                    width: 396,
                    height: ITEM_HEIGHT,
                    background: "white",
                    borderRadius: 16,
                    border: "1px solid rgba(237, 231, 233, 0.60)",
                    display: "flex",
                    alignItems: "center",
                    padding: "0 12px",
                    boxSizing: "border-box",
                    flexShrink: 0
                  }}
                >
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      background: "#FFEEF0",
                      borderRadius: 12,
                      border: "1px solid rgba(237, 231, 233, 0.50)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      flexShrink: 0,
                      color: "#C4C4C4",
                      fontSize: 12
                    }}
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name ?? ""}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      "暂无图片"
                    )}
                  </div>
                  <div style={{ marginLeft: 10, flex: 1 }}>
                    <div
                      style={{
                        color: "#5A4A4E",
                        fontSize: 15,
                        fontWeight: 700,
                        lineHeight: "20.8px"
                      }}
                    >
                      {item.name ?? "用心烹制"}
                    </div>
                    <div
                      style={{
                        marginTop: 6,
                        color: "#A89B9E",
                        fontSize: 12,
                        fontWeight: 400,
                        lineHeight: "20.15px",
                        letterSpacing: 0.32
                      }}
                    >
                      {item.description ?? "用心烹制，鲜嫩多汁"}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => adjustQty(item.dishId, -1)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 16,
                        border: "2px solid #F6C1CC",
                        background: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0
                      }}
                    >
                      <span
                        style={{
                          width: 12,
                          height: 2,
                          background: "#C17B8A",
                          display: "block",
                          borderRadius: 999
                        }}
                      />
                    </button>
                    <div
                      style={{
                        minWidth: 16,
                        textAlign: "center",
                        color: "#5A4A4E",
                        fontSize: 15,
                        fontWeight: 700,
                        lineHeight: "20.8px"
                      }}
                    >
                      {item.quantity}
                    </div>
                    <button
                      type="button"
                      onClick={() => adjustQty(item.dishId, 1)}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 16,
                        border: "2px solid #F6C1CC",
                        background: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0
                      }}
                    >
                      <span
                        style={{
                          position: "relative",
                          width: 12,
                          height: 12,
                          display: "block"
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            left: 5,
                            top: 0,
                            width: 2,
                            height: 12,
                            background: "#C17B8A",
                            borderRadius: 999
                          }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            left: 0,
                            top: 5,
                            width: 12,
                            height: 2,
                            background: "#C17B8A",
                            borderRadius: 999
                          }}
                        />
                      </span>
                    </button>
                  </div>
                </div>
              ))
            )}
            </div>
          </div>
        </div>

        <div
          style={{
            width: 8,
            height: listHeight,
            left: 435,
            top: 214,
            position: "absolute",
            background: "white",
            borderRadius: 8,
            border: "1px solid #DEDEE2",
            boxSizing: "border-box",
            overflow: "hidden"
          }}
        >
          <div
            style={{
              width: 8,
              height: thumbStyle.height,
              position: "absolute",
              top: thumbStyle.top,
              left: 0,
              background: "#FFEEF0",
              borderRadius: 8,
              border: "1px solid #FFCFD0",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div
          style={{
            width: 434,
            height: 229,
            left: 20,
            top: 611,
            position: "absolute",
            background: "rgba(255, 238, 240, 0.30)",
            boxShadow: "0px 2px 12px rgba(246, 193, 204, 0.08)",
            borderRadius: 20,
            border: "1px solid #FFCFD0",
            backdropFilter: "blur(10px)"
          }}
        >
          <div
            style={{
              left: 24,
              top: 16,
              position: "absolute",
              color: "#5A4A4E",
              fontSize: 16,
              fontWeight: 700,
              lineHeight: "20.8px"
            }}
          >
            如有需求请涵涵老婆备注哦～ 💗
          </div>
          <div
            style={{
              width: 399,
              height: 168,
              left: 17,
              top: 46,
              position: "absolute",
              background: "white",
              borderRadius: 17,
              border: "1px solid #DEDEE2"
            }}
          />
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={placeholderText}
            rows={4}
            style={{
              position: "absolute",
              left: 35,
              top: 64,
              width: 363,
              height: 132,
              border: "none",
              resize: "none",
              outline: "none",
              background: "transparent",
              color: "#5A4A4E",
              fontSize: 13,
              lineHeight: "20px"
            }}
          />
        </div>

        <button
          type="button"
          onClick={() =>
            navigate("/", {
              state: {
                items: items
                  .filter((item) => item.quantity > 0)
                  .map(({ dishId, quantity, name, image, description }) => ({
                    dishId,
                    quantity,
                    name,
                    image,
                    description
                  }))
              }
            })
          }
          style={{
            width: 213,
            height: 44,
            left: 20,
            top: 855,
            position: "absolute",
            background: "white",
            borderRadius: 24,
            border: "2px solid #F6C1CC",
            color: "#C17B8A",
            fontSize: 15,
            fontWeight: 700,
            lineHeight: "20.8px"
          }}
        >
          返回菜单
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={submitting}
          style={{
            width: 209,
            height: 44,
            left: 245,
            top: 855,
            position: "absolute",
            background: "#FFCFD0",
            borderRadius: 24,
            color: "white",
            fontSize: 15,
            fontWeight: 700,
            lineHeight: "20.8px",
            opacity: submitting ? 0.6 : 1
          }}
        >
          {submitting ? "提交中…" : "确认下单"}
        </button>

        <div
          style={{
            width: 491,
            height: 83,
            left: -11,
            top: 913,
            position: "absolute",
            background: "#FFF8F5",
            outline: "1px #EDE7E9 solid",
            outlineOffset: -0.5
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
            justifyContent: "space-between",
            alignItems: "flex-start",
            display: "inline-flex"
          }}
        >
          <div style={{ flex: "1 1 0", height: 40, position: "relative" }}>
            <button
              onClick={goToMenu}
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
                  color: "#999999",
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
                    backgroundColor: inactiveIconColor,
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
          <div style={{ flex: "1 1 0", height: 40, position: "relative" }}>
            <button
              onClick={goToConfirmTab}
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
                  position: "absolute"
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "block",
                    backgroundColor: activeIconColor,
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
              </div>
              <div
                style={{
                  width: 136.79,
                  left: -1.4,
                  top: 28,
                  position: "absolute",
                  textAlign: "center",
                  color: "#FFCFD0",
                  fontSize: 10,
                  fontFamily: "SF Pro",
                  fontWeight: 510
                }}
              >
                下单
              </div>
            </button>
          </div>
          <div style={{ flex: "1 1 0", height: 40, position: "relative" }}>
            <button
              onClick={goToMine}
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
                  color: "#999999",
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
                    backgroundColor: inactiveIconColor,
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
