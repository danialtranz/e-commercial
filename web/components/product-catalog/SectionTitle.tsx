"use client";

import React from "react";

export default function SectionTitle({ title }: { title: string }) {
  return (
    <div className="relative mb-12 flex items-center justify-center">
      <div className="absolute h-px w-full bg-organic/20" />
      <div className="relative rounded-full bg-organic px-8 py-2.5 text-sm font-bold tracking-[0.2em] text-white uppercase shadow-md">
        {title}
      </div>
    </div>
  );
}
