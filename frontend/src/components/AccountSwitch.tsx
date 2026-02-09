import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/appStore";

const roleLabels = {
  girlfriend_view: "girlfriend_view",
  boyfriend_admin: "boyfriend_admin"
};

export default function AccountSwitch({ iconSrc }: { iconSrc: string }) {
  const { userRole, setUserRole } = useAppStore();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!open) return;
    const handleClick = (event: MouseEvent) => {
      if (!panelRef.current) return;
      if (panelRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSwitch = (role: "girlfriend_view" | "boyfriend_admin") => {
    setUserRole(role);
    setOpen(false);
    if (role === "boyfriend_admin" && location.pathname !== "/boyfriend") {
      navigate("/boyfriend");
    }
    if (role === "girlfriend_view" && location.pathname === "/boyfriend") {
      navigate("/");
    }
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: "absolute",
        left: 406,
        top: 24,
        width: 44,
        height: 44,
        zIndex: 30
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: 44,
          height: 44,
          borderRadius: 9999,
          border: "none",
          background: "white",
          boxShadow: "0px 2px 10px rgba(246, 193, 204, 0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 0
        }}
        aria-label="切换账号"
      >
        <img src={iconSrc} alt="" style={{ width: 22, height: 22 }} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: 54,
            right: -4,
            width: 200,
            padding: 12,
            borderRadius: 16,
            background: "rgba(255, 255, 255, 0.92)",
            border: "1px solid rgba(246, 193, 204, 0.7)",
            boxShadow: "0 12px 24px rgba(246,193,204,0.25)",
            backdropFilter: "blur(12px)",
            display: "flex",
            flexDirection: "column",
            gap: 10
          }}
        >
          {(["girlfriend_view", "boyfriend_admin"] as const).map((role) => {
            const active = userRole === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => handleSwitch(role)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: active ? "1px solid #F6C1CC" : "1px solid rgba(237,231,233,0.7)",
                  background: active ? "rgba(255, 233, 236, 0.9)" : "rgba(255,255,255,0.85)",
                  color: "#5A4A4E",
                  fontSize: 12,
                  textAlign: "left",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <span style={{ fontWeight: 600 }}>{roleLabels[role]}</span>
                {active && (
                  <span style={{ fontSize: 10, color: "#C17B8A" }}>当前</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
