import { useEffect, useState } from "react";
import { getOrders, Order, updateOrderStatus } from "../lib/api";

const statusLabel: Record<string, string> = {
  new: "新下单",
  seen: "已看到",
  cooking: "已做",
  done: "已完成"
};

const statusOptions = [
  { value: "new", label: "新下单" },
  { value: "seen", label: "已看到" },
  { value: "cooking", label: "已做" },
  { value: "done", label: "已完成" }
];

export default function AdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadOrders() {
    const data = await getOrders();
    setOrders(data);
  }

  useEffect(() => {
    loadOrders();
    const timer = setInterval(loadOrders, 5000);
    return () => clearInterval(timer);
  }, []);

  async function changeStatus(id: number, status: string) {
    setLoading(true);
    try {
      await updateOrderStatus(id, status);
      await loadOrders();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-3xl card-soft rounded-3xl p-8 shadow-soft">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl text-[#4b3a2f]">后台订单</h1>
          <span className="text-sm text-[#6d4c41]">实时刷新中</span>
        </div>

        <div className="mt-6 space-y-4">
          {orders.length === 0 && (
            <div className="rounded-2xl bg-white/80 px-4 py-6 text-center text-[#6d4c41]">
              暂时还没有订单
            </div>
          )}
          {orders.map((order) => (
            <div key={order.id} className="rounded-3xl bg-white/80 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm text-[#6d4c41]">
                  下单时间：{new Date(order.createdAt).toLocaleString()}
                </div>
                <div className="rounded-full bg-mint px-3 py-1 text-xs text-[#3a5a40]">
                  {statusLabel[order.status] || order.status}
                </div>
              </div>

              <div className="mt-3 space-y-1 text-[#4b3a2f]">
                {order.items.map((item) => (
                  <div key={`${order.id}-${item.dishId}`}>
                    {item.name} × {item.quantity}
                  </div>
                ))}
              </div>

              {order.note && (
                <div className="mt-3 rounded-2xl bg-[#f7f1e8] px-3 py-2 text-sm text-[#6d4c41]">
                  备注：{order.note}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    disabled={loading}
                    onClick={() => changeStatus(order.id, opt.value)}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      order.status === opt.value
                        ? "bg-leaf text-[#3a5a40]"
                        : "bg-white text-[#6d4c41]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
