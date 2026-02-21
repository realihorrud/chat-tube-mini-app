import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useChat } from "@/store/ConversationContext.tsx";

interface ContextMenuProps {
  chatId: string;
  x: number;
  y: number;
  onClose: () => void;
  onDelete: (chatId: string) => void;
}

function ContextMenu({ chatId, x, y, onClose, onDelete }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (
        ref.current &&
        !ref.current.contains(target) &&
        !target.closest("[data-menu-trigger]")
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [onClose]);

  // Clamp position so menu stays within viewport
  const menuWidth = 170;
  const menuHeight = 220;
  const clampedX = Math.min(x, window.innerWidth - menuWidth) + 140;
  const clampedY = Math.min(y, window.innerHeight - menuHeight) + 20;

  const actions = [
    { label: "📌  Pin Chat", onClick: () => onClose() },
    { label: "✏️  Rename", onClick: () => onClose() },
    { label: "🔗  Share", onClick: () => onClose() },
  ];

  return createPortal(
    <div
      ref={ref}
      className="fixed z-9999 max-w-min py-1.5 rounded-xl bg-tg-secondary-bg border border-white/10 shadow-xl shadow-black/20 animate-[fade-in_0.12s_ease-out]"
      style={{ top: clampedY, left: clampedX }}
    >
      {actions.map((a) => (
        <button
          key={a.label}
          className="min-w-max w-full text-left px-3.5 py-2 text-[13px] bg-transparent border-none cursor-pointer transition-colors text-tg-text hover:bg-white/10"
          onClick={a.onClick}
        >
          {a.label}
        </button>
      ))}
      {confirmDelete ? (
        <div className="flex items-center border-t border-white/10 mt-1 pt-1">
          <button
            className="flex-1 text-center px-3 py-2 text-[13px] bg-transparent border-none cursor-pointer text-tg-hint hover:bg-white/10 transition-colors"
            onClick={() => setConfirmDelete(false)}
          >
            Cancel
          </button>
          <button
            className="flex-1 text-center px-3 py-2 text-[13px] bg-transparent border-none cursor-pointer text-red-400 font-medium hover:bg-red-500/15 transition-colors"
            onClick={() => {
              onDelete(chatId);
              onClose();
            }}
          >
            Confirm
          </button>
        </div>
      ) : (
        <button
          className="min-w-max w-full text-left px-3.5 py-2 text-[13px] bg-transparent border-none cursor-pointer transition-colors text-red-400 hover:bg-red-500/15"
          onClick={() => setConfirmDelete(true)}
        >
          🗑 Delete
        </button>
      )}
    </div>,
    document.body,
  );
}

export function Sidebar() {
  const {
    chatSummaries,
    activeChatId,
    isSidebarOpen,
    selectChat,
    deleteChat,
    clearActiveChat,
    setSidebarOpen,
  } = useChat();

  const [menu, setMenu] = useState<{
    chatId: string;
    x: number;
    y: number;
  } | null>(null);

  const handleContextMenu = (
    e: React.MouseEvent | React.TouchEvent,
    chatId: string,
  ) => {
    e.preventDefault();
    if (menu?.chatId === chatId) {
      setMenu(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = Math.min(clientX, rect.right - 170);
    const y = clientY;
    setMenu({ chatId, x, y });
  };

  return (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[99]"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`w-[280px] h-full flex flex-col bg-tg-bg border-r border-white/15 fixed left-0 top-0 z-[100] transition-transform duration-250 ease-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-3 border-b border-white/15">
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-none bg-tg-button text-tg-button-text text-sm font-medium cursor-pointer transition-opacity hover:opacity-85 active:scale-[0.98]"
            onClick={() => {
              clearActiveChat();
              setSidebarOpen(false);
            }}
          >
            <span className="text-lg leading-none">＋</span>
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {chatSummaries.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors mb-0.5 ${
                chat.id === activeChatId
                  ? "bg-white/[0.18]"
                  : "hover:bg-white/10"
              } group`}
              onClick={() => selectChat(chat.id)}
              onContextMenu={(e) => handleContextMenu(e, chat.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-tg-text truncate">
                  {chat.title}
                </div>
              </div>
              <button
                data-menu-trigger
                className="bg-transparent border-none text-tg-hint text-base cursor-pointer p-1 rounded hover:bg-white/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenu(e, chat.id);
                }}
              >
                ⋮
              </button>
            </div>
          ))}
        </div>
      </aside>
      {menu && (
        <ContextMenu
          key={menu.chatId}
          chatId={menu.chatId}
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          onDelete={deleteChat}
        />
      )}
    </>
  );
}
