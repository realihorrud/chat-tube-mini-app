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
    ...(options.headers as Record<string, string>),
  };

  let body: string | undefined;
  if (isBodyMethod) {
    const parsed = options.body ? JSON.parse(options.body as string) as Record<string, unknown> : {};
    body = JSON.stringify({ ...parsed, initData });
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


interface SendMessageResponse {
  id: string;
  role: 'assistant';
  content: string;
  created_at: number;
}

export async function sendMessage(
  chatId: string,
  content: string,
): Promise<Message> {
  const data = await apiFetch<SendMessageResponse>(`/chats/${chatId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });

  return {
    id: String(data.id),
    role: 'assistant',
    content: data.content,
    timestamp: data.created_at ?? Date.now(),
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
