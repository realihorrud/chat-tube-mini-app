import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useChat } from "@/store/ConversationContext.tsx";
import { ConversationView } from "@/components/ConversationView/ConversationView.tsx";
import * as api from "@/services/api";

export function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const { activeConversation, setActiveConversation } = useChat();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    if (activeConversation?.id === id) return;

    setLoading(true);
    setError(null);
    api
      .fetchConversation(id)
      .then(setActiveConversation)
      .catch((err) => {
        console.error("Failed to load conversation:", err);
        setError("Something went wrong. Please try again later.");
      })
      .finally(() => setLoading(false));
  }, [id, activeConversation?.id, setActiveConversation]);

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

  if (!activeConversation) return null;

  return <ConversationView />;
}
