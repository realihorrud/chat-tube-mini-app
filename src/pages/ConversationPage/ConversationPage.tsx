import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useChat } from "@/store/ConversationContext.tsx";
import { ConversationView } from "@/components/ConversationView/ConversationView.tsx";
import * as api from "@/services/api";

export function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const { activeChat, setActiveChat } = useChat();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    if (activeChat?.id === id) return;

    setLoading(true);
    setError(null);
    api
      .fetchChat(id)
      .then(setActiveChat)
      .catch((err) =>
        setError(err instanceof Error ? err.message : String(err)),
      )
      .finally(() => setLoading(false));
  }, [id, activeChat?.id, setActiveChat]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-tg-hint text-sm">
        Loading chat...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full text-[#ff4444] text-sm">
        {error}
      </div>
    );
  }

  if (!activeChat) return null;

  return <ConversationView />;
}
