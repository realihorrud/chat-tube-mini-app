import {
  type FC,
  useState,
  useRef,
  useEffect,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { useChat } from '@/store/ChatContext';
import type { Message } from '@/types/chat';

const MessageBubble: FC<{ message: Message }> = ({ message }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  }, [message.content]);

  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div
      ref={ref}
      className={`flex gap-2.5 max-w-[85%] animate-[message-in_0.2s_ease-out] ${
        isUser ? 'self-end flex-row-reverse' : 'self-start'
      }`}
    >
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-base shrink-0 ${
          isUser ? 'bg-tg-button' : 'bg-white/20'
        }`}
      >
        {isUser ? '👤' : message.role === 'assistant' ? '🤖' : 'ℹ️'}
      </div>
      <div
        className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
          isUser
            ? 'bg-tg-button text-tg-button-text rounded-br-sm'
            : isSystem
              ? 'bg-transparent text-tg-hint italic text-[13px] px-3.5 py-1.5'
              : 'bg-tg-secondary-bg text-tg-text rounded-bl-sm'
        }`}
      >
        {message.content}
        {message.isStreaming && (
          <span className="inline-block w-1.5 h-4 bg-tg-text ml-0.5 align-text-bottom animate-[blink_0.8s_infinite]" />
        )}
      </div>
    </div>
  );
};

export const ChatView: FC = () => {
  const { activeChat, sendMessage } = useChat();
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!activeChat) return null;

  const isStreaming = activeChat.messages.some((m) => m.isStreaming);
  const canSend = input.trim() && !isSending && !isStreaming && activeChat.isReady;

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;
    const msg = input.trim();
    setInput('');
    setIsSending(true);
    try {
      await sendMessage(msg);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit();
    }
  };

  const handleInput = (value: string) => {
    setInput(value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/15 bg-tg-bg">
        <span className="text-lg shrink-0">▶</span>
        <div className="flex-1 min-w-0">
          <div className="text-[15px] font-semibold text-tg-text truncate">
            {activeChat.videoTitle}
          </div>
          <div className="text-xs text-tg-hint mt-px">
            {activeChat.isProcessing
              ? 'Processing video...'
              : activeChat.isReady
                ? 'Ready — ask anything!'
                : 'Waiting...'}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {activeChat.messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {activeChat.isProcessing && (
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
      <form
        className="flex items-end gap-2 px-4 pt-3 pb-[calc(2.5rem+env(safe-area-inset-bottom,24px))] focus-within:pb-3 transition-[padding] duration-200 border-t border-white/15 bg-tg-bg"
        onSubmit={(e) => void handleSubmit(e)}
      >
        <textarea
          ref={textareaRef}
          className="flex-1 px-4 py-2.5 rounded-[20px] border border-white/30 bg-tg-secondary-bg text-tg-text text-sm outline-none resize-none max-h-[120px] min-h-[20px] leading-5 font-[inherit] transition-colors placeholder:text-tg-hint focus:border-tg-button"
          placeholder={activeChat.isReady ? 'Ask about this video...' : 'Waiting for video processing...'}
          value={input}
          onChange={(e) => handleInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!activeChat.isReady || isSending}
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
};
