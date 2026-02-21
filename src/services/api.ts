import type {
  Conversation,
  ConversationSummary,
  ConversationMessage,
} from "@/types/conversation.ts";
import { retrieveRawInitData } from "@tma.js/sdk";

const API_BASE = "/api";

function getInitData(): string {
  try {
    return retrieveRawInitData() ?? "";
  } catch {
    return "";
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const initData = getInitData();
  const method = options.method ?? "GET";
  const isBodyMethod =
    method === "POST" || method === "PUT" || method === "PATCH";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `tma ${initData}`,
    ...(options.headers as Record<string, string>),
  };

  let body: string | undefined;
  if (isBodyMethod) {
    const parsed = options.body
      ? (JSON.parse(options.body as string) as Record<string, unknown>)
      : {};
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

interface FetchConversationResponse {
  data: { id: string; title: string }[];
}

export async function fetchChats(): Promise<ConversationSummary[]> {
  const res = await apiFetch<FetchConversationResponse>("/chats");
  return res.data.map((c) => ({
    id: c.id,
    title: c.title,
  }));
}

interface ConversationDetailResponse {
  id: string;
  title: string;
  status: string;
  created_at: string;
  youtubeVideo: {
    url: string;
    title: string;
  };
  messages: {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    created_at: string;
  }[];
}

export async function fetchChat(chatId: string): Promise<Conversation> {
  const data = await apiFetch<ConversationDetailResponse>(`/chats/${chatId}`);
  return {
    id: data.id,
    videoUrl: data.youtubeVideo.url,
    videoTitle: data.youtubeVideo.title,
    messages: data.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: new Date(m.created_at).getTime(),
    })),
    isProcessing: data.status === "processing",
    isReady: data.status === "ready",
    createdAt: new Date(data.created_at).getTime(),
  };
}

export async function deleteChat(chatId: string): Promise<void> {
  const initData = getInitData();
  const res = await fetch(`${API_BASE}/chats/${chatId}`, {
    method: "DELETE",
    headers: { Authorization: `tma ${initData}` },
  });
  if (!res.ok) {
    throw new ApiError(res.status, await res.text());
  }
}

export async function sendMessageStream(
  chatId: string,
  content: string,
  onChunk: (accumulated: string) => void,
  signal?: AbortSignal,
): Promise<ConversationMessage> {
  const initData = getInitData();

  const res = await fetch(`${API_BASE}/chats/${chatId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      Authorization: `tma ${initData}`,
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
  let accumulated = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop()!;

    for (const line of lines) {
      if (!line.startsWith("data: ") && !line.startsWith("data:")) continue;
      const raw = line.slice(line.indexOf(":") + 1).trimStart();

      let parsed: {
        type?: string;
        content?: string;
        full_response?: string;
        message?: string;
      };
      try {
        parsed = JSON.parse(raw) as typeof parsed;
      } catch {
        continue;
      }

      if (parsed.type === "content" && parsed.content) {
        accumulated += parsed.content;
        onChunk(accumulated);
      } else if (parsed.type === "done") {
        if (parsed.full_response) {
          accumulated = parsed.full_response;
          onChunk(accumulated);
        }
      } else if (parsed.type === "error") {
        throw new ApiError(500, parsed.message ?? "Stream error");
      }
    }
  }

  return {
    id: `msg_${Date.now()}`,
    role: "assistant",
    content: accumulated,
    timestamp: Date.now(),
  };
}

export async function submitVideo(url: string): Promise<Conversation> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 240_000);

  try {
    const data = await apiFetch<ConversationDetailResponse>("/chats", {
      method: "POST",
      body: JSON.stringify({ youtube_url: url }),
      signal: controller.signal,
    });
    return {
      id: data.id,
      videoUrl: data.youtubeVideo?.url ?? url,
      videoTitle: data.title,
      messages: (data.messages ?? []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at).getTime(),
      })),
      isProcessing: data.status === "processing",
      isReady: data.status === "ready",
      createdAt: new Date(data.created_at).getTime(),
    };
  } finally {
    clearTimeout(timeout);
  }
}
