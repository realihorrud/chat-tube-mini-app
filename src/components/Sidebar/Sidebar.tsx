import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useChat } from "@/store/ConversationContext.tsx";

interface ContextMenuProps {
  conversationId: string;
  conversationTitle: string;
  x: number;
  y: number;
  onClose: () => void;
  onDelete: (conversationId: string) => void;
  onRename: (conversationId: string, title: string) => Promise<void>;
  onPin: (conversationId: string) => Promise<void>;
  onShare: (conversationId: string) => Promise<string>;
}

function ContextMenu({ conversationId, conversationTitle, x, y, onClose, onDelete, onRename, onPin, onShare }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(conversationTitle);

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

  const handlePin = async () => {
    await onPin(conversationId);
    onClose();
  };

  const handleRenameSubmit = async () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== conversationTitle) {
      await onRename(conversationId, trimmed);
    }
    onClose();
  };

  const handleShare = async () => {
    const url = await onShare(conversationId);
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
    onClose();
  };

  return createPortal(
    <div
      ref={ref}
      className="fixed z-9999 max-w-min py-1.5 rounded-xl bg-tg-secondary-bg border border-white/10 shadow-xl shadow-black/20 animate-[fade-in_0.12s_ease-out]"
      style={{ top: clampedY, left: clampedX }}
    >
      {renaming ? (
        <div className="px-3 py-2 flex flex-col gap-2">
          <input
            className="px-2.5 py-1.5 rounded-lg border border-white/20 bg-tg-bg text-tg-text text-[13px] outline-none w-[180px]"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleRenameSubmit(); }}
            autoFocus
          />
          <div className="flex gap-1.5">
            <button
              className="flex-1 text-center px-2 py-1.5 text-[12px] bg-transparent border border-white/15 rounded-lg cursor-pointer text-tg-hint hover:bg-white/10 transition-colors"
              onClick={() => setRenaming(false)}
            >
              Cancel
            </button>
            <button
              className="flex-1 text-center px-2 py-1.5 text-[12px] bg-tg-button border-none rounded-lg cursor-pointer text-tg-button-text font-medium transition-opacity hover:opacity-85"
              onClick={() => void handleRenameSubmit()}
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <>
          <button
            className="min-w-max w-full text-left px-3.5 py-2 text-[13px] bg-transparent border-none cursor-pointer transition-colors text-tg-text hover:bg-white/10"
            onClick={() => void handlePin()}
          >
            📌  Pin
          </button>
          <button
            className="min-w-max w-full text-left px-3.5 py-2 text-[13px] bg-transparent border-none cursor-pointer transition-colors text-tg-text hover:bg-white/10"
            onClick={() => setRenaming(true)}
          >
            ✏️  Rename
          </button>
          <button
            className="min-w-max w-full text-left px-3.5 py-2 text-[13px] bg-transparent border-none cursor-pointer transition-colors text-tg-text hover:bg-white/10"
            onClick={() => void handleShare()}
          >
            🔗  Share
          </button>
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
                  onDelete(conversationId);
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
        </>
      )}
    </div>,
    document.body,
  );
}

export function Sidebar() {
  const {
    conversationSummaries,
    activeConversationId,
    isSidebarOpen,
    selectConversation,
    deleteConversation,
    renameConversation,
    pinConversation,
    shareConversation,
    clearActiveChat,
    setSidebarOpen,
  } = useChat();

  const [menu, setMenu] = useState<{
    conversationId: string;
    conversationTitle: string;
    x: number;
    y: number;
  } | null>(null);

  const handleContextMenu = (
    e: React.MouseEvent | React.TouchEvent,
    conversationId: string,
    conversationTitle: string,
  ) => {
    e.preventDefault();
    if (menu?.conversationId === conversationId) {
      setMenu(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = Math.min(clientX, rect.right - 170);
    const y = clientY;
    setMenu({ conversationId, conversationTitle, x, y });
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
          {[...conversationSummaries]
            .sort((a, b) => Number(b.isPinned ?? false) - Number(a.isPinned ?? false))
            .map((conversation) => (
            <div
              key={conversation.id}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors mb-0.5 ${
                conversation.id === activeConversationId
                  ? "bg-white/[0.18]"
                  : "hover:bg-white/10"
              } group`}
              onClick={() => selectConversation(conversation.id)}
              onContextMenu={(e) => handleContextMenu(e, conversation.id, conversation.title)}
            >
              {conversation.isPinned && (
                <span className="text-xs shrink-0">📌</span>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm text-tg-text truncate">
                  {conversation.title}
                </div>
              </div>
              <button
                data-menu-trigger
                className="bg-transparent border-none text-tg-hint text-base cursor-pointer p-1 rounded hover:bg-white/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenu(e, conversation.id, conversation.title);
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
          key={menu.conversationId}
          conversationId={menu.conversationId}
          conversationTitle={menu.conversationTitle}
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          onDelete={deleteConversation}
          onRename={renameConversation}
          onPin={pinConversation}
          onShare={shareConversation}
        />
      )}
    </>
  );
}
