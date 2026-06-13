/**
 * @module types
 * @description Core TypeScript type definitions for CarbonMind AI.
 * All interfaces use strict typing and avoid `any`.
 */

/** Firestore Timestamp representation for client-side use */
export type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
  toDate: () => Date;
};

/** Represents either a Firestore Timestamp or a JS Date */
export type TimestampLike = FirestoreTimestamp | Date | string;

/** User preference settings */
export interface UserPreferences {
  /** UI theme preference */
  theme: "dark" | "light" | "system";
  /** Whether push notifications are enabled */
  notifications: boolean;
  /** Whether weekly carbon digest emails are enabled */
  weeklyDigest: boolean;
}

/** User profile stored in Firestore users/{uid} */
export interface UserProfile {
  /** Firebase Auth UID */
  uid: string;
  /** User display name */
  name: string;
  /** User email address */
  email: string;
  /** Google profile photo URL */
  photoURL: string | null;
  /** Account creation timestamp */
  createdAt: TimestampLike;
  /** User's country of residence */
  country: string;
  /** User's age */
  age: number;
  /** User's occupation */
  occupation: string;
  /** Consecutive daily logging streak */
  streak: number;
  /** Accumulated eco points */
  points: number;
  /** Monthly carbon emission goal in kg CO2 */
  goal: number;
  /** User preferences object */
  preferences: UserPreferences;
  /** Aggregate carbon score (0-100, higher = greener) */
  carbonScore: number;
  /** Whether the user has completed onboarding */
  onboarded: boolean;
  /** Monthly carbon emissions in kg CO2 */
  monthlyCarbon?: number;
  /** Last activity timestamp */
  lastActivityAt?: TimestampLike;
}

/** Parsed transport item from AI log parsing */
export interface ParsedTransport {
  mode: string;
  distanceKm: number;
  carbon: number;
}

/** Parsed food item from AI log parsing */
export interface ParsedFood {
  type: string;
  servings: number;
  carbon: number;
}

/** Parsed electricity usage from AI log parsing */
export interface ParsedElectricity {
  usageHours: number;
  carbon: number;
}

/** Parsed shopping item from AI log parsing */
export interface ParsedShopping {
  category: string;
  count: number;
  carbon: number;
}

/** Structured parsed items from daily log */
export interface ParsedItems {
  transport?: ParsedTransport[];
  food?: ParsedFood[];
  electricity?: ParsedElectricity;
  shopping?: ParsedShopping[];
}

/** Daily carbon log entry stored in Firestore daily_logs collection */
export interface DailyLog {
  /** Document ID */
  id: string;
  /** Owner user ID */
  userId: string;
  /** Date string in YYYY-MM-DD format */
  date: string;
  /** Original natural language input */
  rawText: string;
  /** AI-parsed structured carbon items */
  parsedItems: ParsedItems;
  /** Total carbon emissions in kg CO2 */
  totalCarbon: number;
  /** Creation timestamp */
  createdAt: TimestampLike;
}

/** Carbon activity categories */
export type ActivityCategory =
  | "transport"
  | "food"
  | "electricity"
  | "shopping"
  | "water"
  | "waste"
  | "lifestyle";

/** Individual carbon activity record */
export interface Activity {
  /** Document ID */
  id: string;
  /** Owner user ID */
  userId: string;
  /** Activity category */
  category: ActivityCategory;
  /** Numeric value of the activity */
  value: number;
  /** Unit of measurement (km, kWh, servings, etc.) */
  unit: string;
  /** Carbon emissions in kg CO2 */
  carbonEmit: number;
  /** Activity date */
  date: TimestampLike;
  /** Optional descriptive note */
  note?: string;
}

/** Goal status values */
export type GoalStatus = "active" | "completed" | "failed";

/** Goal category values */
export type GoalCategory =
  | "transport"
  | "food"
  | "electricity"
  | "shopping"
  | "water"
  | "waste"
  | "general";

/** Eco-friendly goal set by the user */
export interface EcoGoal {
  /** Document ID */
  id: string;
  /** Owner user ID */
  userId: string;
  /** Goal title */
  title: string;
  /** Related activity category */
  category: GoalCategory;
  /** Target reduction in kg CO2 */
  targetValue: number;
  /** Current reduction achieved in kg CO2 */
  currentValue: number;
  /** Goal deadline */
  deadline: TimestampLike;
  /** Current goal status */
  status: GoalStatus;
  /** Creation timestamp */
  createdAt: TimestampLike;
}

/** User achievement / badge */
export interface Achievement {
  /** Document ID */
  id: string;
  /** Owner user ID */
  userId: string;
  /** Unique badge identifier */
  badgeId: string;
  /** Achievement title */
  title: string;
  /** Achievement description */
  description: string;
  /** When the achievement was unlocked */
  unlockedAt: TimestampLike;
}

/** Leaderboard entry for ranking display */
export interface LeaderboardEntry {
  /** User ID */
  userId: string;
  /** Display name */
  name: string;
  /** Profile photo URL */
  photoURL: string | null;
  /** Total eco points */
  points: number;
  /** Current streak */
  streak: number;
  /** Carbon score (0-100) */
  carbonScore: number;
  /** Computed level based on points */
  level: number;
}

/** Chat message in AI Coach conversation */
export interface ChatMessage {
  /** Message ID */
  id: string;
  /** Message sender role */
  role: "user" | "assistant";
  /** Message text content */
  content: string;
  /** Message timestamp */
  timestamp: TimestampLike;
}

/** Category breakdown for analytics */
export interface CategoryBreakdown {
  /** Category name */
  category: ActivityCategory;
  /** Total carbon in kg CO2 */
  carbon: number;
  /** Percentage of total */
  percentage: number;
  /** Display color */
  color: string;
}

/** Weekly report generated by a scheduled backend job */
export interface WeeklyReport {
  /** Document ID */
  id: string;
  /** Owner user ID */
  userId: string;
  /** Week ending date */
  weekEnding: TimestampLike;
  /** Total carbon for the week in kg CO2 */
  totalCarbon: number;
  /** Category breakdown */
  categoryBreakdown: Record<string, number>;
  /** Number of activities logged */
  activityCount: number;
  /** Creation timestamp */
  createdAt: TimestampLike;
}

/** Carbon Twin simulation parameters */
export interface TwinSimulation {
  /** Days per week using transit instead of car */
  transitSwapDays: number;
  /** Hours of AC reduction per day */
  acReductionHours: number;
  /** Vegetarian meal swaps per week */
  vegMealSwaps: number;
  /** Renewable energy offset percentage */
  renewableOffset: number;
  /** Whether user switches to EV */
  evSwitch: boolean;
}

/** Carbon Twin simulation results */
export interface TwinResults {
  /** Current monthly carbon in kg CO2 */
  currentCarbon: number;
  /** Projected monthly carbon in kg CO2 */
  projectedCarbon: number;
  /** Monthly savings in kg CO2 */
  monthlySavings: number;
  /** Estimated money saved per month */
  moneySaved: number;
  /** Trees equivalent per year */
  treesEquivalent: number;
  /** Projected carbon score improvement */
  scoreImprovement: number;
  /** Yearly carbon avoided in tonnes */
  yearlyAvoided: number;
}

/** API response types */
export interface AIParseResponse {
  transport: ParsedTransport[];
  food: ParsedFood[];
  electricity: ParsedElectricity | null;
  shopping: ParsedShopping[];
  totalCarbon: number;
}

export interface AIChatResponse {
  response: string;
}

/** Audit log entry for security tracking */
export interface AuditLogEntry {
  /** User who performed the action */
  userId: string;
  /** Action performed */
  action: string;
  /** Additional details */
  details?: Record<string, unknown>;
  /** Timestamp */
  timestamp: TimestampLike;
}
