"use client";

import React from "react";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";

interface MathTextProps {
  text: string;
  className?: string;
}

/**
 * Component để render text có chứa LaTeX
 * Hỗ trợ cả inline math ($...$) và block math ($$...$$)
 */
const MathText: React.FC<MathTextProps> = ({ text, className = "" }) => {
  if (!text) return null;

  // Pattern để tìm LaTeX: $$...$$ (block) hoặc $...$ (inline)
  const blockMathRegex = /\$\$([\s\S]*?)\$\$/g;
  const inlineMathRegex = /(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g;

  // Tách text thành các phần: text thường và LaTeX
  const parts: Array<{ type: "text" | "block" | "inline"; content: string }> =
    [];
  let lastIndex = 0;
  let match;

  // Tìm block math trước ($$...$$)
  const blockMatches: Array<{ start: number; end: number; content: string }> =
    [];
  while ((match = blockMathRegex.exec(text)) !== null) {
    blockMatches.push({
      start: match.index,
      end: match.index + match[0].length,
      content: match[1],
    });
  }

  // Tìm inline math ($...$)
  const inlineMatches: Array<{ start: number; end: number; content: string }> =
    [];
  while ((match = inlineMathRegex.exec(text)) !== null) {
    // Kiểm tra xem có nằm trong block math không
    const isInBlock = blockMatches.some(
      (bm) => match!.index >= bm.start && match!.index < bm.end
    );
    if (!isInBlock) {
      inlineMatches.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[1],
      });
    }
  }

  // Merge và sort tất cả matches
  const allMatches = [
    ...blockMatches.map((m) => ({ ...m, type: "block" as const })),
    ...inlineMatches.map((m) => ({ ...m, type: "inline" as const })),
  ].sort((a, b) => a.start - b.start);

  // Tạo parts
  allMatches.forEach((match) => {
    // Thêm text trước match
    if (match.start > lastIndex) {
      const textBefore = text.substring(lastIndex, match.start);
      if (textBefore) {
        parts.push({ type: "text", content: textBefore });
      }
    }

    // Thêm math
    parts.push({ type: match.type, content: match.content });

    lastIndex = match.end;
  });

  // Thêm text còn lại
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push({ type: "text", content: remainingText });
    }
  }

  // Nếu không có LaTeX, chỉ render text thường
  if (parts.length === 0 || (parts.length === 1 && parts[0].type === "text")) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === "text") {
          return <span key={index}>{part.content}</span>;
        } else if (part.type === "block") {
          return <BlockMath key={index} math={part.content.trim()} />;
        } else {
          return <InlineMath key={index} math={part.content.trim()} />;
        }
      })}
    </span>
  );
};

export default MathText;
