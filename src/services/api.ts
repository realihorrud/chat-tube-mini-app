import type {
  Conversation,
  ConversationSummary,
  ConversationMessage,
} from "@/types/conversation.ts";
import { retrieveRawInitData } from "@tma.js/sdk";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

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
    public debugInfo?: {
      url: string;
      method: string;
      headers: Record<string, string>;
      body?: string;
      responseBody: string;
    },
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

  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
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
    throw new ApiError(res.status, message, {
      url,
      method,
      headers,
      body,
      responseBody: text,
    });
  }

  return res.json() as Promise<T>;
}

interface FetchConversationResponse {
  data: { id: string; title: string; is_pinned?: boolean }[];
}

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const res = await apiFetch<FetchConversationResponse>("/conversations");
  return res.data.map((c) => ({
    id: c.id,
    title: c.title,
    isPinned: c.is_pinned ?? false,
  }));
}

interface ConversationDetailResponse {
  id: string;
  title: string;
  status: string;
  is_pinned?: boolean;
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

function mapConversationDetail(data: ConversationDetailResponse): Conversation {
  return {
    id: data.id,
    title: data.title,
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
    isPinned: data.is_pinned ?? false,
  };
}

export async function fetchConversation(
  conversationId: string,
): Promise<Conversation> {
  const data = await apiFetch<ConversationDetailResponse>(
    `/conversations/${conversationId}`,
  );
  return mapConversationDetail(data);
}

export async function deleteConversation(
  conversationId: string,
): Promise<void> {
  const initData = getInitData();
  const url = `${API_BASE}/conversations/${conversationId}`;
  const headers: Record<string, string> = { Authorization: `tma ${initData}` };
  const res = await fetch(url, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text, {
      url,
      method: "DELETE",
      headers,
      responseBody: text,
    });
  }
}

export async function renameConversation(
  conversationId: string,
  title: string,
): Promise<ConversationDetailResponse> {
  const raw = await apiFetch<
    ConversationDetailResponse | { data: ConversationDetailResponse }
  >(`/conversations/${conversationId}/rename`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
  return "data" in raw &&
    raw.data &&
    typeof raw.data === "object" &&
    "id" in raw.data
    ? raw.data
    : (raw as ConversationDetailResponse);
}

export async function pinConversation(
  conversationId: string,
): Promise<{ is_pinned: boolean }> {
  const raw = await apiFetch<
    { is_pinned: boolean } | { data: { is_pinned: boolean } }
  >(`/conversations/${conversationId}/pin`, {
    method: "POST",
  });
  return "data" in raw &&
    raw.data &&
    typeof raw.data === "object" &&
    "is_pinned" in raw.data
    ? raw.data
    : (raw as { is_pinned: boolean });
}

export async function shareConversation(
  conversationId: string,
): Promise<string> {
  const raw = await apiFetch<{ url: string } | { data: { url: string } }>(
    `/conversations/${conversationId}/share`,
    {
      method: "POST",
    },
  );
  const result =
    "data" in raw && raw.data && typeof raw.data === "object" && "url" in raw.data
      ? raw.data
      : (raw as { url: string });
  return result.url;
}

export async function fetchSharedConversation(
  conversationId: string,
  signature: string,
): Promise<Conversation> {
  const data = await apiFetch<ConversationDetailResponse>(
    `/conversations/${conversationId}/shared?signature=${encodeURIComponent(signature)}`,
  );
  return mapConversationDetail(data);
}

export async function sendMessageStream(
  conversationId: string,
  content: string,
  onChunk: (accumulated: string) => void,
  signal?: AbortSignal,
): Promise<ConversationMessage> {
  const initData = getInitData();

  const url = `${API_BASE}/conversations/${conversationId}/messages`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    Authorization: `tma ${initData}`,
  };
  const body = JSON.stringify({ content });

  const res = await fetch(url, {
    method: "POST",
    headers,
    body,
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
    throw new ApiError(res.status, message, {
      url,
      method: "POST",
      headers,
      body,
      responseBody: text,
    });
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
    const data = await apiFetch<ConversationDetailResponse>("/conversations", {
      method: "POST",
      body: JSON.stringify({ youtube_url: url }),
      signal: controller.signal,
    });
    return {
      id: data.id,
      title: data.title,
      videoUrl: data.youtubeVideo?.url ?? url,
      videoTitle: data.youtubeVideo?.title ?? data.title,
      messages: (data.messages ?? []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: new Date(m.created_at).getTime(),
      })),
      isProcessing: data.status === "processing",
      isReady: data.status === "ready",
      createdAt: new Date(data.created_at).getTime(),
      isPinned: data.is_pinned ?? false,
    };
  } finally {
    clearTimeout(timeout);
  }
}
