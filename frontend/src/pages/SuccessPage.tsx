import { useLocation, useNavigate } from "react-router-dom";

export default function SuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const order = location.state as { items?: { name: string; quantity: number }[] } | null;

  return (
    <div className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-xl card-soft rounded-3xl p-8 shadow-soft text-center">
        <div className="text-3xl mb-4">点单成功 🎉</div>
        <div className="text-[#6d4c41]">今天点了什么</div>
        <div className="mt-4 space-y-2">
          {order?.items?.length ? (
            order.items.map((item, index) => (
              <div key={`${item.name}-${index}`} className="rounded-2xl bg-white/80 px-4 py-2">
                {item.name} × {item.quantity}
              </div>
            ))
          ) : (
            <div className="rounded-2xl bg-white/80 px-4 py-2">还没有内容～</div>
          )}
        </div>
        <div className="mt-6 text-lg text-[#4b3a2f]">你负责吃，我负责做 ❤️</div>
        <button
          onClick={() => navigate("/")}
          className="mt-6 rounded-full bg-[#77b28c] px-6 py-2 text-white"
        >
          继续点菜
        </button>
      </div>
    </div>
  );
}
