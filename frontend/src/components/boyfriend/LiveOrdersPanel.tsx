import { useMemo, useState } from "react";
import { formatOrderTime } from "../../lib/orders";
import { useAppStore } from "../../store/appStore";

const statusSteps = ["未接单", "已接单", "烹饪中", "完成"] as const;

export default function LiveOrdersPanel() {
  const { orders, updateOrderStatus, adjustOrderItemQty } = useAppStore();
  const activeOrders = useMemo(() => orders.filter((order) => order.items.length > 0), [orders]);
  const [index, setIndex] = useState(0);
  const activeOrder = activeOrders[index] ?? null;

  const handleNext = () => {
    if (!activeOrders.length) return;
    setIndex((prev) => (prev + 1) % activeOrders.length);
  };

  const handleAccept = () => {
    if (!activeOrder) return;
    updateOrderStatus(activeOrder.id, "已接单", { notify: true });
  };

  const handleStatus = (status: (typeof statusSteps)[number]) => {
    if (!activeOrder) return;
    updateOrderStatus(activeOrder.id, status, { notify: status !== activeOrder.status });
  };

  return (
    <div className="rounded-[20px] border border-[rgba(255,207,208,0.6)] bg-[rgba(255,255,255,0.72)] p-4 shadow-[0px_2px_12px_rgba(246,193,204,0.08)] backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[15px] font-bold text-[#5A4A4E]">她正在点的菜</div>
          <div className="mt-1 text-[11px] text-[#A89B9E]">
            {activeOrder ? `订单号：${activeOrder.orderNo}` : "还没有新订单"}
          </div>
          {activeOrder && (
            <div className="text-[11px] text-[#A89B9E]">下单时间：{formatOrderTime(activeOrder.createdAt)}</div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={handleNext}
            className="rounded-full border border-[#F6C1CC] bg-white px-3 py-1 text-[11px] font-semibold text-[#C17B8A] shadow-[0px_2px_8px_rgba(246,193,204,0.15)]"
          >
            切换订单
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={!activeOrder || activeOrder.status !== "未接单"}
            className="rounded-full border border-[#F6C1CC] bg-white px-3 py-1 text-[11px] font-semibold text-[#F6C1CC] shadow-[0px_2px_8px_rgba(246,193,204,0.15)] disabled:opacity-50"
          >
            接单
          </button>
        </div>
      </div>

      {activeOrder ? (
        <>
          <div className="mt-3 space-y-3">
            {activeOrder.items.map((item) => (
              <div
                key={`${activeOrder.id}-${item.dishId}`}
                className="flex items-center gap-3 rounded-[16px] border border-[rgba(237,231,233,0.6)] bg-white/90 px-3 py-3"
              >
                <div className="h-[56px] w-[56px] flex-shrink-0 rounded-[12px] border border-[rgba(237,231,233,0.5)] bg-[#FFEef0] text-[11px] text-[#C4C4C4] flex items-center justify-center">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name ?? ""}
                      className="h-full w-full rounded-[12px] object-cover"
                    />
                  ) : (
                    "图片"
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-bold text-[#5A4A4E]">
                    {item.name ?? "用心烹制"}
                  </div>
                  <div className="mt-1 text-[11px] text-[#A89B9E]">{item.description ?? "她点的备注在下面"}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => adjustOrderItemQty(activeOrder.id, item.dishId, -1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#F6C1CC] bg-white"
                  >
                    <span className="block h-[2px] w-3 rounded-full bg-[#C17B8A]" />
                  </button>
                  <div className="min-w-[16px] text-center text-[13px] font-bold text-[#5A4A4E]">
                    {item.quantity}
                  </div>
                  <button
                    type="button"
                    onClick={() => adjustOrderItemQty(activeOrder.id, item.dishId, 1)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#F6C1CC] bg-white"
                  >
                    <span className="relative block h-3 w-3">
                      <span className="absolute left-[5px] top-0 h-3 w-[2px] rounded-full bg-[#C17B8A]" />
                      <span className="absolute left-0 top-[5px] h-[2px] w-3 rounded-full bg-[#C17B8A]" />
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {activeOrder.note && (
            <div className="mt-3 rounded-[14px] border border-[rgba(246,193,204,0.6)] bg-[rgba(255,233,236,0.5)] px-3 py-2 text-[12px] text-[#C17B8A]">
              备注：{activeOrder.note}
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {statusSteps.map((status) => {
              const active = activeOrder.status === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleStatus(status)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                    active
                      ? "border-[#F6C1CC] bg-[#FFE9EC] text-[#C17B8A]"
                      : "border-[rgba(237,231,233,0.7)] bg-white text-[#A89B9E]"
                  }`}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <div className="mt-3 rounded-[16px] border border-[rgba(237,231,233,0.6)] bg-white/80 px-4 py-6 text-center text-[12px] text-[#A89B9E]">
          目前还没有新的订单哦～
        </div>
      )}
    </div>
  );
}
