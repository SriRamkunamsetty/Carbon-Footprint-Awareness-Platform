"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getScoreRating } from "@/lib/carbon/score";

interface ProgressRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabels?: boolean;
}

export function ProgressRing({
  score,
  size = 180,
  strokeWidth = 14,
  showLabels = true,
}: ProgressRingProps) {
  const [progress, setProgress] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    // Small delay to trigger initial loading animation
    const timer = setTimeout(() => setProgress(score), 200);
    return () => clearTimeout(timer);
  }, [score]);

  const rating = getScoreRating(score);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glow behind the ring */}
        <div
          className="absolute inset-2 -z-10 rounded-full blur-xl opacity-20 transition-all duration-1000"
          style={{ backgroundColor: rating.color }}
        />

        <svg width={size} height={size} className="transform -rotate-90">
          {/* Base Background Track Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="rgba(255,255,255,0.03)"
            strokeWidth={strokeWidth}
          />
          {/* Progress Indicator Circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={rating.color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            strokeLinecap="round"
          />
        </svg>

        {/* Central Label Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-4xl font-bold font-mono text-white tracking-tight"
          >
            {score}
          </motion.span>
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-0.5">
            Carbon Rating
          </span>
        </div>
      </div>

      {showLabels && (
        <div className="mt-4 text-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${rating.bgClass}`}>
            {rating.label}
          </span>
        </div>
      )}
    </div>
  );
}
