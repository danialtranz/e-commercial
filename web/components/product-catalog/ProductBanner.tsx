"use client";

import React from "react";
import { motion } from "framer-motion";

export default function ProductBanner() {
  return (
    <div className="flex h-[400px] flex-1 overflow-hidden rounded border border-gray-100 bg-white shadow-sm">
      {/* Left Image Section */}
      <div className="group relative w-1/2">
        <img
          src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80"
          alt="Fresh Vegetables"
          className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
      </div>

      {/* Right Text Section */}
      <div className="relative flex w-1/2 flex-col items-center justify-center bg-white p-12 text-center">
        {/* Decorative Leaves */}
        <div className="absolute top-4 right-4 rotate-12 text-organic/10">
          <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8.13,20C11.07,20 13.85,18.84 15.91,16.78C18.97,13.72 20.13,9.54 20.13,5.29L20.13,2H16.84C12.59,2 8.41,3.16 5.35,6.22C3.29,8.28 2.13,11.06 2.13,14C2.13,14.49 2.26,14.99 2.43,15.47L0.13,16.42L0.79,18.31C5.96,16.23 12.13,14.13 14.13,5.13C14.13,5.13 17,8 17,8Z" />
          </svg>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mb-6"
        >
          <span className="block text-4xl font-bold italic tracking-tighter text-organic">
            Organicmart
          </span>
          <span className="text-[12px] font-medium uppercase tracking-[0.3em] text-gray-400">
            Natural Foods
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-4 text-4xl leading-tight font-black text-gray-900"
        >
          ORGANIC AND <br />
          <span className="text-organic">HEALTHY FOOD</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mb-8 max-w-[300px] text-sm leading-relaxed text-gray-500"
        >
          Cung cấp các sản phẩm hữu cơ đạt chuẩn quốc tế, bảo vệ sức khỏe gia
          đình Việt mỗi ngày.
        </motion.p>

        <motion.button
          type="button"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="rounded-full bg-organic px-8 py-3 text-sm font-bold text-white shadow-lg transition-colors hover:bg-organic-dark"
        >
          MUA NGAY
        </motion.button>
      </div>
    </div>
  );
}
