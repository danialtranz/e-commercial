"use client";

import React from "react";
import Link from "next/link";
import type { NavLinkItem } from "./navConfig";

type Props = {
  navLinks: NavLinkItem[];
  isActive: (href: string) => boolean;
};

const DesktopNav: React.FC<Props> = ({ navLinks, isActive }) => {
  return (
    <div className="hidden items-center gap-1 text-sm font-medium text-slate-600 md:flex">
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`flex items-center gap-2 rounded-full px-4 py-2 transition-all duration-200 ${
            isActive(link.href)
              ? "bg-sky-100 text-sky-600"
              : "text-slate-600 hover:bg-slate-100 hover:text-sky-600"
          }`}
        >
          <i className={`fas ${link.icon} text-[11px]`} />
          <span>{link.label}</span>
        </Link>
      ))}
    </div>
  );
};

export default DesktopNav;
