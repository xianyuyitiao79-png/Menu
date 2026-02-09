import { useState } from "react";
import { StoredOrder, StoredOrderStatus, formatOrderTime } from "../lib/orders";

const statusStyles: Record<StoredOrderStatus, { background: string; border: string; color: string }> = {
  未接单: {
    background: "#FFF",
    border: "1px solid #F6C1CC",
    color: "#C17B8A"
  },
  已接单: {
    background: "#F6C1CC",
    border: "1px solid #F6C1CC",
    color: "#FFFFFF"
  },
  烹饪中: {
    background: "#FFE9EC",
    border: "1px solid #F6C1CC",
    color: "#C17B8A"
  },
  完成: {
    background: "#E9B7C3",
    border: "1px solid #E9B7C3",
    color: "#FFFFFF"
  }
};

type MyOrdersCardProps = {
  orders: StoredOrder[];
};

export default function MyOrdersCard({ orders }: MyOrdersCardProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleOrder = (orderId: string) => {
    setExpandedId((prev) => (prev === orderId ? null : orderId));
  };

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.72)",
        borderRadius: 18,
        border: "1px solid rgba(246,193,204,0.6)",
        boxShadow: "0 10px 24px rgba(0,0,0,0.06)",
        backdropFilter: "blur(16px)",
        padding: 16,
        display: "flex",
        flexDirection: "column",
        gap: 12
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#5A4A4E",
        marginBottom: 4
      }}
    >
      我的订单
    </div>
      {orders.length === 0 ? (
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
          还没有订单，快去下单吧～
        </div>
      ) : (
        orders.map((order) => {
          const isExpanded = expandedId === order.id;
          const totalCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
          return (
            <div
              key={order.id}
              style={{
                padding: 12,
                borderRadius: 14,
                background: "rgba(255,255,255,0.85)",
                border: "1px solid rgba(237,231,233,0.8)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: "#5A4A4E",
                      lineHeight: "18px"
                    }}
                  >
                    订单 {order.orderNo}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 12,
                      color: "#A89B9E",
                      lineHeight: "16px"
                    }}
                  >
                    下单时间：{formatOrderTime(order.createdAt)}
                  </div>
                  <div
                    style={{
                      marginTop: 4,
                      fontSize: 11,
                      color: "#C17B8A"
                    }}
                  >
                    共 {totalCount} 道菜
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: 6
                  }}
                >
                  <span
                    style={{
                      padding: "6px 12px",
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 600,
                      ...statusStyles[order.status]
                    }}
                  >
                    {order.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleOrder(order.id)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      border: "1px solid #F6C1CC",
                      background: "white",
                      color: "#C17B8A",
                      fontSize: 11,
                      cursor: "pointer"
                    }}
                  >
                    {isExpanded ? "收起" : "查看订单"}
                  </button>
                </div>
              </div>
              {isExpanded && (
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    background: "rgba(255,239,242,0.6)",
                    borderRadius: 12,
                    padding: 10,
                    border: "1px dashed rgba(246,193,204,0.6)"
                  }}
                >
                  {order.items.map((item, index) => (
                    <div
                      key={`${order.id}-${item.dishId}-${index}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: 12,
                        color: "#5A4A4E"
                      }}
                    >
                      <span>{item.name ?? "用心烹制"}</span>
                      <span>× {item.quantity}</span>
                    </div>
                  ))}
                  {order.note && (
                    <div style={{ fontSize: 11, color: "#B39BA0" }}>备注：{order.note}</div>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
