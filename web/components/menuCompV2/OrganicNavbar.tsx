"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavLinkItem } from "./navConfig";

type OrganicNavbarProps = {
  navLinks: NavLinkItem[];
  isActive: (href: string) => boolean;
};

export function OrganicNavbar({ navLinks, isActive }: OrganicNavbarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (q) {
      void router.push(`/product?search=${encodeURIComponent(q)}`);
    } else {
      void router.push("/product");
    }
  };

  return (
    <nav className="bg-organic text-white h-12 sticky top-0 z-40 hidden md:block">
      <div className="max-w-[1200px] mx-auto h-full px-4 flex justify-between items-center">
        <ul className="flex items-center h-full min-w-0">
          {navLinks.map((link) => (
            <li key={link.href} className="h-full">
              <Link
                href={link.href}
                className={cn(
                  "flex items-center h-full px-4 lg:px-6 text-[13px] font-bold hover:bg-organic-dark transition-colors whitespace-nowrap",
                  isActive(link.href) && "bg-organic-dark shadow-inner"
                )}
              >
                {link.label.toUpperCase()}
              </Link>
            </li>
          ))}
        </ul>

        {/* <form
          onSubmit={handleSearchSubmit}
          className="flex-1 max-w-xs pr-4 shrink-0"
        >
          <div className="relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full bg-white text-gray-800 text-xs py-2 pl-4 pr-10 rounded-full focus:outline-none shadow-sm transition-all"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-organic"
              aria-label="Tìm kiếm"
            >
              <Search size={16} />
            </button>
          </div>
        </form> */}
      </div>
    </nav>
  );
}
