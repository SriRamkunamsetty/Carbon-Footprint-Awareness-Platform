"use client";

import React, { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCarbonScore, useLeaderboard, useActivities } from "@/hooks";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
import { Suspense } from "react";

const AreaChart = dynamic(() => import("@/components/ui/svg-charts").then((mod) => mod.AreaChart));
const DonutChart = dynamic(() => import("@/components/ui/svg-charts").then((mod) => mod.DonutChart));
const BarChart = dynamic(() => import("@/components/ui/svg-charts").then((mod) => mod.BarChart));
import { 
  TrendingDown, 
  Sparkles, 
  ChevronRight,
  CheckCircle2,
  Calendar,
  Zap,
  Award
} from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { profile } = useAuth();
  
  const { activities, loading: activitiesLoading } = useActivities({ userId: profile?.uid ?? null });

  // Use the new hooks
  const { 
    score: carbonScore, 
    todayCarbon, 
    weeklyCarbon, 
    monthlyCarbon, 
    yearlyProjected, 
    categoryBreakdown, 
    trend
  } = useCarbonScore(activities);

  const { entries: climbers, loading: climbersLoading } = useLeaderboard({ userId: profile?.uid ?? null, topN: 3 });

  const loading = activitiesLoading || climbersLoading;
  const limitGoal = profile?.goal ?? 350;

  // Format category data for DonutChart
  const categoryData = useMemo(() => {
    const getVal = (cat: string) => categoryBreakdown.find((c) => c.category === cat)?.totalCarbon || 0;
    return [
      { name: "Transport", value: Math.round(getVal("transport") * 10) / 10, color: "#3B82F6" },
      { name: "Diet", value: Math.round(getVal("food") * 10) / 10, color: "#10B981" },
      { name: "Utilities", value: Math.round(getVal("electricity") * 10) / 10, color: "#F59E0B" },
      { name: "Shopping", value: Math.round(getVal("shopping") * 10) / 10, color: "#8B5CF6" }
    ].filter(item => item.value > 0);
  }, [categoryBreakdown]);

  // Format weekly trend data for AreaChart
  const weeklyData = useMemo(() => {
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    // Get last 7 days of trend data
    return trend.slice(-7).map(t => {
      const d = new Date(t.date);
      return {
        label: dayNames[d.getDay()],
        value: Math.round(t.carbon * 10) / 10
      };
    });
  }, [trend]);

  // AI Recommendation (Could be fetched from AI API based on user's highest category)
  const aiRecommendation = useMemo(() => {
    const highestCat = [...categoryData].sort((a, b) => b.value - a.value)[0];
    
    if (highestCat?.name === "Transport") {
      return {
        title: "🚌 Try Public Transit",
        description: `Transport is your highest emission source. Taking the bus twice a week could save ~40 kg CO₂ per month.`,
        potentialSaving: "40 kg CO₂/mo",
        cta: "Simulate impact in Carbon Twin"
      };
    } else if (highestCat?.name === "Diet") {
      return {
        title: "🥗 Meatless Mondays",
        description: `Swapping one beef meal per week for a plant-based option saves roughly 26 kg CO₂ per month.`,
        potentialSaving: "26 kg CO₂/mo",
        cta: "Simulate impact in Carbon Twin"
      };
    } else {
      return {
        title: "⚡ Switch AC to Eco Mode",
        description: `Setting your AC to run 1 hour less per day will save approximately 32 kg CO₂ and $15 per month.`,
        potentialSaving: "32 kg CO₂/mo",
        cta: "Simulate impact in Carbon Twin"
      };
    }
  }, [categoryData]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Welcome back, {profile?.name || "Eco Friend"}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Your carbon score is {carbonScore}. Let&apos;s improve it today.
          </p>
        </div>

        <Link href="/dashboard/log" tabIndex={-1}>
          <Button className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 motion-safe:animate-pulse" />
            <span>AI Daily Log</span>
          </Button>
        </Link>
      </div>

      {/* Main Grid overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carbon Rating Radial Gauge */}
        <GlassCard className="flex flex-col items-center justify-center p-6 text-center">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6" id="score-label">
            Sustainability Score
          </h2>
          <ProgressRing score={carbonScore} size={170} aria-labelledby="score-label" />
          
          <div className="mt-6 border-t border-white/[0.06] pt-4 w-full grid grid-cols-2 gap-2 text-left">
            <div>
              <span className="text-[10px] text-zinc-500 font-mono block">Monthly Target</span>
              <span className="text-sm font-bold text-zinc-200">{limitGoal} kg CO₂</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-mono block">Actual Emission</span>
              <span className="text-sm font-bold text-emerald-400">{monthlyCarbon} kg CO₂</span>
            </div>
          </div>
        </GlassCard>

        {/* Quick Stats Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-6">
          <GlassCard glowColor="rgba(59, 130, 246, 0.15)">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Today&apos;s CO₂</h3>
                <span className="text-2xl font-bold font-mono text-white mt-1 block">{todayCarbon} kg</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400" aria-hidden="true">
                <Zap className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-emerald-400">
              <TrendingDown className="h-3.5 w-3.5" />
              <span>Real-time updated</span>
            </div>
          </GlassCard>

          <GlassCard glowColor="rgba(139, 92, 246, 0.15)">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Weekly CO₂</h3>
                <span className="text-2xl font-bold font-mono text-white mt-1 block">{weeklyCarbon} kg</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400" aria-hidden="true">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
              <span>Limit Cap: {Math.round(limitGoal / 4)} kg</span>
            </div>
          </GlassCard>

          <GlassCard glowColor="rgba(245, 158, 11, 0.15)">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Monthly Total</h3>
                <span className="text-2xl font-bold font-mono text-white mt-1 block">{monthlyCarbon} kg</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400" aria-hidden="true">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-emerald-400">
              <span>{limitGoal - monthlyCarbon > 0 ? `${Math.round((limitGoal - monthlyCarbon) * 10) / 10} kg below limit` : "Limit exceeded!"}</span>
            </div>
          </GlassCard>

          <GlassCard glowColor="rgba(16, 185, 129, 0.15)">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Yearly Projected</h3>
                <span className="text-2xl font-bold font-mono text-white mt-1 block">{yearlyProjected} t</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400" aria-hidden="true">
                <Award className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-zinc-500">
              <span>Global Average: 4.8 t</span>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <GlassCard className="lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Emissions Trend (This Week)</h2>
            <span className="text-[10px] font-mono font-bold text-zinc-400 bg-white/5 border border-white/[0.08] px-2.5 py-1 rounded-full">
              Daily Average: {Math.round((weeklyCarbon / 7) * 10) / 10} kg CO₂
            </span>
          </div>
          <Suspense fallback={<div className="h-[180px] w-full animate-pulse bg-zinc-900/50 rounded-xl" />}>
            <AreaChart data={weeklyData} height={180} color="#10B981" />
          </Suspense>
        </GlassCard>

        {/* Category breakdown donut */}
        <GlassCard>
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6">Footprint Breakdown</h2>
          <div className="flex items-center justify-center h-full">
            {categoryData.length > 0 ? (
              <Suspense fallback={<div className="h-[150px] w-[150px] animate-pulse bg-zinc-900/50 rounded-full" />}>
                <DonutChart data={categoryData} size={150} />
              </Suspense>
            ) : (
              <p className="text-sm text-zinc-500 pb-8">No data yet.</p>
            )}
          </div>
        </GlassCard>
      </div>

      {/* AI recommendation & Recent activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insight Card */}
        <GlassCard className="lg:col-span-2" glowColor="rgba(16, 185, 129, 0.2)">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-200">AI Coach Recommendation</h2>
          </div>
          <h3 className="text-sm font-semibold text-zinc-100">{aiRecommendation.title}</h3>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{aiRecommendation.description}</p>
          
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.06]">
            <span className="text-[10px] text-zinc-500">Potential Savings: <strong className="text-emerald-400 font-mono">{aiRecommendation.potentialSaving}</strong></span>
            <Link href="/dashboard/twin" className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold hover:text-emerald-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-1 -m-1">
              <span>{aiRecommendation.cta}</span>
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>
        </GlassCard>

        {/* Global Leaderboard Snippet */}
        <GlassCard>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Top Climbers</h2>
            <Link href="/dashboard/leaderboard" className="text-[10px] font-bold text-zinc-400 hover:text-zinc-200 flex items-center gap-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded p-1 -m-1">
              <span>View All</span>
              <ChevronRight className="h-3 w-3" aria-hidden="true" />
            </Link>
          </div>

          <div className="space-y-3" role="list">
            {climbers.length > 0 ? climbers.map((climber, idx) => (
              <div
                key={climber.userId}
                role="listitem"
                className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                  idx === 0
                    ? "bg-white/5 border-white/[0.06]"
                    : "bg-transparent border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold w-4 text-center ${
                    idx === 0 ? "text-yellow-500" : idx === 1 ? "text-zinc-400" : idx === 2 ? "text-amber-600" : "text-zinc-500"
                  }`} aria-hidden="true">
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-medium text-zinc-300">{climber.name}</span>
                </div>
                <span className="text-xs text-emerald-400 font-mono font-bold" aria-label={`${climber.points} experience points`}>
                  {climber.points} XP
                </span>
              </div>
            )) : (
              <p className="text-xs text-zinc-500 text-center py-4">No ranked users yet.</p>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
