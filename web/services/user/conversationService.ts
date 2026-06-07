import api from "@/apis/endpoint";
import type { ApiEnvelope } from "@/interface/shop";
import request from "@/utils/nextRequest";
import { getToken } from "@/utils/tokenManager";

function isOk(code: number) {
  return code === 0 || code === 200;
}

export interface ConversationAskBody {
  userQuestion: string;
  shopId: string;
}

export interface ConversationMessage {
  id: string;
  userQuestion: string;
  botResponse: string;
  order: number;
  status?: string;
}

export interface ConversationHistoryPayload {
  conversationId: string;
  messages: ConversationMessage[];
}

export type ConversationHistoryData = ConversationHistoryPayload | null;

/**
 * GET /v1/user/conversation/history?shopId=...
 */
export async function fetchConversationHistory(
  shopId: string
): Promise<ConversationHistoryPayload | null> {
  const res = await request.get<ApiEnvelope<ConversationHistoryPayload>>(
    api.userConversationHistory,
    {
      params: { shopId },
    }
  );

  const body = res.data;
  if (!body || !isOk(body.code)) return null;
  return body.data ?? null;
}

export type StreamConversationAskOptions = {
  shopId: string;
  userQuestion: string;
  signal?: AbortSignal;
  /** Nhận từng phần nội dung (UTF-8) từ server stream. */
  onChunk: (chunk: string) => void;
  /**
   * raw: gửi nguyên byte đã decode (res.write từng chunk).
   * sse: parse dòng `data: ...` (SSE) rồi gọi onChunk với payload.
   */
  streamFormat?: "raw" | "sse";
};

function buildAskUrl(shopId: string): string {
  const base = api.userConversationAsk;
  const q = new URLSearchParams({ shopId });
  return `${base}?${q.toString()}`;
}

/**
 * POST /v1/user/conversation/ask?shopId=...
 * Body JSON: { userQuestion, shopId }
 * Response: chunked stream (không dùng axios JSON — dùng fetch + ReadableStream).
 */
export async function streamConversationAsk(
  options: StreamConversationAskOptions
): Promise<void> {
  const {
    shopId,
    userQuestion,
    signal,
    onChunk,
    streamFormat = "raw",
  } = options;

  const token = getToken();
  const url = buildAskUrl(shopId);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      userQuestion,
      shopId,
    } satisfies ConversationAskBody),
    signal,
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(errText || `Request failed: ${res.status}`);
  }

  const reader = res.body?.getReader();
  if (!reader) {
    throw new Error("Response has no readable body");
  }

  const decoder = new TextDecoder();

  if (streamFormat === "sse") {
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      for (const block of parts) {
        for (const line of block.split("\n")) {
          const trimmed = line.trimEnd();
          if (trimmed.startsWith("data:")) {
            const payload = trimmed.slice(5).trimStart();
            if (payload && payload !== "[DONE]") onChunk(payload);
          }
        }
      }
    }
    if (buffer.trim()) {
      for (const line of buffer.split("\n")) {
        const trimmed = line.trimEnd();
        if (trimmed.startsWith("data:")) {
          const payload = trimmed.slice(5).trimStart();
          if (payload && payload !== "[DONE]") onChunk(payload);
        }
      }
    }
    return;
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value && value.length > 0) {
      onChunk(decoder.decode(value, { stream: true }));
    }
  }
}
