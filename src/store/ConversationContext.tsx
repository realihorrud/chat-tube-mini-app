import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type PropsWithChildren,
} from "react";
import { useNavigate } from "react-router-dom";
import type {
  Conversation,
  ConversationSummary,
  Message,
} from "@/types/conversation.ts";
import * as api from "@/services/api";

interface ConversationContextTye {
  chats: Conversation[];
  chatSummaries: ConversationSummary[];
  activeChatId: string | null;
  activeChat: Conversation | null;
  isSidebarOpen: boolean;
  createChat: (videoUrl: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  setActiveChat: (chat: Conversation) => void;
  selectChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  clearActiveChat: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

const ConversationContext = createContext<ConversationContextTye | null>(null);

export function ChatProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const [chats, setChats] = useState<Conversation[]>([]);
  const [chatSummaries, setChatSummaries] = useState<ConversationSummary[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api.fetchChats().then(setChatSummaries).catch(console.error);
  }, []);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  const updateChat = useCallback(
    (chatId: string, updater: (chat: Conversation) => Conversation) => {
      setChats((prev) => prev.map((c) => (c.id === chatId ? updater(c) : c)));
    },
    [],
  );

  const createChat = useCallback(
    async (videoUrl: string) => {
      const chat = await api.submitVideo(videoUrl);
      const readyMsg: Message = {
        id: `msg_ready_${chat.id}`,
        role: "assistant",
        content:
          "Your video has been processed successfully! Ask me anything about it.",
        timestamp: Date.now(),
      };
      const chatWithMsg = { ...chat, messages: [...chat.messages, readyMsg] };
      setChats((prev) => [chatWithMsg, ...prev]);
      setChatSummaries((prev) => [
        { id: chat.id, title: chat.videoTitle },
        ...prev,
      ]);
      setActiveChatId(chat.id);
      setSidebarOpen(false);
      navigate(`/chat/${chat.id}`);
    },
    [navigate],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!activeChatId) return;

      const userMsg: Message = {
        id: `msg_${Date.now()}`,
        role: "user",
        content,
        timestamp: Date.now(),
      };

      const streamingMsgId = `msg_stream_${Date.now()}`;
      const streamingMsg: Message = {
        id: streamingMsgId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
      };

      updateChat(activeChatId, (c) => ({
        ...c,
        messages: [...c.messages, userMsg, streamingMsg],
      }));

      const chatId = activeChatId;

      const finalMsg = await api.sendMessageStream(
        chatId,
        content,
        (accumulated) => {
          updateChat(chatId, (c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === streamingMsgId ? { ...m, content: accumulated } : m,
            ),
          }));
        },
      );

      updateChat(chatId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === streamingMsgId ? { ...finalMsg, isStreaming: false } : m,
        ),
      }));
    },
    [activeChatId, updateChat],
  );

  const setActiveChat = useCallback((chat: Conversation) => {
    setChats((prev) => {
      const exists = prev.some((c) => c.id === chat.id);
      return exists
        ? prev.map((c) => (c.id === chat.id ? chat : c))
        : [chat, ...prev];
    });
    setActiveChatId(chat.id);
  }, []);

  const selectChat = useCallback(
    (chatId: string) => {
      setSidebarOpen(false);
      navigate(`/chat/${chatId}`);
    },
    [navigate],
  );

  const deleteChat = useCallback(
    (chatId: string) => {
      setChats((prev) => prev.filter((c) => c.id !== chatId));
      setChatSummaries((prev) => prev.filter((c) => c.id !== chatId));
      setActiveChatId((prev) => {
        if (prev === chatId) {
          navigate("/");
          return null;
        }
        return prev;
      });
      api.deleteChat(chatId).catch(console.error);
    },
    [navigate],
  );

  const clearActiveChat = useCallback(() => {
    setActiveChatId(null);
    navigate("/");
  }, [navigate]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <ConversationContext.Provider
      value={{
        chats,
        chatSummaries,
        activeChatId,
        activeChat,
        isSidebarOpen,
        createChat,
        sendMessage,
        setActiveChat,
        selectChat,
        deleteChat,
        clearActiveChat,
        toggleSidebar,
        setSidebarOpen,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useChat(): ConversationContextTye {
  const ctx = useContext(ConversationContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
