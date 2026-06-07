"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function MetaLabel({
  icon: Icon,
  label,
  className,
}: {
  icon: LucideIcon;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-500",
        className
      )}
    >
      <Icon className="size-3.5 shrink-0 text-organic" aria-hidden />
      {label}
    </span>
  );
}

export function MetaChip({
  icon,
  label,
  children,
  className,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1.5 rounded-xl border border-gray-100 bg-gray-50/90 px-3 py-2.5",
        className
      )}
    >
      <MetaLabel icon={icon} label={label} />
      <div className="text-sm font-medium text-gray-800">{children}</div>
    </div>
  );
}
