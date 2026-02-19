import type { FC } from 'react';
import { useChat } from '@/store/ChatContext';
import { Sidebar } from '@/components/Sidebar/Sidebar';
import { ChatView } from '@/components/ChatView/ChatView';
import { WelcomeScreen } from '@/components/WelcomeScreen/WelcomeScreen';

export const ChatLayout: FC = () => {
  const { activeChat, toggleSidebar } = useChat();

  return (
    <div className="flex h-dvh overflow-hidden bg-tg-bg">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <div className="flex items-center px-4 py-2.5 gap-3 bg-tg-bg border-b border-white/15">
          <button
            className="flex items-center justify-center w-9 h-9 rounded-lg border-none bg-transparent text-tg-text text-xl cursor-pointer transition-colors hover:bg-white/10"
            onClick={toggleSidebar}
          >
            ☰
          </button>
          <div className="flex-1 text-base font-semibold text-tg-text truncate">
            {activeChat ? activeChat.videoTitle : 'ChatTube'}
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          {activeChat ? <ChatView /> : <WelcomeScreen />}
        </div>
      </div>
    </div>
  );
};
