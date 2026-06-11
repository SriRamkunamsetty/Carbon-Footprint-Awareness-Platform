"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, Check, Flame, Trophy, Trash2, Award } from "lucide-react";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ParsedLogResult } from "@/lib/mock-ai";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";

export default function DailyLogPage() {
  const { profile, isMock, updateProfile } = useAuth();
  
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
          profile,
        }),
      });

      const data = await response.json();
      setParsedResult(data);
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

      if (!isMock) {
        // Save to Firestore collections
        await addDoc(collection(db, "daily_logs"), logData);
        
        // Save detailed activities individually for trend metrics
        const actColRef = collection(db, "activities");
        // Transport
        for (const item of parsedResult.categoryMatches.transport) {
          await addDoc(actColRef, {
            userId: profile.uid,
            category: "transport",
            value: item.distanceKm,
            unit: "km",
            carbonEmit: item.carbon,
            date: new Date(),
            note: `Via ${item.mode}`,
          });
        }
        // Food
        for (const item of parsedResult.categoryMatches.food) {
          await addDoc(actColRef, {
            userId: profile.uid,
            category: "food",
            value: item.servings,
            unit: "servings",
            carbonEmit: item.carbon,
            date: new Date(),
            note: `${item.type}`,
          });
        }
        // Electricity
        for (const item of parsedResult.categoryMatches.electricity) {
          await addDoc(actColRef, {
            userId: profile.uid,
            category: "electricity",
            value: item.hours,
            unit: "hours",
            carbonEmit: item.carbon,
            date: new Date(),
            note: `${item.type}`,
          });
        }
      }

      // Update XP Points & Streaks in user profile
      const newPoints = profile.points + 25; // reward 25 points for logging
      const newStreak = profile.streak + 1;
      
      await updateProfile({
        points: newPoints,
        streak: newStreak,
      });

      // Confetti visual validation
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

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
    <div className="max-w-3xl mx-auto space-y-8">
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
      <GlassCard className="p-6">
        <form onSubmit={handleParse} className="space-y-4">
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest block font-mono">
            Describe Your Habits
          </label>
          <div className="relative">
            <textarea
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Example: 'I drove 15 km by car today, ate a beef steak for lunch, and had the AC running for 4 hours.'"
              className="w-full bg-zinc-950/60 border border-white/[0.08] rounded-2xl py-3 pl-4 pr-12 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/40 transition-all font-sans leading-relaxed resize-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="absolute right-3.5 bottom-3.5 w-8 h-8 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center transition-all disabled:opacity-30 cursor-pointer"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </div>
          <span className="text-[10px] text-zinc-500 block">
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
          >
            <div className="flex items-center gap-2">
              <Check className="h-4.5 w-4.5" />
              <span>Activity successfully logged! You earned <strong>25 Eco XP</strong>.</span>
            </div>
            <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full text-[10px]">
              <Flame className="w-3 h-3 fill-current" />
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
          >
            <GlassCard glowColor="from-emerald-500/10 to-transparent" className="p-6">
              <div className="flex items-center gap-2 mb-6 border-b border-white/[0.06] pb-4">
                <Sparkles className="h-4.5 w-4.5 text-emerald-400 fill-current" />
                <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-200">AI Compiler Breakdown</h3>
              </div>

              {/* Parsed list grid */}
              <div className="space-y-4">
                {parsedResult.categoryMatches.transport.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/[0.04]">
                    <div>
                      <span className="text-xs font-semibold text-zinc-200">Transit: {item.mode}</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{item.distanceKm} km traveled</p>
                    </div>
                    <span className="text-xs font-bold font-mono text-zinc-300">+{item.carbon} kg CO₂</span>
                  </div>
                ))}

                {parsedResult.categoryMatches.food.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/[0.04]">
                    <div>
                      <span className="text-xs font-semibold text-zinc-200">Diet: {item.type}</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{item.servings} serving(s)</p>
                    </div>
                    <span className="text-xs font-bold font-mono text-zinc-300">+{item.carbon} kg CO₂</span>
                  </div>
                ))}

                {parsedResult.categoryMatches.electricity.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/[0.04]">
                    <div>
                      <span className="text-xs font-semibold text-zinc-200">Utility: {item.type}</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{item.hours} hours running</p>
                    </div>
                    <span className="text-xs font-bold font-mono text-zinc-300">+{item.carbon} kg CO₂</span>
                  </div>
                ))}

                {parsedResult.categoryMatches.shopping.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/[0.04]">
                    <div>
                      <span className="text-xs font-semibold text-zinc-200">Purchase: {item.category}</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{item.count} item(s)</p>
                    </div>
                    <span className="text-xs font-bold font-mono text-zinc-300">+{item.carbon} kg CO₂</span>
                  </div>
                ))}
              </div>

              {/* Aggregated Total */}
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Estimated Carbon Footprint</span>
                  <span className="text-xl font-bold font-mono text-white block mt-0.5">
                    {parsedResult.totalCarbon} kg CO₂
                  </span>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setParsedResult(null)} className="h-10">
                    <Trash2 className="h-4 w-4 mr-2" />
                    <span>Discard</span>
                  </Button>
                  <Button onClick={handleCommitLog} className="h-10">
                    <Check className="h-4 w-4 mr-2" />
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
