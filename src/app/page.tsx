"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Leaf, 
  TrendingDown, 
  MessageSquareCode, 
  ChevronRight, 
  Globe, 
  ArrowRight,
  ShieldCheck,
  Zap,
  HelpCircle,
  Menu,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LandingPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const features = [
    {
      icon: <Sparkles className="h-5 w-5 text-emerald-400" />,
      title: "AI Daily Log",
      description: "Describe your day in natural text. Our advanced parser translates inputs into structured carbon categories."
    },
    {
      icon: <Leaf className="h-5 w-5 text-blue-400" />,
      title: "Carbon Digital Twin",
      description: "A flagship simulator that mirrors your lifestyle. Test virtual swaps (solar panels, EV, diet changes) to see projected offsets."
    },
    {
      icon: <MessageSquareCode className="h-5 w-5 text-violet-400" />,
      title: "AI Sustainability Coach",
      description: "Get customized daily tips, local utility advice, and responsive feedback from a specialized sustainability chatbot."
    },
    {
      icon: <TrendingDown className="h-5 w-5 text-amber-400" />,
      title: "Beautiful Analytics",
      description: "Interactive animated Area, Bar, and Donut SVG graphs that track your carbon performance dynamically without performance bloat."
    },
    {
      icon: <Zap className="h-5 w-5 text-teal-400" />,
      title: "Streak Gamification",
      description: "Earn Eco XP, complete daily habits logging streaks, level up your profile rank, and unlock collectible badges."
    },
    {
      icon: <ShieldCheck className="h-5 w-5 text-red-400" />,
      title: "Audited Enterprise Vault",
      description: "Secure user ownership access, input sanitization rules, and full JSON data portability exports protect your metadata."
    }
  ];

  const faqs = [
    {
      q: "How does the AI compiler calculate my carbon footprint?",
      a: "The compiler scans your text input for distance keywords, diet categories, and AC usage metrics. It maps these parameters to global standard emission coefficients from our modular carbon engine."
    },
    {
      q: "Can I use CarbonMind AI for free?",
      a: "Yes! The core tracking, AI digital twin simulator, and dashboard are completely free. We also support local guest Demo mode for immediate testing."
    },
    {
      q: "Is my personal data secure?",
      a: "Absolutely. All authentication is verified via Firebase Security modules. User data is isolated under Cloud Firestore rules with strict ownership verification."
    },
    {
      q: "Can I export my tracking history?",
      a: "Yes, we support full data portability. You can download your complete profile details and logged carbon records in standard JSON format from the Settings panel."
    }
  ];

  return (
    <div className="relative min-h-screen bg-black text-zinc-100 flex flex-col overflow-hidden">
      {/* Aurora floating gradient lights */}
      <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-[10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none -z-10 animate-pulse" style={{ animationDuration: "8s" }} />

      {/* Subtle grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0a0a0a_1px,transparent_1px),linear-gradient(to_bottom,#0a0a0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_80%,transparent_100%)] pointer-events-none -z-20" />

      {/* HEADER / NAVIGATION */}
      <header className="h-20 flex items-center justify-between px-6 md:px-12 border-b border-white/[0.04] bg-black/40 backdrop-blur-md relative z-30 shrink-0">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-white/10 flex items-center justify-center text-sm shadow-[0_0_15px_rgba(16,185,129,0.08)] font-display font-bold">
            🌍
          </div>
          <span className="font-bold text-sm tracking-tight text-white">CarbonMind AI</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold tracking-wide text-zinc-400">
          <a href="#features" className="hover:text-zinc-200 transition-colors">Features</a>
          <a href="#simulator" className="hover:text-zinc-200 transition-colors">Simulator</a>
          <a href="#faq" className="hover:text-zinc-200 transition-colors">FAQ</a>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <Link href="/dashboard">
              <Button size="sm">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors px-3 py-2">
                Sign In
              </Link>
              <Link href="/login">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-zinc-400 cursor-pointer"
        >
          {mobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
        </button>
      </header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 left-0 right-0 z-20 bg-zinc-950 border-b border-white/[0.08] p-6 flex flex-col gap-4 text-center"
          >
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-zinc-300 hover:text-white"
            >
              Features
            </a>
            <a
              href="#simulator"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-zinc-300 hover:text-white"
            >
              Simulator
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-medium text-zinc-300 hover:text-white"
            >
              FAQ
            </a>
            <div className="h-[1px] bg-white/[0.06] my-2" />
            {user ? (
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full">Dashboard</Button>
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTAINER */}
      <main className="flex-grow overflow-y-auto">
        {/* HERO SECTION */}
        <section className="px-6 md:px-12 py-24 md:py-32 flex flex-col lg:flex-row items-center gap-16 max-w-7xl mx-auto relative z-10">
          <div className="flex-1 space-y-6 text-center lg:text-left">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
              <Sparkles className="h-3 w-3 fill-current" />
              <span>Version 1.0 Live</span>
            </span>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight text-white leading-[1.05]">
              Understand Your Carbon. <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-400">
                Shape Your Future.
              </span>
            </h1>

            <p className="text-sm md:text-base text-zinc-400 max-w-lg mx-auto lg:mx-0 leading-relaxed font-sans">
              An AI-powered carbon intelligence platform that translates your natural language logs into structured indices, runs twin simulations, and cuts your footprint.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto flex items-center gap-2">
                  <span>Get Started</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <a href="#simulator" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Live Demo
                </Button>
              </a>
            </div>
          </div>

          {/* Hero Visual globe */}
          <div className="flex-1 flex justify-center items-center relative w-full max-w-md aspect-square">
            {/* Spinning orbital rings */}
            <div className="absolute inset-0 rounded-full border border-emerald-500/10 animate-spin" style={{ animationDuration: "12s" }} />
            <div className="absolute inset-8 rounded-full border border-blue-500/10 animate-spin" style={{ animationDuration: "20s", animationDirection: "reverse" }} />
            
            {/* Glowing earth globe */}
            <div className="w-72 h-72 rounded-full bg-zinc-950 border border-white/[0.08] shadow-[0_0_80px_rgba(16,185,129,0.05)] flex items-center justify-center relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500/5 to-blue-500/5" />
              <Globe className="w-44 h-44 text-zinc-800 animate-pulse" />
              
              {/* Overlay indicators */}
              <div className="absolute top-1/4 right-8 bg-zinc-900/90 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur text-[9px] font-mono shadow-xl flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                <span>AI Core Active</span>
              </div>

              <div className="absolute bottom-1/4 left-8 bg-zinc-900/90 border border-white/10 px-3 py-1.5 rounded-xl backdrop-blur text-[9px] font-mono shadow-xl flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulated Twin</span>
              </div>
            </div>
          </div>
        </section>

        {/* PLATFORM STATISTICS */}
        <section className="border-y border-white/[0.04] bg-zinc-950/20 py-12">
          <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            <div>
              <span className="text-3xl font-bold font-mono tracking-tight text-white">42,840 kg</span>
              <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-1">Carbon Saved Monthly</p>
            </div>
            <div>
              <span className="text-3xl font-bold font-mono tracking-tight text-white">82%</span>
              <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-1">Avg Score Improvement</p>
            </div>
            <div>
              <span className="text-3xl font-bold font-mono tracking-tight text-white">12,000+</span>
              <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-1">Daily Habits Logs</p>
            </div>
            <div>
              <span className="text-3xl font-bold font-mono tracking-tight text-white">99.8%</span>
              <p className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 mt-1">Uptime SLA Reliability</p>
            </div>
          </div>
        </section>

        {/* FEATURES CATALOG */}
        <section id="features" className="px-6 md:px-12 py-24 max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-emerald-400">Core Features</span>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-3 font-display">
              Enterprise Footprint Intelligence
            </h2>
            <p className="text-xs text-zinc-500 mt-1 leading-normal">
              A comprehensive set of tools to track, analyze, simulate and reduce your environmental footprint.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <GlassCard key={i} className="p-6 space-y-4 text-left" delay={i * 0.05}>
                <div className="w-10 h-10 rounded-xl bg-zinc-950/60 border border-white/[0.08] flex items-center justify-center shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-zinc-200">{f.title}</h3>
                  <p className="text-xs text-zinc-500 leading-relaxed mt-2">{f.description}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* INTERACTIVE TIMELINE / HOW IT WORKS */}
        <section className="bg-zinc-950/10 border-t border-white/[0.04] py-24 px-6 md:px-12">
          <div className="max-w-7xl mx-auto space-y-16 text-center">
            <div className="max-w-xl mx-auto">
              <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-emerald-400">How it works</span>
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mt-3 font-display">Three Steps to Carbon Freedom</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-4xl mx-auto relative">
              {/* Connector line for desktop */}
              <div className="hidden md:block absolute top-10 left-32 right-32 h-[1px] bg-white/[0.06] -z-10" />

              <div className="space-y-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center text-xs font-bold font-mono">1</div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Describe Habits</h4>
                <p className="text-xs text-zinc-500 leading-normal">
                  Write down daily habits in plain text (e.g. travel, AC, food servings). Our AI processes it automatically.
                </p>
              </div>

              <div className="space-y-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center text-xs font-bold font-mono">2</div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Analyze & Score</h4>
                <p className="text-xs text-zinc-500 leading-normal">
                  Track dynamic metrics, scores, and weekly trends rendered on beautiful, light SVG dashboard graphs.
                </p>
              </div>

              <div className="space-y-4">
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-black flex items-center justify-center text-xs font-bold font-mono">3</div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Simulate & Reduce</h4>
                <p className="text-xs text-zinc-500 leading-normal">
                  Adjust sliders in your Digital Twin simulator to test changes (EV, solar) and earn points as you improve.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ACCORDION FAQ SECTION */}
        <section id="faq" className="px-6 md:px-12 py-24 max-w-3xl mx-auto space-y-12 text-center">
          <div className="space-y-3">
            <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-emerald-400">FAQ</span>
            <h2 className="text-2xl font-bold tracking-tight text-white font-display">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4 text-left">
            {faqs.map((faq, idx) => {
              const isOpen = faqOpen === idx;
              return (
                <GlassCard
                  key={idx}
                  className="p-5 cursor-pointer select-none"
                  animate={false}
                  onClick={() => setFaqOpen(isOpen ? null : idx)}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-200">{faq.q}</h4>
                    <span className={`text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`}>
                      ▼
                    </span>
                  </div>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <p className="text-xs text-zinc-400 leading-relaxed mt-3 pt-3 border-t border-white/[0.04]">
                          {faq.a}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              );
            })}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.04] bg-zinc-950/40 py-12 px-6 md:px-12 text-center shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="text-lg">🌍</span>
            <span className="font-bold text-xs tracking-wider text-zinc-300 uppercase">CarbonMind AI</span>
          </div>

          <span className="text-[10px] text-zinc-600 font-mono">
            © 2026 CarbonMind AI. Made with Google Cloud & Firebase Web SDKs. All rights reserved.
          </span>

          <div className="flex items-center gap-4 text-xs font-semibold text-zinc-500">
            <a href="#features" className="hover:text-zinc-300">Features</a>
            <a href="#simulator" className="hover:text-zinc-300">Simulator</a>
            <a href="#faq" className="hover:text-zinc-300">FAQ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
