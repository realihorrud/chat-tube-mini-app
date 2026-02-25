import {
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useChat } from "@/store/ConversationContext.tsx";
import type { ConversationMessage } from "@/types/conversation.ts";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      className="mt-1 self-start bg-transparent border-none cursor-pointer text-tg-hint text-xs p-0.5 rounded hover:text-tg-text transition-colors"
      onClick={() => void handleCopy()}
      title="Copy to clipboard"
    >
      {copied ? "✓ Copied" : "📋"}
    </button>
  );
}

function MessageBubble({ message }: { message: ConversationMessage }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  }, [message.content]);

  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  const isAssistant = message.role === "assistant";

  return (
    <div
      ref={ref}
      className={`flex gap-2.5 max-w-[85%] animate-[message-in_0.2s_ease-out] ${
        isUser ? "self-end flex-row-reverse" : "self-start"
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 ${
          isUser ? "bg-tg-button" : "bg-white/20"
        }`}
      >
        {isUser ? "👤" : isAssistant ? "🤖" : "ℹ️"}
      </div>
      <div className="flex flex-col">
        <div
          className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
            isUser
              ? "bg-tg-button text-tg-button-text rounded-br-sm whitespace-pre-wrap"
              : isSystem
                ? "bg-transparent text-tg-hint italic text-[13px] px-3.5 py-1.5 whitespace-pre-wrap"
                : "bg-tg-secondary-bg text-tg-text rounded-bl-sm"
          }`}
        >
          {isAssistant ? (
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => <p className="my-1 first:mt-0 last:mb-0">{children}</p>,
                ul: ({ children }) => <ul className="my-1 pl-5 list-disc">{children}</ul>,
                ol: ({ children }) => <ol className="my-1 pl-5 list-decimal">{children}</ol>,
                li: ({ children }) => <li className="my-0.5">{children}</li>,
                strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                code: ({ children, className }) => {
                  const isBlock = className?.includes("language-");
                  return isBlock ? (
                    <code className="block my-2 p-2.5 rounded-lg bg-black/20 text-[13px] overflow-x-auto whitespace-pre">{children}</code>
                  ) : (
                    <code className="px-1 py-0.5 rounded bg-black/20 text-[13px]">{children}</code>
                  );
                },
                pre: ({ children }) => <pre className="my-2 overflow-x-auto">{children}</pre>,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-tg-link underline">{children}</a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-1 pl-3 border-l-2 border-white/30 text-tg-hint">{children}</blockquote>
                ),
                h1: ({ children }) => <h1 className="text-base font-bold my-2 first:mt-0">{children}</h1>,
                h2: ({ children }) => <h2 className="text-[15px] font-bold my-1.5 first:mt-0">{children}</h2>,
                h3: ({ children }) => <h3 className="text-sm font-bold my-1 first:mt-0">{children}</h3>,
              }}
            >
              {message.content}
            </Markdown>
          ) : (
            message.content
          )}
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-tg-text ml-0.5 align-text-bottom animate-[blink_0.8s_infinite]" />
          )}
        </div>
        {isAssistant && !message.isStreaming && (
          <CopyButton text={message.content} />
        )}
      </div>
    </div>
  );
}

export function ConversationView() {
  const { activeConversation, sendMessage } = useChat();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!activeConversation) return null;

  const isStreaming = activeConversation.messages.some((m) => m.isStreaming);
  const canSend =
    input.trim() && !isSending && !isStreaming && activeConversation.isReady;

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;
    const msg = input.trim();
    setInput("");
    setIsSending(true);
    setError(null);
    try {
      await sendMessage(msg);
    } catch (err: Error | unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const handleInput = (value: string) => {
    setInput(value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {activeConversation.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {activeConversation.isProcessing && (
          <div className="flex items-center gap-2.5 px-4 py-3 text-tg-hint text-[13px]">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-tg-hint animate-[dot-pulse_1.2s_infinite]" />
              <span className="w-1.5 h-1.5 rounded-full bg-tg-hint animate-[dot-pulse_1.2s_infinite_0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-tg-hint animate-[dot-pulse_1.2s_infinite_0.4s]" />
            </div>
            Analyzing video...
          </div>
        )}
      </div>

      {/* Input */}
      {error && (
        <div className="px-4 py-2 text-xs text-[#ff4444] text-center">
          {error}
        </div>
      )}
      <form
        className="flex items-end gap-2 px-4 pt-3 pb-[calc(2.5rem+env(safe-area-inset-bottom,24px))] focus-within:pb-3 transition-[padding] duration-200 border-t border-white/15 bg-tg-bg"
        onSubmit={(e) => void handleSubmit(e)}
      >
        <textarea
          ref={textareaRef}
          className="flex-1 px-4 py-2.5 rounded-[20px] border border-white/30 bg-tg-secondary-bg text-tg-text text-sm outline-none resize-none max-h-[120px] min-h-[20px] leading-5 font-[inherit] transition-colors placeholder:text-tg-hint focus:border-tg-button"
          placeholder={
            activeConversation.isReady
              ? "Ask about this video..."
              : "Waiting for video processing..."
          }
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!activeConversation.isReady || isSending}
          rows={1}
        />
        <button
          className="w-10 h-10 rounded-full border-none bg-tg-button text-tg-button-text text-lg cursor-pointer flex items-center justify-center transition-opacity shrink-0 disabled:opacity-40 disabled:cursor-not-allowed hover:not-disabled:opacity-85"
          type="submit"
          disabled={!canSend}
        >
          ↑
        </button>
      </form>
    </div>
  );
}
