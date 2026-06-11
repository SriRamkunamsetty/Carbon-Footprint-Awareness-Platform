"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glowColor?: string; // e.g. "from-emerald-500/10 to-teal-500/10"
  hoverGlow?: boolean;
  animate?: boolean;
  delay?: number;
}

export function GlassCard({
  children,
  className,
  glowColor = "from-emerald-500/5 to-blue-500/5",
  hoverGlow = true,
  animate = true,
  delay = 0,
  ...props
}: GlassCardProps) {
  const CardContent = (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/[0.08] bg-black/40 p-6 backdrop-blur-xl transition-all duration-300",
        hoverGlow && "hover:border-white/[0.15] hover:shadow-[0_0_30px_0_rgba(16,185,129,0.03)]",
        className
      )}
      {...props}
    >
      {/* Background glow gradient */}
      <div
        className={cn(
          "absolute -inset-px -z-10 bg-gradient-to-br opacity-50 transition-opacity duration-300",
          glowColor
        )}
      />
      
      {/* Glossy shine element */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />

      {children}
    </div>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      >
        {CardContent}
      </motion.div>
    );
  }

  return CardContent;
}
