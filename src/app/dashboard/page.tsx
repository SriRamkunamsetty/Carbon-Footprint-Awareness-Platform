"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { ProgressRing } from "@/components/ui/progress-ring";
import { AreaChart, DonutChart } from "@/components/ui/svg-charts";
import { 
  TrendingDown, 
  AlertCircle, 
  Sparkles, 
  ArrowRight,
  Flame,
  Award,
  ChevronRight,
  CheckCircle2,
  Calendar,
  Zap,
  Car,
  Utensils
} from "lucide-react";
import Link from "next/link";
import { collection, query, where, getDocs, limit, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function DashboardPage() {
  const { profile, isMock } = useAuth();
  const [loading, setLoading] = useState(true);

  // Stats states
  const [weeklyData, setWeeklyData] = useState([
    { label: "Mon", value: 0 },
    { label: "Tue", value: 0 },
    { label: "Wed", value: 0 },
    { label: "Thu", value: 0 },
    { label: "Fri", value: 0 },
    { label: "Sat", value: 0 },
    { label: "Sun", value: 0 }
  ]);

  const [categoryData, setCategoryData] = useState([
    { name: "Transport", value: 0, color: "#3B82F6" }, // Blue
    { name: "Diet", value: 0, color: "#10B981" },      // Emerald (food)
    { name: "Utilities", value: 0, color: "#F59E0B" }, // Amber (electricity)
    { name: "Shopping", value: 0, color: "#8B5CF6" }   // Violet
  ]);

  const [todayCarbon, setTodayCarbon] = useState(0);
  const [weekCarbon, setWeekCarbon] = useState(0);
  const [monthCarbon, setMonthCarbon] = useState(0);

  const [climbers, setClimbers] = useState<any[]>([
    { name: "Sarah Jenkins", points: 840, streak: 12, carbonScore: 92 },
    { name: "Michael Chang", points: 760, streak: 8, carbonScore: 89 },
    { name: "Elena Rostova", points: 695, streak: 7, carbonScore: 87 }
  ]);

  // Streak/XP levels
  const currentStreak = profile?.streak ?? 0;
  const carbonScore = profile?.carbonScore ?? 75;
  const limitGoal = profile?.goal ?? 350;

  // Recommendations
  const aiRecommendation = {
    title: "⚡ Switch AC to Eco Mode",
    description: `Setting your AC to run 1 hour less per day in ${profile?.country || "your area"} will save approximately 32 kg CO₂ and $15 per month.`,
    potentialSaving: "32 kg CO₂/mo",
    cta: "Simulate impact in Carbon Twin"
  };

  useEffect(() => {
    if (!profile) return;

    setLoading(true);

    const q = query(
      collection(db, "activities"),
      where("userId", "==", profile.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let totalTransport = 0;
      let totalDiet = 0;
      let totalUtilities = 0;
      let totalShopping = 0;
      
      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      
      // Initialize a map for the last 7 days of emissions.
      const last7Days: { [key: string]: number } = {};
      const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayStr = d.toISOString().split("T")[0];
        last7Days[dayStr] = 0;
      }

      let todayCarbonSum = 0;
      let weekCarbonSum = 0;
      let monthCarbonSum = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const carbon = Number(data.carbonEmit || 0);
        const category = data.category;
        
        let dateStr = "";
        if (data.date) {
          if (data.date.seconds) {
            dateStr = new Date(data.date.seconds * 1000).toISOString().split("T")[0];
          } else if (data.date instanceof Date) {
            dateStr = data.date.toISOString().split("T")[0];
          } else {
            dateStr = new Date(data.date).toISOString().split("T")[0];
          }
        }

        // Sum categories
        if (category === "transport") totalTransport += carbon;
        else if (category === "food") totalDiet += carbon;
        else if (category === "electricity") totalUtilities += carbon;
        else if (category === "shopping") totalShopping += carbon;

        // Sum totals based on time windows
        if (dateStr === todayStr) {
          todayCarbonSum += carbon;
        }

        // Check if within last 7 days
        if (dateStr in last7Days) {
          last7Days[dateStr] += carbon;
          weekCarbonSum += carbon;
        }

        // Check if within current month (e.g. YYYY-MM)
        if (dateStr && dateStr.substring(0, 7) === todayStr.substring(0, 7)) {
          monthCarbonSum += carbon;
        }
      });

      // Format category data
      setCategoryData([
        { name: "Transport", value: Math.round(totalTransport * 10) / 10, color: "#3B82F6" },
        { name: "Diet", value: Math.round(totalDiet * 10) / 10, color: "#10B981" },
        { name: "Utilities", value: Math.round(totalUtilities * 10) / 10, color: "#F59E0B" },
        { name: "Shopping", value: Math.round(totalShopping * 10) / 10, color: "#8B5CF6" },
      ]);

      // Format weekly trend chart data
      const formattedWeekly = Object.keys(last7Days).sort().map((dateStr) => {
        const d = new Date(dateStr + "T00:00:00");
        const label = dayNames[d.getDay()];
        return {
          label,
          value: Math.round(last7Days[dateStr] * 10) / 10
        };
      });
      setWeeklyData(formattedWeekly);

      setTodayCarbon(Math.round(todayCarbonSum * 10) / 10);
      setWeekCarbon(Math.round(weekCarbonSum * 10) / 10);
      setMonthCarbon(Math.round(monthCarbonSum * 10) / 10);

      setLoading(false);
    }, (error) => {
      console.error("Firestore onSnapshot error in dashboard:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile]);

  useEffect(() => {
    // Fetch top users from users collection for Top Climbers widget
    const uQuery = query(
      collection(db, "users"),
      orderBy("points", "desc"),
      limit(3)
    );
    const unsubscribe = onSnapshot(uQuery, (snapshot) => {
      const topUsers: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        topUsers.push({
          name: data.name || "Eco Citizen",
          points: data.points || 0,
          streak: data.streak || 0,
          carbonScore: data.carbonScore || 75
        });
      });
      if (topUsers.length > 0) {
        setClimbers(topUsers);
      }
    }, (error) => {
      console.error("Failed to listen to top users:", error);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            Welcome back, {profile?.name || "Eco Friend"}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Your carbon score is in the top 15% of your region. Let&apos;s improve it today.
          </p>
        </div>

        <Link href="/dashboard/log">
          <Button className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 fill-current" />
            <span>AI Daily Log</span>
          </Button>
        </Link>
      </div>

      {/* Main Grid overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carbon Rating Radial Gauge */}
        <GlassCard className="flex flex-col items-center justify-center p-6 text-center" delay={0.05}>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6">Sustainability Score</h3>
          <ProgressRing score={carbonScore} size={170} />
          
          <div className="mt-6 border-t border-white/[0.06] pt-4 w-full grid grid-cols-2 gap-2 text-left">
            <div>
              <span className="text-[10px] text-zinc-500 font-mono block">Monthly Target</span>
              <span className="text-sm font-bold text-zinc-200">{limitGoal} kg CO₂</span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 font-mono block">Actual Emission</span>
              <span className="text-sm font-bold text-emerald-400">{monthCarbon} kg CO₂</span>
            </div>
          </div>
        </GlassCard>
 
        {/* Quick Stats Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-6">
          <GlassCard glowColor="from-blue-500/5 to-transparent" delay={0.1}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Today&apos;s CO₂</span>
                <span className="text-2xl font-bold font-mono text-white mt-1 block">{todayCarbon} kg</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Zap className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-emerald-400">
              <TrendingDown className="h-3.5 w-3.5" />
              <span>Real-time updated</span>
            </div>
          </GlassCard>
 
          <GlassCard glowColor="from-violet-500/5 to-transparent" delay={0.15}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Weekly CO₂</span>
                <span className="text-2xl font-bold font-mono text-white mt-1 block">{weekCarbon} kg</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono">
              <span>Limit Cap: {Math.round(limitGoal / 4)} kg</span>
            </div>
          </GlassCard>
 
          <GlassCard glowColor="from-amber-500/5 to-transparent" delay={0.2}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Monthly Total</span>
                <span className="text-2xl font-bold font-mono text-white mt-1 block">{monthCarbon} kg</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-1.5 text-[10px] text-emerald-400">
              <span>{limitGoal - monthCarbon > 0 ? `${Math.round((limitGoal - monthCarbon) * 10) / 10} kg below limit` : "Limit exceeded!"}</span>
            </div>
          </GlassCard>
 
          <GlassCard glowColor="from-emerald-500/5 to-transparent" delay={0.25}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block">Yearly Projected</span>
                <span className="text-2xl font-bold font-mono text-white mt-1 block">{Math.round((monthCarbon * 12) / 100) / 10} t</span>
              </div>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
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
        <GlassCard className="lg:col-span-2" delay={0.3}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Emissions Trend (This Week)</h3>
            <span className="text-[10px] font-mono font-bold text-zinc-400 bg-white/5 border border-white/[0.08] px-2.5 py-1 rounded-full">
              Daily Average: {Math.round((weekCarbon / 7) * 10) / 10} kg CO₂
            </span>
          </div>
          <AreaChart data={weeklyData} height={180} color="#10B981" />
        </GlassCard>
 
        {/* Category breakdown donut */}
        <GlassCard delay={0.35}>
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-6">Footprint Breakdown</h3>
          <div className="flex items-center justify-center h-full">
            <DonutChart data={categoryData} size={150} />
          </div>
        </GlassCard>
      </div>
 
      {/* AI recommendation & Recent activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Insight Card */}
        <GlassCard className="lg:col-span-2" glowColor="from-emerald-500/10 to-transparent" delay={0.4}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-4 w-4 text-emerald-400 fill-current" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-200">AI Coach Recommendation</h3>
          </div>
          <h4 className="text-sm font-semibold text-zinc-100">{aiRecommendation.title}</h4>
          <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{aiRecommendation.description}</p>
          
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.06]">
            <span className="text-[10px] text-zinc-500">Potential Savings: <strong className="text-emerald-400 font-mono">{aiRecommendation.potentialSaving}</strong></span>
            <Link href="/dashboard/twin" className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold hover:text-emerald-300 transition-colors">
              <span>{aiRecommendation.cta}</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </GlassCard>
 
        {/* Global Leaderboard Snippet */}
        <GlassCard delay={0.45}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Top Climbers</h3>
            <Link href="/dashboard/leaderboard" className="text-[10px] font-bold text-zinc-400 hover:text-zinc-200 flex items-center gap-0.5">
              <span>View All</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
 
          <div className="space-y-3">
            {climbers.map((climber, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                  idx === 0
                    ? "bg-white/5 border-white/[0.06]"
                    : "bg-transparent border-transparent"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-mono font-bold w-4 text-center ${
                    idx === 0 ? "text-yellow-500" : idx === 1 ? "text-zinc-400" : idx === 2 ? "text-amber-600" : "text-zinc-500"
                  }`}>
                    #{idx + 1}
                  </span>
                  <span className="text-xs font-medium text-zinc-300">{climber.name}</span>
                </div>
                <span className="text-xs text-emerald-400 font-mono font-bold">{climber.points} XP</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
