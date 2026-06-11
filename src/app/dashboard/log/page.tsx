"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Check, Flame, Trash2 } from "lucide-react";
import { addDoc, collection } from "firebase/firestore";
import { db, getFirebaseAnalytics } from "@/lib/firebase";
import { logEvent } from "firebase/analytics";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

interface ParsedLogResult {
  totalCarbon: number;
  categoryMatches: {
    transport: { mode?: string; distanceKm?: number; carbon?: number; [key: string]: unknown }[];
    food: { type?: string; servings?: number; carbon?: number; [key: string]: unknown }[];
    electricity: { type?: string; hours?: number; carbon?: number; [key: string]: unknown }[];
    shopping: { category?: string; count?: number; carbon?: number; [key: string]: unknown }[];
  };
}

export default function DailyLogPage() {
  const { profile } = useAuth();
  
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedLogResult | null>(null);
  const [commitSuccess, setCommitSuccess] = useState(false);

  const handleParse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setCommitSuccess(false);
    setParsedResult(null);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          mode: "log",
          profile: {
            name: profile?.name,
            country: profile?.country,
          },
        }),
      });

      const data = await response.json();
      if (response.ok && data.parsedResult) {
        setParsedResult(data.parsedResult);
      } else {
        throw new Error(data.error || "Failed to parse log");
      }
    } catch (error) {
      console.error("Failed to parse daily log:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommitLog = async () => {
    if (!parsedResult || !profile) return;

    setLoading(true);
    try {
      const logData = {
        userId: profile.uid,
        date: new Date().toISOString().split("T")[0],
        rawText: inputText,
        parsedItems: parsedResult.categoryMatches,
        totalCarbon: parsedResult.totalCarbon,
        createdAt: new Date(),
      };

      // Save to Firestore collections
      await addDoc(collection(db, "daily_logs"), logData);
      
      // Save detailed activities individually for trend metrics
      const actColRef = collection(db, "activities");
      // Transport
      for (const item of parsedResult.categoryMatches.transport || []) {
        await addDoc(actColRef, {
          userId: profile.uid,
          category: "transport",
          type: item.mode || "gasolineCar",
          value: item.distanceKm || 0,
          unit: "km",
          date: new Date(),
          note: `Via ${item.mode || "transport"}`,
        });
      }
      // Food
      for (const item of parsedResult.categoryMatches.food || []) {
        await addDoc(actColRef, {
          userId: profile.uid,
          category: "food",
          type: item.type || "poultry",
          value: item.servings || 0,
          unit: "servings",
          date: new Date(),
          note: `${item.type || "food"}`,
        });
      }
      // Electricity
      for (const item of parsedResult.categoryMatches.electricity || []) {
        await addDoc(actColRef, {
          userId: profile.uid,
          category: "electricity",
          type: item.type || "airConditioner",
          value: item.hours || 0,
          unit: "hours",
          date: new Date(),
          note: `${item.type || "electricity"}`,
        });
      }
      // Shopping
      for (const item of parsedResult.categoryMatches.shopping || []) {
        await addDoc(actColRef, {
          userId: profile.uid,
          category: "shopping",
          type: item.category || "misc",
          value: item.count || 0,
          unit: "items",
          date: new Date(),
          note: `${item.category || "shopping"}`,
        });
      }

      // Confetti visual validation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#10B981", "#3B82F6", "#F59E0B"]
      });

      const analyticsInstance = getFirebaseAnalytics();
      if (analyticsInstance) {
        logEvent(analyticsInstance, "activity_logged", {
          total_carbon: parsedResult.totalCarbon,
          activity_count: (parsedResult.categoryMatches.transport?.length || 0) +
                          (parsedResult.categoryMatches.food?.length || 0) +
                          (parsedResult.categoryMatches.electricity?.length || 0) +
                          (parsedResult.categoryMatches.shopping?.length || 0),
        });
      }

      setCommitSuccess(true);
      setInputText("");
      setParsedResult(null);
    } catch (error) {
      console.error("Failed to commit carbon log:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-display">
          AI Daily Log
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Type what you did today in simple words, and let our AI carbon compiler handle the math.
        </p>
      </div>

      {/* Input chat panel */}
      <GlassCard className="p-6" role="region" aria-label="Habit Logging Form">
        <form onSubmit={handleParse} className="space-y-4">
          <label htmlFor="log-input" className="text-xs font-semibold text-zinc-400 uppercase tracking-widest block font-mono">
            Describe Your Habits
          </label>
          <div className="relative">
            <textarea
              id="log-input"
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Example: 'I drove 15 km by car today, ate a beef steak for lunch, and had the AC running for 4 hours.'"
              className="w-full bg-zinc-950/60 border border-white/[0.08] rounded-2xl py-3 pl-4 pr-12 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/40 transition-all font-sans leading-relaxed resize-none"
              disabled={loading}
              aria-invalid={false}
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="absolute right-3.5 bottom-3.5 w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center transition-all disabled:opacity-30 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
              aria-label="Parse log entry"
            >
              <Send className="h-4.5 w-4.5" aria-hidden="true" />
            </button>
          </div>
          <span className="text-[10px] text-zinc-500 block" id="log-hint">
            💡 Protip: Mention distances (km/miles), food items (beef, chicken, greens), and AC hours.
          </span>
        </form>
      </GlassCard>

      {/* Confetti / Success Feedback */}
      <AnimatePresence>
        {commitSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center justify-between"
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-center gap-2">
              <Check className="h-4.5 w-4.5" aria-hidden="true" />
              <span>Activity successfully logged! You earned <strong className="font-bold">25 Eco XP</strong>.</span>
            </div>
            <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px]">
              <Flame className="w-3 h-3 fill-current" aria-hidden="true" />
              <span>Streak Level Up!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Parsed Output Box */}
      <AnimatePresence>
        {parsedResult && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
            role="region"
            aria-label="AI Parsing Breakdown"
          >
            <GlassCard glowColor="rgba(16, 185, 129, 0.15)" className="p-6">
              <div className="flex items-center gap-2 mb-6 border-b border-white/[0.06] pb-4">
                <Sparkles className="h-4.5 w-4.5 text-emerald-400 fill-current" aria-hidden="true" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-200">AI Compiler Breakdown</h2>
              </div>

              {/* Parsed list grid */}
              <ul className="space-y-4">
                {(parsedResult.categoryMatches.transport || []).map((item, idx) => (
                  <li key={`trans-${idx}`} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/[0.04]">
                    <div>
                      <span className="text-xs font-semibold text-zinc-200">Transit: {item.mode}</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{item.distanceKm} km traveled</p>
                    </div>
                    <span className="text-xs font-bold font-mono text-zinc-300">+{item.carbon} kg CO₂</span>
                  </li>
                ))}

                {(parsedResult.categoryMatches.food || []).map((item, idx) => (
                  <li key={`food-${idx}`} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/[0.04]">
                    <div>
                      <span className="text-xs font-semibold text-zinc-200">Diet: {item.type}</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{item.servings} serving(s)</p>
                    </div>
                    <span className="text-xs font-bold font-mono text-zinc-300">+{item.carbon} kg CO₂</span>
                  </li>
                ))}

                {(parsedResult.categoryMatches.electricity || []).map((item, idx) => (
                  <li key={`elec-${idx}`} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/[0.04]">
                    <div>
                      <span className="text-xs font-semibold text-zinc-200">Utility: {item.type}</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{item.hours} hours running</p>
                    </div>
                    <span className="text-xs font-bold font-mono text-zinc-300">+{item.carbon} kg CO₂</span>
                  </li>
                ))}

                {(parsedResult.categoryMatches.shopping || []).map((item, idx) => (
                  <li key={`shop-${idx}`} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/[0.04]">
                    <div>
                      <span className="text-xs font-semibold text-zinc-200">Purchase: {item.category}</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{item.count} item(s)</p>
                    </div>
                    <span className="text-xs font-bold font-mono text-zinc-300">+{item.carbon} kg CO₂</span>
                  </li>
                ))}

                {(!parsedResult.categoryMatches.transport?.length && !parsedResult.categoryMatches.food?.length && !parsedResult.categoryMatches.electricity?.length && !parsedResult.categoryMatches.shopping?.length) && (
                  <p className="text-xs text-zinc-500 py-2">No matching carbon activities found in your text.</p>
                )}
              </ul>

              {/* Aggregated Total */}
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Estimated Carbon Footprint</h3>
                  <span className="text-xl font-bold font-mono text-white block mt-0.5">
                    {parsedResult.totalCarbon} kg CO₂
                  </span>
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                  <Button variant="outline" onClick={() => setParsedResult(null)} className="h-10 flex-1 sm:flex-none" aria-label="Discard log">
                    <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                    <span>Discard</span>
                  </Button>
                  <Button onClick={handleCommitLog} className="h-10 flex-1 sm:flex-none" disabled={loading} aria-label="Log these habits">
                    <Check className="h-4 w-4 mr-2" aria-hidden="true" />
                    <span>Log Habits</span>
                  </Button>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
