"use client";
import React, { useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X } from "lucide-react";
import { Button } from "@/components/agentConfig/button";

interface CourseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  avatarUrl?: string | null;
  onGoLearn: () => void;
}

export const CourseDetailModal: React.FC<CourseDetailModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  avatarUrl,
  onGoLearn,
}) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/80 animate-in fade-in-0"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pt-20">
        <div
          className="relative w-full max-w-2xl bg-white rounded-lg shadow-lg flex flex-col animate-in zoom-in-95 fade-in-0"
          onClick={(e) => e.stopPropagation()}
          style={{ height: "calc(100vh - 6rem)", maxHeight: "80vh" }}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-20 rounded-sm opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 bg-white/90 hover:bg-white p-1.5 shadow-sm"
          >
            <X className="h-4 w-4 text-slate-700" />
            <span className="sr-only">Close</span>
          </button>

          {/* Header với ảnh - luôn hiển thị, không scroll */}
          <div className="shrink-0 px-6 pt-6 pb-4 bg-white">
            <div className="overflow-hidden rounded-xl bg-slate-100">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={title}
                  className="h-48 w-full object-cover"
                />
              ) : (
                <div className="flex h-32 w-full items-center justify-center bg-gradient-to-r from-sky-500 to-indigo-500 text-5xl text-white">
                  <i className="fas fa-graduation-cap" />
                </div>
              )}
            </div>
          </div>

          {/* Tên khóa học - luôn hiển thị, không scroll */}
          <div className="shrink-0 px-6 pb-2 bg-white pt-3">
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-2">
                <i className="fas fa-book text-sky-600" />
                Tên khóa học
              </label>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {title}
              </h2>
            </div>
          </div>

          {/* Divider */}
          <div className="shrink-0 px-6 bg-white">
            <div className="border-t border-slate-200" />
          </div>

          {/* Mô tả khóa học - phần scroll, chiếm không gian còn lại */}
          <div
            className="flex-1 overflow-y-auto px-6 py-4 bg-white"
            style={{
              minHeight: 0,
              maxHeight: "100%",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div className="space-y-2">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 flex items-center gap-2 shrink-0">
                <i className="fas fa-align-left text-sky-600" />
                Mô tả khóa học
              </label>
              <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-sky-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-strong:font-semibold prose-code:text-sky-700 prose-code:bg-sky-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-slate-100 prose-pre:border prose-pre:border-slate-200 prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-sky-600 prose-blockquote:border-l-4 prose-blockquote:border-sky-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600 custom-scrollbar">
                {description ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {description}
                  </ReactMarkdown>
                ) : (
                  <p className="text-slate-400 italic">Chưa có mô tả</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer - luôn hiển thị ở dưới, không scroll */}
          <div className="shrink-0 px-6 py-4 pt-4 border-t border-slate-200 bg-white flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              <i className="fas fa-times mr-2" />
              Đóng
            </Button>
            <Button
              size="sm"
              className="bg-sky-600 text-xs text-white hover:bg-sky-700"
              onClick={onGoLearn}
            >
              <i className="fas fa-graduation-cap mr-2" />
              Vào học
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
