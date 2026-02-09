import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { useAppStore, type MenuItem } from "../../store/appStore";

const emptyDraft = {
  name: "",
  categoryId: 1,
  tags: "",
  image: "",
  description: ""
};

export default function MenuManagePanel() {
  const { menuList, categories, addMenuItem, updateMenuItem, deleteMenuItem } = useAppStore();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(() => ({ ...emptyDraft }));
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [searching, setSearching] = useState(false);

  const categoryMap = useMemo(() => {
    return categories.reduce<Record<number, string>>((acc, item) => {
      acc[item.id] = item.name;
      return acc;
    }, {});
  }, [categories]);

  const startCreate = () => {
    setEditingId(null);
    setEditorOpen(true);
    setDraft({ ...emptyDraft, categoryId: categories[0]?.id ?? 1 });
  };

  const startEdit = (item: MenuItem) => {
    setEditingId(item.id);
    setEditorOpen(true);
    setDraft({
      name: item.name,
      categoryId: item.categoryId,
      tags: item.tags ?? "",
      image: item.image ?? "",
      description: item.description ?? ""
    });
  };

  const handleSave = () => {
    if (!draft.name.trim()) return;
    if (editingId) {
      updateMenuItem(editingId, { ...draft, name: draft.name.trim() });
    } else {
      addMenuItem({ ...draft, name: draft.name.trim() });
    }
    setEditingId(null);
    setEditorOpen(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditorOpen(false);
  };

  function handleImagePick() {
    imageInputRef.current?.click();
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setDraft((prev) => ({ ...prev, image: reader.result }));
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  }

  function handleAutoSearchImage() {
    const query = draft.name.trim() || draft.tags.trim() || "food";
    const primaryUrl = `https://loremflickr.com/640/640/${encodeURIComponent(query)}?lock=${Date.now()}`;
    const fallbackUrl = `https://picsum.photos/seed/${encodeURIComponent(query)}/640/640`;
    setSearching(true);
    const img = new Image();
    img.onload = () => {
      setDraft((prev) => ({ ...prev, image: img.currentSrc || img.src }));
      setSearching(false);
    };
    img.onerror = () => {
      const fallback = new Image();
      fallback.onload = () => {
        setDraft((prev) => ({ ...prev, image: fallback.currentSrc || fallback.src }));
        setSearching(false);
      };
      fallback.onerror = () => {
        setDraft((prev) => ({ ...prev, image: "" }));
        setSearching(false);
      };
      fallback.src = fallbackUrl;
    };
    img.src = primaryUrl;
  }

  return (
    <div className="rounded-[24px] border border-[rgba(255,207,208,0.6)] bg-[rgba(254,242,241,0.5)] p-4 shadow-[0px_4px_16px_rgba(246,193,204,0.08)] backdrop-blur">
      <div className="flex items-center justify-between">
        <div className="text-[16px] font-bold text-[#5A4A4E]">菜单管理区</div>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-full border border-[#F6C1CC] bg-white px-3 py-1 text-[11px] font-semibold text-[#C17B8A]"
        >
          新增
        </button>
      </div>

      {editorOpen && (
        <div className="mt-3 rounded-[16px] border border-[rgba(237,231,233,0.6)] bg-white/90 p-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={draft.name}
              onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="菜名"
              className="rounded-[12px] border border-[rgba(237,231,233,0.8)] bg-white/90 px-3 py-2 text-[12px] text-[#5A4A4E] outline-none"
            />
            <select
              value={draft.categoryId}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, categoryId: Number(event.target.value) }))
              }
              className="rounded-[12px] border border-[rgba(237,231,233,0.8)] bg-white/90 px-3 py-2 text-[12px] text-[#5A4A4E] outline-none"
            >
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <input
            value={draft.tags}
            onChange={(event) => setDraft((prev) => ({ ...prev, tags: event.target.value }))}
            placeholder="标签（如：她最爱）"
            className="mt-2 w-full rounded-[12px] border border-[rgba(237,231,233,0.8)] bg-white/90 px-3 py-2 text-[12px] text-[#5A4A4E] outline-none"
          />
          <div className="mt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleImagePick}
              className="rounded-[12px] border border-[rgba(237,231,233,0.8)] bg-white/90 px-3 py-2 text-[12px] text-[#5A4A4E]"
            >
              上传图片
            </button>
            <button
              type="button"
              onClick={handleAutoSearchImage}
              disabled={searching}
              className="rounded-[12px] border border-[rgba(237,231,233,0.8)] bg-white/90 px-3 py-2 text-[12px] text-[#5A4A4E] disabled:opacity-60"
            >
              {searching ? "搜索中..." : "自动搜图"}
            </button>
            {draft.image ? (
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 overflow-hidden rounded-[10px] border border-[rgba(237,231,233,0.6)] bg-[#FFF6F8]">
                  <img src={draft.image} alt="预览" className="h-full w-full object-cover" />
                </div>
                <button
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, image: "" }))}
                  className="text-[11px] text-[#C17B8A]"
                >
                  清除
                </button>
              </div>
            ) : (
              <span className="text-[11px] text-[#A89B9E]">未选择图片</span>
            )}
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />
          </div>
          <input
            value={draft.description}
            onChange={(event) => setDraft((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="描述"
            className="mt-2 w-full rounded-[12px] border border-[rgba(237,231,233,0.8)] bg-white/90 px-3 py-2 text-[12px] text-[#5A4A4E] outline-none"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-full border border-[rgba(237,231,233,0.8)] bg-white px-3 py-1 text-[11px] text-[#A89B9E]"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded-full border border-[#F6C1CC] bg-[#FFCFD0] px-3 py-1 text-[11px] font-semibold text-white"
            >
              保存
            </button>
          </div>
        </div>
      )}

      <div
        className="glass-scroll mt-3 max-h-[240px] space-y-3 overflow-y-auto pr-1"
        style={{ ["--scrollbar-track-margin" as any]: "10px" }}
      >
        {menuList.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-[16px] border border-[rgba(237,231,233,0.6)] bg-white/90 px-3 py-3 shadow-[0px_2px_12px_rgba(246,193,204,0.06)]"
          >
            <div className="h-[56px] w-[56px] flex-shrink-0 overflow-hidden rounded-[12px] border border-[rgba(237,231,233,0.5)] bg-[#FFF6F8] text-[10px] text-[#C4C4C4] flex items-center justify-center">
              {item.image ? (
                <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
              ) : (
                "暂无图片"
              )}
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-bold text-[#5A4A4E]">{item.name}</div>
              <div className="mt-1 flex flex-wrap gap-2">
                <span className="rounded-[8px] border border-[#C17B8A] bg-[rgba(193,123,138,0.15)] px-2 py-0.5 text-[10px] text-[#C17B8A]">
                  {categoryMap[item.categoryId] ?? "分类"}
                </span>
                {item.tags && item.tags.trim() && (
                  <span className="rounded-[8px] border border-[#F6C1CC] bg-[rgba(255,207,208,0.3)] px-2 py-0.5 text-[10px] text-[#C17B8A]">
                    {item.tags}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => startEdit(item)}
                className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#FFCfd0] bg-[rgba(254,242,241,0.7)]"
                aria-label="编辑菜品"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 16.5V20h3.5L18.8 8.7l-3.5-3.5L4 16.5Z"
                    stroke="#C17B8A"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13.5 5l3.5 3.5"
                    stroke="#C17B8A"
                    strokeWidth="1.5"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => deleteMenuItem(item.id)}
                className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#FFCfd0] bg-[rgba(255,233,236,0.6)] text-[11px] text-[#C17B8A]"
              >
                删
              </button>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={startCreate}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-[16px] bg-gradient-to-br from-[#F6C1CC] to-[#FFCFD0] py-3 text-[13px] font-semibold text-white shadow-[0px_2px_8px_rgba(246,193,204,0.15)]"
      >
        <span className="text-[16px]">＋</span>
        新增菜品
      </button>
    </div>
  );
}
