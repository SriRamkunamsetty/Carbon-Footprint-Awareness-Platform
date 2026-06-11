"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Bell, Flame, Award, ChevronDown, Check, User as UserIcon } from "lucide-react";
import Image from "next/image";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export function Topbar() {
  const { profile } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "n1",
      title: "🔥 Streak Multiplier Active",
      description: "You've logged carbon 5 days in a row! Keep it up.",
      time: "2 hours ago",
      read: false,
    },
    {
      id: "n2",
      title: "🏆 Achievement Unlocked",
      description: "Unlocked the 'Green Pioneer' badge for completing onboarding.",
      time: "1 day ago",
      read: true,
    },
    {
      id: "n3",
      title: "🌱 Goal Progress",
      description: "You are currently 15% below your target carbon cap this week.",
      time: "2 days ago",
      read: true,
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  return (
    <header className="h-16 border-b border-white/[0.06] bg-black/40 backdrop-blur-md flex items-center justify-between px-8 relative z-20">
      {/* Search Bar or Subtitle */}
      <div className="flex items-center">
        <span className="text-xs font-semibold font-mono text-zinc-500 uppercase tracking-widest">
          Personal Intelligence
        </span>
      </div>

      {/* Right Stats & Profile */}
      <div className="flex items-center gap-6">
        {/* Streak Counter */}
        {profile && (
          <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 px-3 py-1 rounded-full text-xs font-bold font-mono">
            <Flame className="h-3.5 w-3.5 fill-current animate-pulse" />
            <span>{profile.streak} DAY STREAK</span>
          </div>
        )}

        {/* Eco Points / XP */}
        {profile && (
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold font-mono">
            <Award className="h-3.5 w-3.5" />
            <span>{profile.points} ECO XP</span>
          </div>
        )}

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl border border-white/[0.08] hover:border-white/20 bg-zinc-950/40 hover:bg-zinc-900/60 flex items-center justify-center transition-all text-zinc-400 hover:text-zinc-200 cursor-pointer"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10B981]" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-white/[0.08] bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-xl text-left">
              <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-3">
                <span className="text-xs font-bold text-zinc-200">Alerts</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-2.5 rounded-xl border transition-all ${
                      n.read ? "bg-transparent border-transparent" : "bg-white/5 border-white/[0.06]"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="text-xs font-semibold text-zinc-300">{n.title}</h4>
                      <span className="text-[9px] text-zinc-500 font-mono">{n.time}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">{n.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar / Menu */}
        {profile && (
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 pl-1.5 pr-2.5 py-1.5 rounded-full border border-white/[0.08] hover:border-white/20 bg-zinc-950/40 hover:bg-zinc-900/60 transition-all cursor-pointer"
            >
              {profile.photoURL ? (
                <div className="w-6 h-6 rounded-full overflow-hidden relative border border-white/10">
                  <Image
                    src={profile.photoURL}
                    alt={profile.name}
                    width={24}
                    height={24}
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-300">
                  <UserIcon className="h-3 w-3" />
                </div>
              )}
              <span className="text-xs font-semibold text-zinc-300 hidden sm:inline max-w-[100px] truncate">
                {profile.name}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-3 w-48 rounded-2xl border border-white/[0.08] bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-xl text-left">
                <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                  <p className="text-xs font-semibold text-zinc-200 truncate">{profile.name}</p>
                  <p className="text-[10px] text-zinc-500 font-mono truncate">{profile.email}</p>
                </div>
                <div className="p-1">
                  <div className="px-3 py-1.5 text-[10px] text-zinc-400 font-medium">
                    Green Level: Pioneer
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
