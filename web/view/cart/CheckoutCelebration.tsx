"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

const COLORS = [
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
];

type Particle = {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  delay: number;
  rotate: number;
  distance: number;
  angle: number;
};

function buildParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const distance = 80 + Math.random() * 120;
    return {
      id: i,
      x: 50 + Math.cos(angle) * (distance / 4),
      y: 42 + Math.sin(angle) * (distance / 5),
      size: 6 + Math.random() * 8,
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 0.35,
      rotate: Math.random() * 360,
      distance,
      angle,
    };
  });
}

export default function CheckoutCelebration() {
  const burst = useMemo(() => buildParticles(40), []);
  const sparks = useMemo(() => buildParticles(24), []);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[20px]"
      aria-hidden
    >
      {burst.map((p) => (
        <motion.span
          key={`b-${p.id}`}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size * 0.55,
            backgroundColor: p.color,
            boxShadow: `0 0 10px ${p.color}88`,
          }}
          initial={{ opacity: 0, scale: 0, rotate: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 1, 0.3],
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            rotate: p.rotate + 180,
          }}
          transition={{
            duration: 1.4,
            delay: p.delay,
            ease: "easeOut",
          }}
        />
      ))}

      {sparks.map((p) => (
        <motion.span
          key={`s-${p.id}`}
          className="absolute rounded-full"
          style={{
            left: "50%",
            top: "38%",
            width: p.size * 0.5,
            height: p.size * 0.5,
            backgroundColor: p.color,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 2, 0],
            x: Math.cos(p.angle) * (p.distance * 0.7),
            y: Math.sin(p.angle) * (p.distance * 0.7),
          }}
          transition={{
            duration: 1.1,
            delay: 0.15 + p.delay * 0.5,
            ease: "easeOut",
          }}
        />
      ))}

      <motion.div
        className="absolute left-1/2 top-[32%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-300/30 blur-2xl"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 2.2, 2.8], opacity: [0, 0.7, 0] }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      />
      <motion.div
        className="absolute left-1/2 top-[32%] -translate-x-1/2 text-4xl"
        initial={{ scale: 0, opacity: 0, rotate: -20 }}
        animate={{ scale: [0, 1.3, 1], opacity: [0, 1, 1], rotate: 0 }}
        transition={{ duration: 0.55, ease: "backOut" }}
      >
        🎉
      </motion.div>
    </div>
  );
}
