import type { Chat, Message } from '@/types/chat';
import { retrieveRawInitData } from '@tma.js/sdk';

const API_BASE = '/api';

function getInitData(): string {
  try {
    return retrieveRawInitData() ?? '';
  } catch {
    return '';
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const initData = getInitData();
  const method = options.method ?? 'GET';
  const isBodyMethod = method === 'POST' || method === 'PUT' || method === 'PATCH';

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `tma ${initData}`,
    ...(options.headers as Record<string, string>),
  };

  let body: string | undefined;
  if (isBodyMethod) {
    const parsed = options.body ? JSON.parse(options.body as string) as Record<string, unknown> : {};
    body = JSON.stringify({ ...parsed });
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    let message: string;
    try {
      const json = JSON.parse(text) as { message?: string; error?: string };
      message = json.message ?? json.error ?? text;
    } catch {
      message = text;
    }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

interface CreateChatResponse {
  id: string;
  youtube_url: string;
  title: string;
  messages: Message[];
  is_processing: boolean;
  is_ready: boolean;
  created_at: number;
}

export async function submitVideo(url: string): Promise<Chat> {
  const data = await apiFetch<CreateChatResponse>('/chats', {
    method: 'POST',
    body: JSON.stringify({ youtube_url: url }),
  });

  return {
    id: String(data.id),
    videoUrl: data.youtube_url,
    videoTitle: data.title,
    messages: data.messages ?? [],
    isProcessing: data.is_processing ?? true,
    isReady: data.is_ready ?? false,
    createdAt: data.created_at ?? Date.now(),
  };
}

export async function processVideo(chatId: string): Promise<Message> {
  void chatId;
  await new Promise((r) => setTimeout(r, 2500));

  return {
    id: `msg_${Date.now()}`,
    role: 'assistant',
    content: 'Your video has been processed successfully! Ask me anything about it.',
    timestamp: Date.now(),
  };
}

export async function sendMessageStream(
  chatId: string,
  content: string,
  onChunk: (chunk: string) => void,
  signal?: AbortSignal,
): Promise<Message> {
  const initData = getInitData();

  const res = await fetch(`${API_BASE}/chats/${chatId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream',
      'Authorization': `tma ${initData}`,
    },
    body: JSON.stringify({ content }),
    signal,
  });

  if (!res.ok) {
    const text = await res.text();
    let message: string;
    try {
      const json = JSON.parse(text) as { message?: string; error?: string };
      message = json.message ?? json.error ?? text;
    } catch {
      message = text;
    }
    throw new ApiError(res.status, message);
  }

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';
  let messageId = '';
  let createdAt = Date.now();

  let buffer = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop()!;

    for (const line of lines) {
      if (!line.startsWith('data: ') && !line.startsWith('data:')) continue;
      const data = line.slice(line.indexOf(':') + 1).trimStart();
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data) as {
          id?: string;
          delta?: string;
          content?: string;
          created_at?: number;
        };
        if (parsed.id) messageId = String(parsed.id);
        if (parsed.created_at) createdAt = parsed.created_at;
        const delta = parsed.delta ?? parsed.content ?? '';
        if (delta) {
          fullContent += delta;
          onChunk(fullContent);
        }
      } catch {
        // Not JSON — treat as raw text delta
        fullContent += data;
        onChunk(fullContent);
      }
    }
  }

  return {
    id: messageId || `msg_${Date.now()}`,
    role: 'assistant',
    content: fullContent,
    timestamp: createdAt,
  };
}

export const STUB_CHATS: Chat[] = [
  {
    id: 'stub_1',
    videoUrl: 'https://youtube.com/watch?v=dQw4w9WgXcQ',
    videoTitle: 'Rick Astley - Never Gonna Give You Up',
    messages: [
      {
        id: 'stub_msg_1',
        role: 'assistant',
        content: 'Your video has been processed successfully! Ask me anything about it.',
        timestamp: Date.now() - 3600000,
      },
      {
        id: 'stub_msg_2',
        role: 'user',
        content: 'What is this video about?',
        timestamp: Date.now() - 3500000,
      },
      {
        id: 'stub_msg_3',
        role: 'assistant',
        content: 'This is the iconic music video for "Never Gonna Give You Up" by Rick Astley, released in 1987. It became one of the most famous internet memes known as "Rickrolling".',
        timestamp: Date.now() - 3400000,
      },
    ],
    isProcessing: false,
    isReady: true,
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'stub_2',
    videoUrl: 'https://youtube.com/watch?v=jNQXAC9IVRw',
    videoTitle: 'Me at the zoo',
    messages: [
      {
        id: 'stub_msg_4',
        role: 'assistant',
        content: 'Your video has been processed successfully! Ask me anything about it.',
        timestamp: Date.now() - 7200000,
      },
    ],
    isProcessing: false,
    isReady: true,
    createdAt: Date.now() - 7200000,
  },
];
