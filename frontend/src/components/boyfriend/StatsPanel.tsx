import { useMemo } from "react";
import { useAppStore } from "../../store/appStore";

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function StatsPanel() {
  const { orders, messages, menuList } = useAppStore();

  const stats = useMemo(() => {
    const today = new Date();
    const todayOrders = orders.filter((order) => {
      const date = new Date(order.createdAt);
      return !Number.isNaN(date.getTime()) && isSameDay(date, today);
    });
    const todayMessages = messages.filter((message) => {
      const date = new Date(message.createdAt);
      return !Number.isNaN(date.getTime()) && isSameDay(date, today);
    });

    const counts = new Map<number, number>();
    orders.forEach((order) => {
      order.items.forEach((item) => {
        counts.set(item.dishId, (counts.get(item.dishId) ?? 0) + item.quantity);
      });
    });
    let popular = menuList[0]?.name ?? "还没有统计";
    let maxCount = 0;
    counts.forEach((count, dishId) => {
      if (count > maxCount) {
        maxCount = count;
        const found = menuList.find((item) => item.id === dishId);
        if (found) popular = found.name;
      }
    });

    const total = orders.length || 1;
    const completed = orders.filter((order) => order.status === "完成").length;
    const rate = Math.min(98, Math.max(85, Math.round(88 + (completed / total) * 10)));

    return {
      todayOrders: todayOrders.length,
      todayMessages: todayMessages.length,
      popular,
      rate
    };
  }, [orders, messages, menuList]);

  return (
    <div className="rounded-[24px] border border-[rgba(255,207,208,0.6)] bg-[rgba(254,242,241,0.5)] p-4 shadow-[0px_4px_16px_rgba(246,193,204,0.08)] backdrop-blur">
      <div className="text-[16px] font-bold text-[#5A4A4E]">今日统计数据</div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-[16px] border border-[rgba(237,231,233,0.6)] bg-[rgba(255,255,255,0.95)] p-3 text-center shadow-[0px_2px_12px_rgba(246,193,204,0.06)]">
          <div className="text-[24px] font-bold text-[#C17B8A]">{stats.todayOrders}</div>
          <div className="text-[11px] text-[#A89B9E]">今日订单量</div>
        </div>
        <div className="rounded-[16px] border border-[rgba(237,231,233,0.6)] bg-[rgba(255,255,255,0.95)] p-3 text-center shadow-[0px_2px_12px_rgba(246,193,204,0.06)]">
          <div className="text-[24px] font-bold text-[#C17B8A]">{stats.todayMessages}</div>
          <div className="text-[11px] text-[#A89B9E]">留言数量</div>
        </div>
      </div>
      <div className="mt-3 rounded-[16px] border border-[rgba(237,231,233,0.6)] bg-[rgba(255,255,255,0.95)] p-3 shadow-[0px_2px_12px_rgba(246,193,204,0.06)]">
        <div className="text-[12px] font-semibold text-[#5A4A4E]">最受欢迎菜</div>
        <div className="mt-1 text-[14px] font-bold text-[#C17B8A]">{stats.popular}</div>
      </div>
      <div className="mt-3 rounded-[16px] border border-[rgba(237,231,233,0.6)] bg-[rgba(255,255,255,0.95)] p-3 shadow-[0px_2px_12px_rgba(246,193,204,0.06)]">
        <div className="flex items-center justify-between text-[12px] font-semibold text-[#5A4A4E]">
          <span>好评率💗</span>
          <span className="text-[14px] font-bold text-[#C17B8A]">{stats.rate}%</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-[rgba(255,207,208,0.25)]">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-[#F6C1CC] to-[#FFCFD0]"
            style={{ width: `${stats.rate}%` }}
          />
        </div>
      </div>
    </div>
  );
}
