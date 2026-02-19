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

const STUB_RESPONSES = [
  'This video covers several interesting topics. The main theme revolves around creative content and storytelling techniques used by the creator.',
  'Based on my analysis, the key points discussed in this video are:\n\n1. Introduction to the topic\n2. Deep dive into the main concept\n3. Practical examples and demonstrations\n4. Summary and takeaways',
  'The video is approximately 10 minutes long and features the creator discussing their perspective on this subject. They provide several examples and reference other works in the field.',
  'That\'s a great question! The creator mentions this around the 3-minute mark. They explain that the approach works because it combines simplicity with effectiveness.',
  'The video doesn\'t directly address that point, but based on the context provided, I can infer that the creator would likely agree with that interpretation.',
];

export async function sendMessage(
  _chatId: string,
  _content: string,
  onChunk: (chunk: string) => void,
): Promise<void> {
  const response = STUB_RESPONSES[Math.floor(Math.random() * STUB_RESPONSES.length)];
  const words = response.split(' ');

  for (const word of words) {
    await new Promise((r) => setTimeout(r, 40 + Math.random() * 60));
    onChunk(word + ' ');
  }
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
