/**
 * @module Skeleton
 * @description Skeleton loading components for content placeholder animations.
 * Provides visual feedback during data loading states, improving perceived performance.
 * Supports reduced motion preferences.
 */
"use client";

import React, { memo } from "react";

interface SkeletonProps {
  /** CSS class name for customization */
  className?: string;
  /** Accessible label for screen readers */
  "aria-label"?: string;
  /** Custom inline styles */
  style?: React.CSSProperties;
}

/**
 * Base skeleton element with pulse animation.
 * Respects prefers-reduced-motion.
 */
export const Skeleton = memo(function Skeleton({
  className = "",
  "aria-label": ariaLabel = "Loading content",
  ...props
}: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label={ariaLabel}
      className={`motion-safe:animate-pulse rounded-xl bg-zinc-800/50 ${className}`}
      style={props.style}
    />
  );
});

/**
 * Skeleton card matching the GlassCard dimensions.
 * Used as a placeholder while dashboard cards load.
 */
export const SkeletonCard = memo(function SkeletonCard() {
  return (
    <div
      role="status"
      aria-label="Loading card"
      className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" aria-label="Loading title" />
        <Skeleton className="h-8 w-8 rounded-lg" aria-label="Loading icon" />
      </div>
      <Skeleton className="h-8 w-32" aria-label="Loading value" />
      <Skeleton className="h-3 w-20" aria-label="Loading label" />
    </div>
  );
});

/**
 * Skeleton chart matching the analytics chart dimensions.
 * Used as a placeholder while chart data loads.
 */
export const SkeletonChart = memo(function SkeletonChart() {
  return (
    <div
      role="status"
      aria-label="Loading chart"
      className="rounded-2xl border border-white/[0.06] bg-zinc-900/40 p-6 space-y-4"
    >
      <Skeleton className="h-4 w-32" aria-label="Loading chart title" />
      <div className="flex items-end gap-2 h-40">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t-md"
            style={{ height: `${30 + Math.random() * 70}%` } as React.CSSProperties}
            aria-label={`Loading bar ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
});

/**
 * Skeleton row for list/table loading states.
 */
export const SkeletonRow = memo(function SkeletonRow() {
  return (
    <div
      role="status"
      aria-label="Loading row"
      className="flex items-center gap-4 p-4 rounded-xl border border-white/[0.04] bg-zinc-900/20"
    >
      <Skeleton className="h-10 w-10 rounded-full" aria-label="Loading avatar" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-32" aria-label="Loading name" />
        <Skeleton className="h-3 w-20" aria-label="Loading detail" />
      </div>
      <Skeleton className="h-6 w-16" aria-label="Loading value" />
    </div>
  );
});

/**
 * Full dashboard skeleton with multiple cards and charts.
 */
export const DashboardSkeleton = memo(function DashboardSkeleton() {
  return (
    <div aria-label="Loading dashboard" role="status" className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonChart />
        <SkeletonChart />
      </div>
      {/* Activity list */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
      <span className="sr-only">Loading dashboard data, please wait...</span>
    </div>
  );
});
