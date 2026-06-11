"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Mail, Lock, User, AlertCircle, CheckCircle, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();
  const { user, profile, loginWithGoogle, loginWithEmail, signupWithEmail, resetPassword } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // If user is already authenticated and onboarded, redirect to dashboard
  useEffect(() => {
    if (user && profile) {
      if (profile.onboarded) {
        router.push("/dashboard");
      } else {
        router.push("/onboarding");
      }
    }
  }, [user, profile, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Email address is required.");
      return;
    }

    if (!isReset && !password) {
      setError("Password is required.");
      return;
    }

    if (isSignUp && !name) {
      setError("Full name is required.");
      return;
    }

    setActionLoading(true);
    try {
      if (isReset) {
        await resetPassword(email);
        setSuccess("Password reset instructions have been sent to your email.");
        setIsReset(false);
      } else if (isSignUp) {
        await signupWithEmail(email, password, name);
        setSuccess("Account created successfully!");
      } else {
        await loginWithEmail(email, password);
        setSuccess("Logged in successfully!");
      }
    } catch (err) {
      console.error(err);
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("auth/user-not-found") || msg.includes("auth/wrong-password")) {
        setError("Invalid email or password combination.");
      } else if (msg.includes("auth/email-already-in-use")) {
        setError("This email address is already in use.");
      } else if (msg.includes("auth/weak-password")) {
        setError("Password should be at least 6 characters.");
      } else {
        setError("Authentication failed. Please check your credentials.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setSuccess("");
    setActionLoading(true);
    try {
      await loginWithGoogle();
      setSuccess("Logged in with Google!");
    } catch (err) {
      console.error(err);
      setError("Google authentication failed. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    setError("");
    setSuccess("");
    setActionLoading(true);
    setTimeout(() => {
      setError("Demo mode is not available.");
      setActionLoading(false);
    }, 800);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-black overflow-hidden px-4 py-12">
      {/* Animated Aurora lighting grids */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      
      {/* Subtle grid pattern background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c0c0c_1px,transparent_1px),linear-gradient(to_bottom,#0c0c0c_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo branding */}
        <div className="flex flex-col items-center mb-8">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center w-12 h-12 rounded-2xl bg-zinc-900 border border-white/10 shadow-[0_0_20px_rgba(16,185,129,0.1)] mb-4"
          >
            <span className="text-xl">🌍</span>
          </motion.div>
          <motion.h1
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl font-bold font-display tracking-tight text-white"
          >
            CarbonMind AI
          </motion.h1>
          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs text-zinc-500 mt-1"
          >
            Your Personal Carbon Intelligence Platform
          </motion.p>
        </div>

        <GlassCard className="relative p-8">
          <AnimatePresence mode="wait">
            {/* Header Title */}
            <motion.div
              key={(() => { if (isReset) return "reset"; if (isSignUp) return "signup"; return "login"; })()}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="mb-6"
            >
              <h2 className="text-lg font-semibold text-zinc-100">
                {(() => { if (isReset) return "Reset Password"; if (isSignUp) return "Create Account"; return "Welcome Back"; })()}
              </h2>
              <p className="text-xs text-zinc-400 mt-1">
                {(() => { if (isReset) return "Enter your email to receive recovery instructions."; if (isSignUp) return "Sign up to start tracking your carbon score."; return "Sign in to access your sustainability dashboard."; })()}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Feedback Messages */}
          {error && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-mono">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="relative">
                <label htmlFor="fullName" className="sr-only">Full Name</label>
                <span className="absolute left-3 top-3.5 text-zinc-500" aria-hidden="true">
                  <User className="h-4 w-4" />
                </span>
                <input
                  id="fullName"
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950/60 border border-white/[0.08] rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-sans"
                  disabled={actionLoading}
                />
              </div>
            )}

            <div className="relative">
              <label htmlFor="emailAddress" className="sr-only">Email Address</label>
              <span className="absolute left-3 top-3.5 text-zinc-500" aria-hidden="true">
                <Mail className="h-4 w-4" />
              </span>
              <input
                id="emailAddress"
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950/60 border border-white/[0.08] rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono"
                disabled={actionLoading}
              />
            </div>

            {!isReset && (
              <div className="relative">
                <label htmlFor="password" className="sr-only">Password</label>
                <span className="absolute left-3 top-3.5 text-zinc-500" aria-hidden="true">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-950/60 border border-white/[0.08] rounded-xl py-3 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono"
                  disabled={actionLoading}
                />
              </div>
            )}

            {/* Forgot password trigger */}
            {!isSignUp && !isReset && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsReset(true)}
                  className="text-xs text-zinc-400 hover:text-zinc-200 focus:outline-none font-sans"
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <Button type="submit" className="w-full py-3 mt-2" loading={actionLoading}>
              {(() => { if (isReset) return "Reset Password"; if (isSignUp) return "Create Account"; return "Sign In"; })()}
            </Button>
          </form>

          {/* Separator */}
          {!isReset && (
            <>
              <div className="relative flex py-4 items-center">
                <div className="flex-grow border-t border-white/[0.06]"></div>
                <span className="flex-shrink mx-4 text-zinc-500 text-[10px] uppercase font-bold tracking-widest font-mono">
                  Or Continue With
                </span>
                <div className="flex-grow border-t border-white/[0.06]"></div>
              </div>

              {/* Social Login Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleGoogleLogin}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 bg-zinc-950/50 hover:bg-zinc-900 border border-white/[0.08] hover:border-white/10 rounded-xl py-2.5 px-4 text-xs font-semibold text-zinc-300 transition-all cursor-pointer"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.478 0-6.3-2.822-6.3-6.3s2.822-6.3 6.3-6.3c1.706 0 3.24.685 4.35 1.795l3.056-3.056C19.24 2.585 16.012 1.3 12.24 1.3 6.22 1.3 1.3 6.22 1.3 12.24s4.92 10.94 10.94 10.94c6.262 0 10.428-4.407 10.428-10.612 0-.685-.062-1.354-.185-1.983H12.24z"
                    />
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  onClick={handleDemoSignIn}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/10 hover:border-emerald-500/20 rounded-xl py-2.5 px-4 text-xs font-semibold text-emerald-400 transition-all cursor-pointer"
                >
                  <Shield className="h-4 w-4" />
                  <span>Demo Mode</span>
                </button>
              </div>
            </>
          )}

          {/* Toggle Login/Signup modes */}
          <div className="text-center mt-6">
            <button
              onClick={() => {
                if (isReset) {
                  setIsReset(false);
                } else {
                  setIsSignUp(!isSignUp);
                }
                setError("");
                setSuccess("");
              }}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors focus:outline-none"
            >
              {(() => { if (isReset) return "Back to Login"; if (isSignUp) return "Already have an account? Sign In"; return "Don't have an account? Sign Up"; })()}
            </button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
