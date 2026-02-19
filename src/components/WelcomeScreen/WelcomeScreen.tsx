import { type FC, useState, type FormEvent } from 'react';
import { useChat } from '@/store/ChatContext';

const EXAMPLES = [
  { label: 'Rick Astley - Never Gonna Give You Up', url: 'https://youtube.com/watch?v=dQw4w9WgXcQ' },
  { label: 'Me at the zoo (First YouTube Video)', url: 'https://youtube.com/watch?v=jNQXAC9IVRw' },
  { label: 'Luis Fonsi - Despacito', url: 'https://youtube.com/watch?v=kJQP7kiw5Fk' },
];

export const WelcomeScreen: FC = () => {
  const { createChat } = useChat();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (videoUrl: string) => {
    if (!videoUrl.trim() || isLoading) return;
    setIsLoading(true);
    try {
      await createChat(videoUrl.trim());
    } finally {
      setIsLoading(false);
      setUrl('');
    }
  };

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    void handleSubmit(url);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <div className="text-[56px] mb-4">🎬</div>
      <h1 className="text-2xl font-bold text-tg-text m-0 mb-2">ChatTube</h1>
      <p className="text-sm text-tg-hint m-0 mb-8 max-w-[320px] leading-relaxed">
        Paste a YouTube video link and ask any questions about its content. AI will analyze
        the video and answer your questions.
      </p>

      <form className="w-full max-w-[480px] flex gap-2" onSubmit={onFormSubmit}>
        <input
          className="flex-1 px-4 py-3.5 rounded-xl border border-white/30 bg-tg-secondary-bg text-tg-text text-[15px] outline-none transition-colors placeholder:text-tg-hint focus:border-tg-button"
          type="text"
          placeholder="Paste YouTube URL or video ID..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={isLoading}
        />
        <button
          className="px-6 py-3.5 rounded-xl border-none bg-tg-button text-tg-button-text text-[15px] font-semibold cursor-pointer transition-opacity whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed hover:not-disabled:opacity-85"
          type="submit"
          disabled={!url.trim() || isLoading}
        >
          {isLoading ? '...' : 'Go'}
        </button>
      </form>

      <p className="mt-4 text-xs text-tg-hint">
        Supports youtube.com links, youtu.be short links, and video IDs
      </p>

      <div className="mt-8 flex flex-col gap-2 w-full max-w-[480px]">
        <div className="text-xs text-tg-hint uppercase tracking-wider mb-1">Try an example</div>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.url}
            className="flex items-center gap-2.5 px-4 py-3 rounded-[10px] border border-white/20 bg-transparent text-tg-text text-[13px] cursor-pointer text-left transition-colors hover:bg-white/[0.08]"
            onClick={() => void handleSubmit(ex.url)}
            disabled={isLoading}
          >
            <span className="text-base shrink-0">▶</span>
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
};
