import type { Chat, Message } from '@/types/chat';

const FAKE_DELAY = 1200;

let chatIdCounter = 0;
let messageIdCounter = 0;

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${++chatIdCounter}`;
}

function generateMessageId(): string {
  return `msg_${Date.now()}_${++messageIdCounter}`;
}

function extractVideoTitle(url: string): string {
  const titles: Record<string, string> = {
    'dQw4w9WgXcQ': 'Rick Astley - Never Gonna Give You Up',
    'jNQXAC9IVRw': 'Me at the zoo',
    'kJQP7kiw5Fk': 'Luis Fonsi - Despacito ft. Daddy Yankee',
  };

  const match = url.match(/(?:v=|youtu\.be\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  const videoId = match?.[1] ?? url.trim();
  return titles[videoId] ?? `YouTube Video (${videoId.slice(0, 11)})`;
}

export async function submitVideo(url: string): Promise<Chat> {
  await new Promise((r) => setTimeout(r, FAKE_DELAY));

  const id = generateId('chat');
  const title = extractVideoTitle(url);

  return {
    id,
    videoUrl: url,
    videoTitle: title,
    messages: [
      {
        id: generateMessageId(),
        role: 'system',
        content: `Processing video: "${title}"...`,
        timestamp: Date.now(),
      },
    ],
    isProcessing: true,
    isReady: false,
    createdAt: Date.now(),
  };
}

export async function processVideo(chatId: string): Promise<Message> {
  void chatId;
  await new Promise((r) => setTimeout(r, 2500));

  return {
    id: generateMessageId(),
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
