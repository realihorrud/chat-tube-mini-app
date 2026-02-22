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
  ConversationMessage,
} from "@/types/conversation.ts";
import * as api from "@/services/api";

interface ConversationContextType {
  conversations: Conversation[];
  conversationSummaries: ConversationSummary[];
  activeConversationId: string | null;
  activeConversation: Conversation | null;
  isSidebarOpen: boolean;
  createConversation: (videoUrl: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  setActiveConversation: (conversation: Conversation) => void;
  selectConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  renameConversation: (conversationId: string, title: string) => Promise<void>;
  pinConversation: (conversationId: string) => Promise<void>;
  shareConversation: (conversationId: string) => Promise<string>;
  clearActiveChat: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

const ConversationContext = createContext<ConversationContextType | null>(null);

export function ChatProvider({ children }: PropsWithChildren) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationSummaries, setConversationSummaries] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    api.fetchConversations().then(setConversationSummaries).catch(console.error);
  }, []);

  const activeConversation = conversations.find((c) => c.id === activeConversationId) ?? null;

  const updateConversation = useCallback(
    (conversationId: string, updater: (conversation: Conversation) => Conversation) => {
      setConversations((prev) => prev.map((c) => (c.id === conversationId ? updater(c) : c)));
    },
    [],
  );

  const createConversation = useCallback(
    async (videoUrl: string) => {
      const conversation = await api.submitVideo(videoUrl);
      setConversations((prev) => [conversation, ...prev]);
      setConversationSummaries((prev) => [
        { id: conversation.id, title: conversation.title },
        ...prev,
      ]);
      setActiveConversationId(conversation.id);
      setSidebarOpen(false);
      navigate(`/c/${conversation.id}`);
    },
    [navigate],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!activeConversationId) return;

      const userMsg: ConversationMessage = {
        id: `msg_${Date.now()}`,
        role: "user",
        content,
        timestamp: Date.now(),
      };

      const streamingMsgId = `msg_stream_${Date.now()}`;
      const streamingMsg: ConversationMessage = {
        id: streamingMsgId,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
        isStreaming: true,
      };

      updateConversation(activeConversationId, (c) => ({
        ...c,
        messages: [...c.messages, userMsg, streamingMsg],
      }));

      const conversationId = activeConversationId;

      const finalMsg = await api.sendMessageStream(
        conversationId,
        content,
        (accumulated) => {
          updateConversation(conversationId, (c) => ({
            ...c,
            messages: c.messages.map((m) =>
              m.id === streamingMsgId ? { ...m, content: accumulated } : m,
            ),
          }));
        },
      );

      updateConversation(conversationId, (c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.id === streamingMsgId ? { ...finalMsg, isStreaming: false } : m,
        ),
      }));
    },
    [activeConversationId, updateConversation],
  );

  const setActiveConversation = useCallback((conversation: Conversation) => {
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === conversation.id);
      return exists
        ? prev.map((c) => (c.id === conversation.id ? conversation : c))
        : [conversation, ...prev];
    });
    setActiveConversationId(conversation.id);
  }, []);

  const selectConversation = useCallback(
    (conversationId: string) => {
      setSidebarOpen(false);
      navigate(`/c/${conversationId}`);
    },
    [navigate],
  );

  const deleteConversation = useCallback(
    (conversationId: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      setConversationSummaries((prev) => prev.filter((c) => c.id !== conversationId));
      setActiveConversationId((prev) => {
        if (prev === conversationId) {
          navigate("/");
          return null;
        }
        return prev;
      });
      api.deleteConversation(conversationId).catch(console.error);
    },
    [navigate],
  );

  const renameConversation = useCallback(
    async (conversationId: string, title: string) => {
      await api.renameConversation(conversationId, title);
      setConversationSummaries((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, title } : c)),
      );
      updateConversation(conversationId, (c) => ({ ...c, title }));
    },
    [updateConversation],
  );

  const pinConversation = useCallback(
    async (conversationId: string) => {
      const data = await api.pinConversation(conversationId);
      const isPinned = data.is_pinned;
      setConversationSummaries((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, isPinned } : c)),
      );
      updateConversation(conversationId, (c) => ({ ...c, isPinned }));
    },
    [updateConversation],
  );

  const shareConversation = useCallback(
    async (conversationId: string) => {
      return api.shareConversation(conversationId);
    },
    [],
  );

  const clearActiveChat = useCallback(() => {
    setActiveConversationId(null);
    navigate("/");
  }, [navigate]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  return (
    <ConversationContext.Provider
      value={{
        conversations,
        conversationSummaries,
        activeConversationId,
        activeConversation,
        isSidebarOpen,
        createConversation,
        sendMessage,
        setActiveConversation,
        selectConversation,
        deleteConversation,
        renameConversation,
        pinConversation,
        shareConversation,
        clearActiveChat,
        toggleSidebar,
        setSidebarOpen,
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useChat(): ConversationContextType {
  const ctx = useContext(ConversationContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
