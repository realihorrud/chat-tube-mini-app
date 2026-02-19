import {
  createContext,
  useContext,
  useState,
  useCallback,
  type PropsWithChildren,
  type FC,
} from 'react';
import type { Chat, Message } from '@/types/chat';
import * as api from '@/services/api';

interface ChatContextType {
  chats: Chat[];
  activeChatId: string | null;
  activeChat: Chat | null;
  isSidebarOpen: boolean;
  createChat: (videoUrl: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  clearActiveChat: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider: FC<PropsWithChildren> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>(api.STUB_CHATS);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  const updateChat = useCallback((chatId: string, updater: (chat: Chat) => Chat) => {
    setChats((prev) => prev.map((c) => (c.id === chatId ? updater(c) : c)));
  }, []);

  const createChat = useCallback(async (videoUrl: string) => {
    const chat = await api.submitVideo(videoUrl);
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
    setSidebarOpen(false);

    const readyMsg = await api.processVideo(chat.id);
    updateChat(chat.id, (c) => ({
      ...c,
      isProcessing: false,
      isReady: true,
      messages: [...c.messages, readyMsg],
    }));
  }, [updateChat]);

  const sendMessage = useCallback(async (content: string) => {
    if (!activeChatId) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    const assistantMsgId = `msg_${Date.now()}_a`;
    const assistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isStreaming: true,
    };

    updateChat(activeChatId, (c) => ({
      ...c,
      messages: [...c.messages, userMsg, assistantMsg],
    }));

    const chatId = activeChatId;
    await api.sendMessage(chatId, content, (chunk) => {
      updateChat(chatId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === assistantMsgId ? { ...m, content: m.content + chunk } : m,
        ),
      }));
    });

    updateChat(chatId, (c) => ({
      ...c,
      messages: c.messages.map((m) =>
        m.id === assistantMsgId ? { ...m, isStreaming: false } : m,
      ),
    }));
  }, [activeChatId, updateChat]);

  const selectChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
    setSidebarOpen(false);
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    setActiveChatId((prev) => (prev === chatId ? null : prev));
  }, []);

  const clearActiveChat = useCallback(() => {
    setActiveChatId(null);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChatId,
        activeChat,
        isSidebarOpen,
        createChat,
        sendMessage,
        selectChat,
        deleteChat,
        clearActiveChat,
        toggleSidebar,
        setSidebarOpen,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export function useChat(): ChatContextType {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
}
