import { useState, type FormEvent } from "react";
import { useChat } from "@/store/ConversationContext.tsx";

const EXAMPLES = [
  {
    label: "Heavy Is The Crown (Live) - Linkin Park",
    url: "https://www.youtube.com/watch?v=9L_ZdETLgzQ",
  },
  {
    label:
      "Pavel Durov: Telegram, Freedom, Censorship, Money, Power & Human Nature | Lex Fridman Podcast",
    url: "https://www.youtube.com/watch?v=qjPH9njnaVU",
  },
  {
    label: "Jason Fried: Build for Yourself, Keep Costs Low and Stay Small",
    url: "https://youtu.be/BdDCtMA1gSw?si=klPHrDIdGoqEJlqm",
  },
  {
    label: "30 Celebrities Fight For $1,000,000!",
    url: "https://www.youtube.com/watch?v=QJI0an6irrA",
  },
  {
    label:
      "After watching this, your brain will not be the same | Lara Boyd | TEDxVancouver",
    url: "https://youtu.be/LNHBMFCzznE?si=jKEP5T9bqczwpFnc",
  },
];

const EXAMPLES_SHUFFLED = EXAMPLES.map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);

export function WelcomeScreen() {
  const { createConversation } = useChat();
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (videoUrl: string) => {
    if (!videoUrl.trim() || isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      await createConversation(videoUrl.trim());
      setUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleSubmit(url);
  };

  return (
    <div className="flex flex-col items-center justify-start h-full px-6 text-center">
      <div className="text-[56px] mb-4">🎬</div>
      <h1 className="text-2xl font-bold text-tg-text m-0 mb-2">ChatTube</h1>
      <p className="text-sm text-tg-hint m-0 mb-8 max-w-[320px] leading-relaxed">
        Paste a YouTube video link and ask any questions about its content. AI
        will analyze the video and answer your questions.
      </p>

      <form className="w-full max-w-[480px] flex gap-2" onSubmit={onFormSubmit}>
        <textarea
          className="flex-1 min-w-0 px-4 py-3.5 rounded-xl border border-white/30 bg-tg-secondary-bg text-tg-text text-[15px] outline-none transition-colors placeholder:text-tg-hint focus:border-tg-button resize-none overflow-x-auto overflow-y-hidden whitespace-nowrap"
          placeholder="Paste YouTube URL"
          value={url}
          onChange={(e) => setUrl(e.target.value.replace(/\n/g, ''))}
          disabled={isLoading}
          rows={1}
        />
        <button
          className="px-6 py-3.5 rounded-xl border-none bg-tg-button text-tg-button-text text-[15px] font-semibold cursor-pointer transition-opacity whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed hover:not-disabled:opacity-85"
          type="submit"
          disabled={!url.trim() || isLoading}
        >
          {isLoading ? "..." : "Go"}
        </button>
      </form>

      {error && (
        <p className="mt-2 text-xs text-[#ff4444] max-w-[480px]">{error}</p>
      )}

      <p className="mt-4 text-xs text-tg-hint">
        Supports youtube.com links, youtu.be short links
      </p>

      <div className="mt-8 flex flex-col gap-2 w-full max-w-[480px]">
        <div className="text-xs text-tg-hint uppercase tracking-wider mb-1">
          Try an example
        </div>
        {EXAMPLES_SHUFFLED.map((ex) => (
            <button
              key={ex.url}
              className="flex items-center gap-2.5 px-4 py-3 rounded-[10px] border border-white/20 bg-transparent text-tg-text text-[13px] cursor-pointer text-left transition-colors hover:bg-white/[0.08]"
              onClick={() => {
                setUrl(ex.url);
                void handleSubmit(ex.url);
              }}
              disabled={isLoading}
            >
              <span className="text-base shrink-0">▶</span>
              {ex.label}
            </button>
          ))}
      </div>
    </div>
  );
}
