"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Send, Sparkles, User, RefreshCw, AlertCircle } from "lucide-react";
import { addDoc, collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function AICoachPage() {
  const { profile, isMock } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Default welcome message
  const welcomeText = `Hello ${profile?.name || "Eco Friend"}! 👋 I'm your **CarbonMind AI Coach**.

I'm here to analyze your carbon habits, suggest easy lifestyle hacks to lower emissions, and answer questions about sustainability.

Here are a few things you can ask me:
1. *"How can I reduce my transportation carbon footprint?"*
2. *"Is eating chicken significantly better than beef for the environment?"*
3. *"What are some ways to save electricity on home cooling?"*
4. *"Can you give me a personalized carbon reduction plan?"*

How can I help you live more sustainably today?`;

  useEffect(() => {
    // Load chat history or set default welcome
    setMessages([
      { role: "assistant", content: welcomeText }
    ]);
  }, [profile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userText = inputText;
    setInputText("");
    
    // Add user message to state
    const updatedHistory = [...messages, { role: "user" as const, content: userText }];
    setMessages(updatedHistory);
    setLoading(true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: userText,
          mode: "chat",
          history: updatedHistory.slice(-6), // pass recent history context
          profile,
        }),
      });

      const data = await response.json();
      
      if (data.response) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
      } else {
        throw new Error(data.error || "Empty response");
      }
    } catch (error) {
      console.error("AI Coach connection failed:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm sorry, I encountered a connection timeout. Please check your credentials or network and try again." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      { role: "assistant", content: welcomeText }
    ]);
  };

  // Basic custom markdown parser for simple bold, headers, list items
  const renderMessageContent = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      
      // Header 3
      if (trimmed.startsWith("###")) {
        return <h4 key={idx} className="text-sm font-bold text-zinc-100 mt-4 mb-2">{trimmed.replace("###", "").trim()}</h4>;
      }
      // Header 2
      if (trimmed.startsWith("##")) {
        return <h3 key={idx} className="text-base font-bold text-zinc-100 mt-5 mb-2">{trimmed.replace("##", "").trim()}</h3>;
      }
      
      // List item
      let isListItem = false;
      if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
        isListItem = true;
        trimmed = trimmed.substring(1).trim();
      }

      // Parse bold text **word**
      const parts = trimmed.split(/\*\*([^*]+)\*\*/g);
      const parsedElements = parts.map((part, pIdx) => {
        if (pIdx % 2 === 1) {
          return <strong key={pIdx} className="font-bold text-emerald-400">{part}</strong>;
        }
        return part;
      });

      if (isListItem) {
        return (
          <li key={idx} className="ml-4 list-disc text-xs text-zinc-300 leading-relaxed my-1">
            {parsedElements}
          </li>
        );
      }

      return (
        <p key={idx} className="text-xs text-zinc-300 leading-relaxed my-1.5 min-h-[1px]">
          {parsedElements}
        </p>
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white font-display">
            AI Sustainability Coach
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Discuss customized strategies, analyze habits, and map out carbon-reduction goals.
          </p>
        </div>

        <button
          onClick={handleClearHistory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] hover:border-white/20 bg-zinc-950/40 hover:bg-zinc-900/60 text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Reset Chat</span>
        </button>
      </div>

      {/* Messages Scroll Box */}
      <GlassCard className="flex-1 p-6 overflow-y-auto flex flex-col space-y-6 bg-black/60 relative">
        <div className="flex-1 space-y-6">
          {messages.map((msg, index) => {
            const isUser = msg.role === "user";
            return (
              <div
                key={index}
                className={`flex gap-4 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 text-xs font-bold ${
                  isUser
                    ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]"
                }`}>
                  {isUser ? <User className="h-4 w-4" /> : "🌍"}
                </div>

                {/* Bubble */}
                <div className={`p-4 rounded-2xl border ${
                  isUser
                    ? "bg-zinc-950/40 border-white/[0.06] rounded-tr-none text-zinc-300"
                    : "bg-zinc-900/40 border-white/[0.04] rounded-tl-none"
                }`}>
                  {isUser ? (
                    <p className="text-xs text-zinc-200 font-sans leading-relaxed">{msg.content}</p>
                  ) : (
                    <div className="font-sans space-y-1">{renderMessageContent(msg.content)}</div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading bubble */}
          {loading && (
            <div className="flex gap-4 max-w-[85%] mr-auto">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs">
                🌍
              </div>
              <div className="p-4 rounded-2xl border bg-zinc-900/40 border-white/[0.04] rounded-tl-none flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </GlassCard>

      {/* Input Message Footer */}
      <form onSubmit={handleSendMessage} className="flex gap-3 shrink-0">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask your Coach a question..."
          className="flex-1 bg-zinc-950/60 border border-white/[0.08] rounded-2xl px-5 py-4 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/40 transition-all font-sans"
          disabled={loading}
        />
        <Button type="submit" className="h-12 w-12 rounded-2xl flex items-center justify-center px-0 shrink-0" disabled={loading || !inputText.trim()}>
          <Send className="h-4.5 w-4.5" />
        </Button>
      </form>
    </div>
  );
}
