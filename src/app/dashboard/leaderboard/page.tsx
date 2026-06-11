"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { useLeaderboard } from "@/hooks";
import { GlassCard } from "@/components/ui/glass-card";
import { 
  Trophy, 
  Flame, 
  Award, 
  CheckCircle2, 
} from "lucide-react";

interface Badge {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
  colorClass: string;
}

export default function LeaderboardPage() {
  const { profile } = useAuth();
  const { entries: climbers, loading } = useLeaderboard({ userId: profile?.uid ?? null, topN: 10 });

  // Badges catalog
  const badges: Badge[] = [
    { 
      id: "b1", 
      title: "Green Pioneer", 
      description: "Complete your initial onboarding questionnaire baseline profile.", 
      unlocked: profile?.onboarded ?? false, 
      icon: "🌱",
      colorClass: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
    },
    { 
      id: "b2", 
      title: "Streak Warrior", 
      description: "Log your daily carbon habits 5 days in a row.", 
      unlocked: (profile?.streak ?? 0) >= 5, 
      icon: "🔥",
      colorClass: "bg-orange-500/10 text-orange-400 border-orange-500/20" 
    },
    { 
      id: "b3", 
      title: "Zero Waste Hero", 
      description: "Successfully log a day with zero food waste landfill emissions.", 
      unlocked: (profile?.points ?? 0) >= 200, // heuristic unlock based on points
      icon: "♻️",
      colorClass: "bg-teal-500/10 text-teal-400 border-teal-500/20" 
    },
    { 
      id: "b4", 
      title: "Low Rider", 
      description: "Keep transport footprint under 1.5 kg CO2 in a single log.", 
      unlocked: (profile?.carbonScore ?? 0) > 85, 
      icon: "🚲",
      colorClass: "bg-blue-500/10 text-blue-400 border-blue-500/20" 
    },
    { 
      id: "b5", 
      title: "Veggie Master", 
      description: "Complete a full week logging vegetarian dietary meals.", 
      unlocked: false, 
      icon: "🥗",
      colorClass: "bg-amber-500/10 text-amber-400 border-amber-500/20 opacity-40" 
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-display">
          Achievements & Leaderboard
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Compete in community carbon reductions, unlock badges, earn XP levels, and build permanent habits.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Leaderboard Rankings */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-2.5 mb-6">
              <Trophy className="h-5 w-5 text-yellow-500" aria-hidden="true" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-200">Global Standings</h2>
            </div>

            {/* List */}
            <div className="space-y-3" role="list">
              {loading ? (
                <div className="text-center py-12" aria-busy="true" aria-label="Loading leaderboard">
                  <div className="w-6 h-6 border-2 border-t-emerald-400 border-r-transparent border-b-transparent border-l-transparent animate-spin rounded-full mx-auto" />
                </div>
              ) : climbers.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs" role="alert">
                  No climbers found yet. Start tracking to claim your spot!
                </div>
              ) : (
                climbers.map((c, idx) => {
                  const rank = idx + 1;
                  const isCurrentUser = c.userId === profile?.uid;
                  return (
                    <div
                      key={c.userId}
                      role="listitem"
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                        isCurrentUser
                          ? "bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.04)]"
                          : "bg-white/5 border-white/[0.04]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold font-mono w-6 text-center ${
                          rank === 1 ? "text-yellow-500" : rank === 2 ? "text-zinc-400" : rank === 3 ? "text-amber-600" : "text-zinc-500"
                        }`} aria-hidden="true">
                          #{rank}
                        </span>
                        <div>
                          <span className={`text-xs font-semibold block ${isCurrentUser ? "text-emerald-400" : "text-zinc-200"}`}>
                            {c.name} {isCurrentUser && "(You)"}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono">Level {c.level} Carbon Tracker</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono" aria-label={`${c.streak} day streak`}>
                          <Flame className="w-3.5 h-3.5 text-orange-400 fill-current" aria-hidden="true" />
                          <span>{c.streak}D</span>
                        </div>

                        <div className="flex flex-col items-end min-w-[70px]">
                          <span className="text-xs font-mono font-bold text-zinc-100" aria-label={`${c.points} experience points`}>{c.points} XP</span>
                          <span className="text-[9px] text-zinc-500 font-mono">Score: {c.carbonScore}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </GlassCard>
        </div>

        {/* Unlocked Badges */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Award className="h-5 w-5 text-emerald-400" aria-hidden="true" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-200">Unlocked Badges</h2>
            </div>

            <div className="space-y-4" role="list">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  role="listitem"
                  className={`flex items-start gap-4 p-3 rounded-xl border transition-all ${
                    badge.unlocked ? "bg-white/5 border-white/[0.06]" : "bg-transparent border-white/[0.02]"
                  }`}
                  aria-label={`${badge.title} badge, ${badge.unlocked ? 'unlocked' : 'locked'}`}
                >
                  {/* Badge Icon circle */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border text-lg shrink-0 ${badge.colorClass}`} aria-hidden="true">
                    {badge.icon}
                  </div>

                  <div>
                    <h3 className={`text-xs font-semibold ${badge.unlocked ? "text-zinc-200" : "text-zinc-500"}`}>
                      {badge.title}
                    </h3>
                    <p className="text-[9px] text-zinc-500 leading-normal mt-1">
                      {badge.description}
                    </p>
                    {badge.unlocked && (
                      <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-emerald-400 mt-2 font-mono uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        <CheckCircle2 className="w-2.5 h-2.5 fill-current" aria-hidden="true" />
                        <span>Unlocked</span>
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
