"use client";

import React, { useEffect, useRef, useState } from "react";
import { useChatCompletion, useChatHistory } from "@/hooks/user/useUserHook";
import {
  AUTH_SESSION_UPDATED_EVENT,
  readAuthSessionFromStorage,
} from "@/lib/authSession";

type ShopChatWidgetProps = {
  shopId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export const ShopChatWidget: React.FC<ShopChatWidgetProps> = ({
  shopId,
  isOpen,
  onOpenChange,
}) => {
  const [draft, setDraft] = useState("");
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(
    null
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const syncAuth = () => {
      setIsLoggedIn(readAuthSessionFromStorage().isLoggedIn);
    };
    syncAuth();
    window.addEventListener(AUTH_SESSION_UPDATED_EVENT, syncAuth);
    return () =>
      window.removeEventListener(AUTH_SESSION_UPDATED_EVENT, syncAuth);
  }, []);

  const {
    history,
    loading: historyLoading,
    refetch,
  } = useChatHistory(isLoggedIn ? shopId : undefined);

  const {
    text: replyText,
    loading: sending,
    error: sendError,
    send,
    reset,
  } = useChatCompletion();

  const messages = [...(history?.messages ?? [])].sort(
    (a, b) => a.order - b.order
  );

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length, replyText, sending, isOpen]);

  const handleSend = async () => {
    const q = draft.trim();
    if (!q || sending) return;
    setDraft("");
    setPendingUserMessage(q);
    await send({ shopId, userQuestion: q });
    if (isLoggedIn) {
      await refetch();
    }
    reset();
    setPendingUserMessage(null);
  };

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {isOpen && (
        <div
          className="pointer-events-auto flex max-h-[min(520px,70vh)] w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-2xl border border-emerald-200/80 bg-white shadow-2xl shadow-emerald-900/10"
          role="dialog"
          aria-label="Chat với cửa hàng"
        >
          <div className="flex items-center justify-between border-b border-emerald-100 bg-linear-to-r from-emerald-600 to-teal-600 px-4 py-3 text-white">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Chat với shop</p>
              {history?.conversationId && (
                <p className="truncate text-[10px] text-emerald-100/90">
                  ID: {history.conversationId}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
              aria-label="Thu gọn chat"
            >
              <i className="fas fa-chevron-down text-sm" aria-hidden />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="min-h-[200px] flex-1 space-y-3 overflow-y-auto bg-slate-50/80 px-3 py-3"
          >
            {historyLoading && messages.length === 0 && (
              <p className="text-center text-xs text-slate-500">
                <i className="fas fa-spinner fa-spin mr-1" />
                Đang tải lịch sử...
              </p>
            )}

            {messages.map((m) => (
              <div key={m.id} className="space-y-1.5">
                <div className="flex justify-end">
                  <div className="max-w-[90%] rounded-2xl rounded-br-md bg-emerald-600 px-3 py-2 text-xs text-white">
                    {m.userQuestion}
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[90%] whitespace-pre-wrap rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-700 shadow-sm">
                    {m.botResponse}
                  </div>
                </div>
              </div>
            ))}

            {pendingUserMessage && (
              <div className="space-y-1.5">
                <div className="flex justify-end">
                  <div className="max-w-[90%] rounded-2xl rounded-br-md bg-emerald-600 px-3 py-2 text-xs text-white">
                    {pendingUserMessage}
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="max-w-[90%] wrap-break-word whitespace-pre-wrap rounded-2xl rounded-bl-md border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-800 shadow-sm">
                    {sending && !replyText ? (
                      <span className="text-slate-400">
                        <i className="fas fa-spinner fa-spin mr-1" />
                        Đang trả lời...
                      </span>
                    ) : (
                      replyText
                    )}
                  </div>
                </div>
              </div>
            )}

            {sendError && (
              <p className="rounded-lg bg-red-50 px-2 py-1.5 text-[11px] text-red-700">
                {sendError.message}
              </p>
            )}
          </div>

          <div className="border-t border-emerald-100 bg-white p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void handleSend();
                  }
                }}
                placeholder="Nhập câu hỏi..."
                disabled={sending}
                className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-60"
              />
              <button
                type="button"
                disabled={sending || !draft.trim()}
                onClick={() => void handleSend()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                aria-label="Gửi"
              >
                {sending ? (
                  <i className="fas fa-spinner fa-spin text-sm" aria-hidden />
                ) : (
                  <i className="fas fa-paper-plane text-sm" aria-hidden />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => onOpenChange(!isOpen)}
        className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-xl text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 hover:shadow-xl"
        aria-label={isOpen ? "Đóng chat" : "Mở chat với shop"}
        aria-expanded={isOpen}
      >
        <i className={`fas ${isOpen ? "fa-times" : "fa-comments"}`} />
      </button>
    </div>
  );
};
