import { useEffect, useRef, useState } from "react";
import { formatMessageTime, useAppStore } from "../../store/appStore";

export default function MessageSyncPanel() {
  const { messages, addMessage } = useAppStore();
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    addMessage({ sender: "him", text });
    setInput("");
  };

  return (
    <div className="rounded-[24px] border border-[rgba(255,207,208,0.6)] bg-[rgba(254,242,241,0.5)] p-4 shadow-[0px_4px_16px_rgba(246,193,204,0.08)] backdrop-blur">
      <div className="text-[16px] font-bold text-[#5A4A4E]">她的小留言</div>
      <div
        className="glass-scroll mt-3 max-h-[240px] space-y-3 overflow-y-auto rounded-[20px] border border-[rgba(237,231,233,0.4)] bg-[rgba(255,255,255,0.65)] p-3"
        style={{ ["--scrollbar-track-margin" as any]: "10px" }}
      >
        {messages.map((item) => {
          const isHer = item.sender === "me";
          return (
            <div
              key={item.id}
              className={`flex ${isHer ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[78%] rounded-[16px] border px-3 py-2 text-[12px] text-[#5A4A4E] shadow-[0_6px_16px_rgba(0,0,0,0.05)] ${
                  isHer
                    ? "border-[#FFCfd0] bg-[rgba(255,207,208,0.3)]"
                    : "border-[rgba(237,231,233,0.6)] bg-[rgba(255,255,255,0.95)]"
                }`}
              >
                <div className="whitespace-pre-wrap leading-5">{item.text}</div>
                <div
                  className={`mt-1 text-[10px] text-[#A89B9E] ${
                    isHer ? "text-left" : "text-right"
                  }`}
                >
                  {formatMessageTime(item.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              handleSend();
            }
          }}
          placeholder="回复她的留言..."
          className="flex-1 rounded-[14px] border border-[rgba(237,231,233,0.6)] bg-[rgba(255,255,255,0.9)] px-3 py-2 text-[12px] text-[#5A4A4E] outline-none"
        />
        <button
          type="button"
          onClick={handleSend}
          className="flex h-[38px] w-[46px] items-center justify-center rounded-[14px] bg-gradient-to-br from-[#F6C1CC] to-[#FFCFD0] text-white shadow-[0px_2px_8px_rgba(246,193,204,0.2)]"
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
  );
}
