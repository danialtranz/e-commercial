"use client";
import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    maxLength?: number;
    className?: string;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    value,
    onChange,
    placeholder = "Nhập mô tả (hỗ trợ Markdown)...",
    maxLength = 1000,
    className = "",
}) => {
    const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
    const remainingChars = maxLength - value.length;

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Tabs */}
            <div className="flex gap-1 border-b border-slate-200">
                <button
                    type="button"
                    onClick={() => setActiveTab("edit")}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === "edit"
                            ? "border-b-2 border-sky-600 text-sky-600"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <i className="fas fa-edit mr-1.5" />
                    Chỉnh sửa
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("preview")}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === "preview"
                            ? "border-b-2 border-sky-600 text-sky-600"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                >
                    <i className="fas fa-eye mr-1.5" />
                    Xem trước
                </button>
            </div>

            {/* Editor/Preview */}
            {activeTab === "edit" ? (
                <div className="space-y-1">
                    <textarea
                        value={value}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            if (newValue.length <= maxLength) {
                                onChange(newValue);
                            }
                        }}
                        placeholder={placeholder}
                        rows={6}
                        className="custom-textarea w-full rounded-md border border-slate-200 px-3 py-2 text-xs text-slate-800 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                    />
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="flex items-center gap-1">
                            <i className="fas fa-info-circle" />
                            Hỗ trợ Markdown: **bold**, *italic*, `code`, danh sách, links...
                        </span>
                        <span
                            className={`font-medium ${remainingChars < 50
                                    ? "text-orange-600"
                                    : remainingChars < 0
                                        ? "text-red-600"
                                        : ""
                                }`}
                        >
                            {remainingChars >= 0
                                ? `${remainingChars} ký tự còn lại`
                                : `Vượt quá ${Math.abs(remainingChars)} ký tự`}
                        </span>
                    </div>
                </div>
            ) : (
                <div
                    className="overflow-y-auto rounded-md border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800 custom-scrollbar"
                    style={{
                        height: "130px",
                        minHeight: 0,
                        maxHeight: "130px",
                        WebkitOverflowScrolling: "touch",
                    }}
                >
                    {value ? (
                        <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-headings:text-slate-900 prose-p:text-slate-700 prose-p:leading-relaxed prose-a:text-sky-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-slate-900 prose-strong:font-semibold prose-code:text-sky-700 prose-code:bg-sky-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-pre:bg-slate-100 prose-pre:border prose-pre:border-slate-200 prose-ul:list-disc prose-ol:list-decimal prose-li:marker:text-sky-600 prose-blockquote:border-l-4 prose-blockquote:border-sky-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-600">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
                        </div>
                    ) : (
                        <p className="text-slate-400 italic">{placeholder}</p>
                    )}
                </div>
            )}
        </div>
    );
};
