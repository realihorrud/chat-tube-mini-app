export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface Chat {
  id: string;
  videoUrl: string;
  videoTitle: string;
  messages: Message[];
  isProcessing: boolean;
  isReady: boolean;
  createdAt: number;
}
