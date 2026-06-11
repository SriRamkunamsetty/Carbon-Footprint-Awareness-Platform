"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { GlassCard } from "@/components/ui/glass-card";
import { 
  Trophy, 
  Flame, 
  Award, 
  Leaf, 
  Zap, 
  Car, 
  ShieldAlert, 
  CheckCircle2, 
  HelpCircle,
  Sparkles
} from "lucide-react";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface LeaderboardUser {
  rank: number;
  name: string;
  points: number;
  streak: number;
  carbonScore: number;
  level: number;
  isCurrentUser?: boolean;
}

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
  const [climbers, setClimbers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "users"),
      orderBy("points", "desc"),
      limit(10)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: LeaderboardUser[] = [];
      let rank = 1;
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          rank: rank++,
          name: data.name || "Eco Citizen",
          points: data.points || 0,
          streak: data.streak || 0,
          carbonScore: data.carbonScore || 75,
          level: Math.max(1, Math.floor((data.points || 0) / 150)),
          isCurrentUser: data.uid === profile?.uid
        });
      });
      setClimbers(list);
      setLoading(false);
    }, (error) => {
      console.error("Failed to load leaderboard:", error);
      // Fallback
      setClimbers([
        { rank: 1, name: "Sarah Jenkins", points: 840, streak: 12, carbonScore: 92, level: 5 },
        { rank: 2, name: "Michael Chang", points: 760, streak: 8, carbonScore: 89, level: 4 },
        { rank: 3, name: "Elena Rostova", points: 695, streak: 7, carbonScore: 87, level: 4 },
        { rank: 4, name: `${profile?.name || "Eco Friend"} (You)`, points: profile?.points ?? 100, streak: profile?.streak ?? 0, carbonScore: profile?.carbonScore ?? 75, level: 2, isCurrentUser: true }
      ]);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [profile]);

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
      unlocked: true, // mock unlock
      icon: "♻️",
      colorClass: "bg-teal-500/10 text-teal-400 border-teal-500/20" 
    },
    { 
      id: "b4", 
      title: "Low Rider", 
      description: "Keep transport footprint under 1.5 kg CO2 in a single log.", 
      unlocked: false, 
      icon: "🚲",
      colorClass: "bg-blue-500/10 text-blue-400 border-blue-500/20 opacity-40" 
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
    <div className="space-y-8">
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
              <Trophy className="h-5 w-5 text-yellow-500" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-200">Global Standings</h3>
            </div>

            {/* List */}
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-6 h-6 border-2 border-t-emerald-400 border-r-transparent border-b-transparent border-l-transparent animate-spin rounded-full mx-auto" />
                </div>
              ) : climbers.length === 0 ? (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  No climbers found yet. Start tracking to claim your spot!
                </div>
              ) : (
                climbers.map((c) => (
                  <div
                    key={c.rank}
                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                      c.isCurrentUser
                        ? "bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.04)]"
                        : "bg-white/5 border-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold font-mono w-6 text-center ${
                        c.rank === 1 ? "text-yellow-500" : c.rank === 2 ? "text-zinc-400" : c.rank === 3 ? "text-amber-600" : "text-zinc-500"
                      }`}>
                        #{c.rank}
                      </span>
                      <div>
                        <span className={`text-xs font-semibold block ${c.isCurrentUser ? "text-emerald-400" : "text-zinc-200"}`}>
                          {c.name}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-mono">Level {c.level} Carbon Tracker</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                        <Flame className="w-3.5 h-3.5 text-orange-400 fill-current" />
                        <span>{c.streak}D</span>
                      </div>

                      <div className="flex flex-col items-end min-w-[70px]">
                        <span className="text-xs font-mono font-bold text-zinc-100">{c.points} XP</span>
                        <span className="text-[9px] text-zinc-500 font-mono">Score: {c.carbonScore}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </div>

        {/* Unlocked Badges */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <Award className="h-5 w-5 text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-200">Unlocked Badges</h3>
            </div>

            <div className="space-y-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`flex items-start gap-4 p-3 rounded-xl border transition-all ${
                    badge.unlocked ? "bg-white/5 border-white/[0.06]" : "bg-transparent border-white/[0.02]"
                  }`}
                >
                  {/* Badge Icon circle */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border text-lg shrink-0 ${badge.colorClass}`}>
                    {badge.icon}
                  </div>

                  <div>
                    <h4 className={`text-xs font-semibold ${badge.unlocked ? "text-zinc-200" : "text-zinc-500"}`}>
                      {badge.title}
                    </h4>
                    <p className="text-[9px] text-zinc-500 leading-normal mt-1">
                      {badge.description}
                    </p>
                    {badge.unlocked && (
                      <span className="inline-flex items-center gap-0.5 text-[8px] font-bold text-emerald-400 mt-2 font-mono uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        <CheckCircle2 className="w-2.5 h-2.5 fill-current" />
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
