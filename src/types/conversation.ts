export interface ConversationMessage {
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
  messages: ConversationMessage[];
  isProcessing: boolean;
  isReady: boolean;
  createdAt: number;
}

export interface ConversationSummary {
  id: string;
  title: string;
}
