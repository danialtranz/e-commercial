"use client";

import Link from "next/link";
import React from "react";

type Props = {
  title: string;
  children: React.ReactNode;
};

const StaticPageView: React.FC<Props> = ({ title, children }) => {
  return (
    <div className="min-h-screen bg-white px-4 py-12 md:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-emerald-700 hover:underline">
          ← Trang chủ
        </Link>
        <h1 className="mt-6 text-3xl font-bold text-slate-900">{title}</h1>
        <div className="prose prose-slate mt-8 max-w-none text-sm leading-relaxed text-slate-700">
          {children}
        </div>
      </div>
    </div>
  );
};

export default StaticPageView;
