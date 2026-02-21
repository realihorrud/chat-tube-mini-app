export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface Conversation {
  id: string;
  videoUrl: string;
  videoTitle: string;
  messages: Message[];
  isProcessing: boolean;
  isReady: boolean;
  createdAt: number;
}

export interface ConversationSummary {
  id: string;
  title: string;
}
