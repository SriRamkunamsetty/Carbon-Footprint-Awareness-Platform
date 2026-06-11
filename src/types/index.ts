import { Timestamp } from "firebase/firestore";

export interface UserPreferences {
  theme: "dark" | "light" | "system";
  notifications: boolean;
  weeklyDigest: boolean;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  photoURL: string | null;
  createdAt: any; // Timestamp or Date
  country: string;
  age: number;
  occupation: string;
  streak: number;
  points: number;
  goal: number; // monthly carbon limit target in kg CO2
  preferences: UserPreferences;
  carbonScore: number;
  onboarded: boolean;
}

export interface DailyLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  rawText: string;
  parsedItems: {
    transport?: {
      mode: string;
      distanceKm: number;
      carbon: number;
    }[];
    food?: {
      type: string;
      servings: number;
      carbon: number;
    }[];
    electricity?: {
      usageHours: number;
      carbon: number;
    };
    shopping?: {
      category: string;
      count: number;
      carbon: number;
    }[];
  };
  totalCarbon: number;
  createdAt: any;
}

export interface Activity {
  id: string;
  userId: string;
  category: "transport" | "food" | "electricity" | "shopping" | "water" | "waste" | "lifestyle";
  value: number;
  unit: string;
  carbonEmit: number;
  date: any; // Timestamp
  note?: string;
}

export interface EcoGoal {
  id: string;
  userId: string;
  title: string;
  category: "transport" | "food" | "electricity" | "shopping" | "water" | "waste" | "general";
  targetValue: number; // kg CO2 reduction
  currentValue: number; // kg CO2 reduction achieved
  deadline: any; // Timestamp
  status: "active" | "completed" | "failed";
  createdAt: any;
}

export interface Achievement {
  id: string;
  userId: string;
  badgeId: string;
  title: string;
  description: string;
  unlockedAt: any; // Timestamp
}

export interface LeaderboardEntry {
  userId: string;
  name: string;
  photoURL: string | null;
  points: number;
  streak: number;
  carbonScore: number;
  level: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: any;
}
