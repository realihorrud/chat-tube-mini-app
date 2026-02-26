import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import type {
  Conversation,
  ConversationMessage,
} from "@/types/conversation.ts";
import { DebugError } from "@/components/DebugError/DebugError.tsx";
import * as api from "@/services/api";

function SharedMessageBubble({ message }: { message: ConversationMessage }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  return (
    <div
      className={`flex gap-2.5 max-w-[85%] ${
        isUser ? "self-end flex-row-reverse" : "self-start"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 ${
          isUser ? "bg-tg-button" : "bg-white/20"
        }`}
      >
        {isUser ? "👤" : message.role === "assistant" ? "🤖" : "ℹ️"}
      </div>
      <div
        className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? "bg-tg-button text-tg-button-text rounded-br-sm"
            : isSystem
              ? "bg-transparent text-tg-hint italic text-[13px] px-3.5 py-1.5"
              : "bg-tg-secondary-bg text-tg-text rounded-bl-sm"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

export function SharedConversationPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const signature = searchParams.get("signature") ?? "";
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!id || !signature) {
      setError(new Error("Invalid share link"));
      setLoading(false);
      return;
    }

    api
      .fetchSharedConversation(id, signature)
      .then(setConversation)
      .catch((err) => {
        console.error("Failed to load shared conversation:", err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, [id, signature]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-tg-hint text-sm">
        Loading shared conversation...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <DebugError error={error} />
      </div>
    );
  }

  if (!conversation) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center px-4 py-2.5 gap-3 border-b border-white/15">
        <div className="flex-1 text-base font-semibold text-tg-text truncate">
          {conversation.videoTitle}
        </div>
        <span className="text-xs text-tg-hint px-2 py-1 rounded-full bg-white/10">
          Shared · Read only
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {conversation.messages.map((msg) => (
          <SharedMessageBubble key={msg.id} message={msg} />
        ))}
      </div>
    </div>
  );
}
