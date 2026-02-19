import type { FC } from 'react';
import { useChat } from '@/store/ChatContext';

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export const Sidebar: FC = () => {
  const {
    chats,
    activeChatId,
    isSidebarOpen,
    selectChat,
    deleteChat,
    clearActiveChat,
    setSidebarOpen,
  } = useChat();

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
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/15">
          <h2 className="text-base font-semibold text-tg-text m-0">Chats</h2>
          <button
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-white/25 bg-transparent text-tg-text text-[13px] cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => { clearActiveChat(); setSidebarOpen(false); }}
          >
            <span className="text-base">+</span>
            New
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors mb-0.5 ${
                chat.id === activeChatId ? 'bg-white/[0.18]' : 'hover:bg-white/10'
              } group`}
              onClick={() => selectChat(chat.id)}
            >
              <span className="text-lg shrink-0">▶</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-tg-text truncate">{chat.videoTitle}</div>
                <div className="text-[11px] text-tg-hint mt-0.5">{formatTime(chat.createdAt)}</div>
              </div>
              <button
                className="bg-transparent border-none text-tg-hint text-base cursor-pointer p-1 rounded opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteChat(chat.id);
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
};
