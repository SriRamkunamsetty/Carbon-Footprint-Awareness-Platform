"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  User, 
  Bell, 
  Database, 
  Trash2, 
  Check, 
  Download
} from "lucide-react";
import confetti from "canvas-confetti";

export default function SettingsPage() {
  const { profile, updateProfile, logout } = useAuth();
  
  const [name, setName] = useState(profile?.name || "");
  const [country, setCountry] = useState(profile?.country || "");
  const [occupation, setOccupation] = useState(profile?.occupation || "");
  const [theme, setTheme] = useState(profile?.preferences?.theme || "dark");
  const [notifications, setNotifications] = useState(profile?.preferences?.notifications ?? true);
  const [weeklyDigest, setWeeklyDigest] = useState(profile?.preferences?.weeklyDigest ?? true);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleNotificationToggle = async (checked: boolean) => {
    setNotifications(checked);
    if (checked && typeof window !== "undefined" && "Notification" in window) {
      try {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
          console.log("Notification permission granted!");
          // Dynamically import messaging to avoid SSR errors
          const { messaging } = await import("@/lib/firebase");
          if (messaging) {
            const { getToken } = await import("firebase/messaging");
            const token = await getToken(messaging, {
              vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
            });
            console.log("FCM registration token:", token);
          }
        }
      } catch (err) {
        console.warn("FCM registration failed:", err);
      }
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      await updateProfile({
        name,
        country,
        occupation,
        preferences: {
          theme: theme as any,
          notifications,
          weeklyDigest,
        }
      });
      
      confetti({
        particleCount: 20,
        spread: 30,
        origin: { y: 0.8 }
      });
      setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportData = () => {
    if (!profile) return;
    
    // Package data for export
    const exportObj = {
      profile: {
        uid: profile.uid,
        name: profile.name,
        email: profile.email,
        country: profile.country,
        carbonScore: profile.carbonScore,
        ecoXP: profile.points,
        streak: profile.streak,
        monthlyGoal: profile.goal
      },
      exportedAt: new Date().toISOString(),
      platform: "CarbonMind AI"
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `carbonmind_data_${profile.uid}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white font-display">
          System Settings
        </h1>
        <p className="text-xs text-zinc-500 mt-0.5">
          Configure profile metrics, platform settings, notification preferences, and export records.
        </p>
      </div>

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <Check className="h-4.5 w-4.5" />
          <span>Profile configuration updated successfully.</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Profile metadata */}
        <GlassCard className="p-6 space-y-5">
          <div className="flex items-center gap-2.5 mb-2">
            <User className="h-4.5 w-4.5 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-200">Account Details</h3>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="settings-display-name" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Full Display Name</label>
            <input
              id="settings-display-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950/60 border border-white/[0.08] rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/40 font-sans"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="settings-country" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Country of Residence</label>
              <input
                id="settings-country"
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-zinc-950/60 border border-white/[0.08] rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/40"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="settings-occupation" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Occupation</label>
              <input
                id="settings-occupation"
                type="text"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
                className="w-full bg-zinc-950/60 border border-white/[0.08] rounded-xl px-4 py-3 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500/40"
              />
            </div>
          </div>
        </GlassCard>

        {/* Section 2: Notifications & UI theme */}
        <GlassCard className="p-6 space-y-5">
          <div className="flex items-center gap-2.5 mb-2">
            <Bell className="h-4.5 w-4.5 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-200">System Preferences</h3>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="settings-theme" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">UI Theme</label>
            <select
              id="settings-theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value as "dark" | "light" | "system")}
              className="w-full bg-zinc-950/60 border border-white/[0.08] rounded-xl p-3 text-xs text-zinc-200 focus:outline-none"
            >
              <option value="dark">Carbon Dark First</option>
              <option value="light">Solar Light</option>
              <option value="system">System Preference</option>
            </select>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 border border-white/[0.04]">
              <label htmlFor="settings-alerts" className="cursor-pointer flex-1 mr-4">
                <span className="text-xs font-semibold text-zinc-200">System Alerts</span>
                <p className="text-[10px] text-zinc-500 mt-0.5">Receive streak notifications and goal alerts.</p>
              </label>
              <input
                id="settings-alerts"
                type="checkbox"
                checked={notifications}
                onChange={(e) => handleNotificationToggle(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 border border-white/[0.04]">
              <label htmlFor="settings-digest" className="cursor-pointer flex-1 mr-4">
                <span className="text-xs font-semibold text-zinc-200">Weekly Digest Reports</span>
                <p className="text-[10px] text-zinc-500 mt-0.5">Receive weekly AI summary and comparison stats.</p>
              </label>
              <input
                id="settings-digest"
                type="checkbox"
                checked={weeklyDigest}
                onChange={(e) => setWeeklyDigest(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </GlassCard>

        {/* Section 3: Data Export & deletion */}
        <GlassCard className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 mb-2">
            <Database className="h-4.5 w-4.5 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-200">Data Management</h3>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-xl bg-zinc-950/40 border border-white/[0.04]">
            <div>
              <span className="text-xs font-semibold text-zinc-200">Export Carbon Data</span>
              <p className="text-[10px] text-zinc-500 mt-0.5">Download your profile metrics and history logs in JSON format.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleExportData} className="shrink-0 flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" />
              <span>Export Records</span>
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
            <div>
              <span className="text-xs font-semibold text-red-400">Request Account Deletion</span>
              <p className="text-[10px] text-zinc-500 mt-0.5">Irreversibly delete your account logs and settings history.</p>
            </div>
            <Button type="button" variant="danger" size="sm" onClick={() => logout()} className="shrink-0">
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              <span>Delete Account</span>
            </Button>
          </div>
        </GlassCard>

        {/* Form Actions footer */}
        <div className="flex justify-end pt-4">
          <Button type="submit" className="px-8" loading={saving}>
            Save Configurations
          </Button>
        </div>
      </form>
    </div>
  );
}
