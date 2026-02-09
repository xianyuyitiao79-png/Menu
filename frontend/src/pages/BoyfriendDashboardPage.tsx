import { useRef, type ChangeEvent } from "react";
import AccountSwitch from "../components/AccountSwitch";
import LiveOrdersPanel from "../components/boyfriend/LiveOrdersPanel";
import MessageSyncPanel from "../components/boyfriend/MessageSyncPanel";
import MenuManagePanel from "../components/boyfriend/MenuManagePanel";
import StatsPanel from "../components/boyfriend/StatsPanel";
import { useAppStore } from "../store/appStore";

const imgHeart = "https://www.figma.com/api/mcp/asset/0fbc796c-bc4b-40ce-bd62-69a54c7b16e6";

export default function BoyfriendDashboard() {
  const { avatars, setAvatar } = useAppStore();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const avatar = avatars.boyfriend_admin || null;

  function handleAvatarClick() {
    avatarInputRef.current?.click();
  }

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setAvatar("boyfriend_admin", reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
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
        <div className="absolute inset-0 bg-[#FFF8F5]" />
        <div className="absolute left-0 top-0 h-[159px] w-full bg-[#FFE9EC] border-b border-[#EDE7E9]" />
        <AccountSwitch iconSrc={imgHeart} />

        <div className="absolute left-0 top-0 h-full w-full px-5 pt-[84px] pb-6">
          <div
            className="glass-scroll h-full overflow-y-auto pr-2"
            style={{ ["--scrollbar-track-margin" as any]: "16px" }}
          >
            <div className="space-y-4">
              <div className="rounded-[20px] border border-[#FFCFD0] bg-[rgba(255,255,255,0.9)] p-4 shadow-[0px_2px_12px_rgba(246,193,204,0.08)] backdrop-blur">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    style={{
                      width: 72,
                      height: 72,
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
                  <div className="flex-1">
                    <div className="text-[16px] font-bold text-[#5A4A4E]">小涵老公</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {["大厨", "专一", "爱老婆"].map((tag) => (
                        <span
                          key={tag}
                          className="rounded-[12px] border border-[#FFCFD0] bg-[#FEF2F1] px-2 py-1 text-[11px] text-[#C17B8A]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <LiveOrdersPanel />
              <MessageSyncPanel />
              <StatsPanel />
              <MenuManagePanel />
              <div className="h-10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
