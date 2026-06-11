/**
 * @module validators
 * @description Zod validation schemas for CarbonMind AI.
 *
 * Provides runtime input validation and TypeScript type inference for:
 * - Authentication (login, signup)
 * - User onboarding flow
 * - Carbon activity logging
 * - Chat messages
 * - Profile updates
 *
 * All schemas export both the validator and an inferred TypeScript type.
 *
 * @example
 * ```typescript
 * import { LoginSchema, type LoginData } from "@/lib/validators";
 *
 * const result = LoginSchema.safeParse(formData);
 * if (!result.success) {
 *   console.error(result.error.issues);
 * }
 * ```
 */
import { z } from "zod/v4";

// =============================================================================
// Shared field validators (DRY)
// =============================================================================

/** Reusable email field validator */
const emailField = z
  .email("Please enter a valid email address")
  .max(254, "Email must be at most 254 characters");

/** Reusable password field validator with minimum length enforcement */
const passwordField = z
  .string()
  .min(6, "Password must be at least 6 characters")
  .max(128, "Password must be at most 128 characters");

// =============================================================================
// Authentication Schemas
// =============================================================================

/**
 * Schema for user login form validation.
 * Requires a valid email and a password.
 */
export const LoginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

/** Inferred TypeScript type for login form data */
export type LoginData = z.infer<typeof LoginSchema>;

/**
 * Schema for user signup / registration form validation.
 * Requires a display name, valid email, and a strong password.
 */
export const SignupSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be at most 100 characters")
    .trim(),
  email: emailField,
  password: passwordField,
});

/** Inferred TypeScript type for signup form data */
export type SignupData = z.infer<typeof SignupSchema>;

// =============================================================================
// Onboarding Schema
// =============================================================================

/**
 * Allowed transportation mode values for commute questions.
 */
const transportModes = [
  "car",
  "public_transit",
  "bicycle",
  "walking",
  "motorcycle",
  "electric_vehicle",
  "carpool",
  "remote",
] as const;

/**
 * Allowed diet type values.
 */
const dietTypes = [
  "omnivore",
  "pescatarian",
  "vegetarian",
  "vegan",
  "flexitarian",
] as const;

/**
 * Allowed home energy source values.
 */
const energySources = [
  "electricity",
  "natural_gas",
  "solar",
  "wind",
  "mixed",
  "other",
] as const;

/**
 * Schema for the user onboarding questionnaire.
 * Captures lifestyle data used to estimate the user's initial carbon footprint.
 */
export const OnboardingSchema = z.object({
  /** Primary mode of daily transportation */
  transportMode: z.enum(transportModes, {
    error: "Please select a transportation mode",
  }),

  /** Average daily commute distance in kilometers */
  commuteDistance: z
    .number()
    .min(0, "Commute distance cannot be negative")
    .max(500, "Commute distance seems too large — please enter km"),

  /** User's dietary preference */
  dietType: z.enum(dietTypes, {
    error: "Please select a diet type",
  }),

  /** Average monthly electricity consumption in kWh */
  electricityUsage: z
    .number()
    .min(0, "Electricity usage cannot be negative")
    .max(10000, "Please verify your electricity usage (kWh)"),

  /** Primary home energy source */
  energySource: z.enum(energySources, {
    error: "Please select an energy source",
  }),

  /** Household size (number of people) */
  householdSize: z
    .number()
    .int("Household size must be a whole number")
    .min(1, "Household size must be at least 1")
    .max(20, "Household size must be at most 20"),

  /** Whether the user recycles regularly */
  recyclesRegularly: z.boolean(),
});

/** Inferred TypeScript type for onboarding form data */
export type OnboardingData = z.infer<typeof OnboardingSchema>;

// =============================================================================
// Activity Schema
// =============================================================================

/**
 * Allowed carbon activity categories.
 */
const activityCategories = [
  "transport",
  "energy",
  "food",
  "shopping",
  "waste",
  "other",
] as const;

/**
 * Allowed measurement units for activity values.
 */
const activityUnits = [
  "km",
  "miles",
  "kWh",
  "kg",
  "lbs",
  "liters",
  "gallons",
  "hours",
  "count",
] as const;

/**
 * Schema for logging a carbon footprint activity entry.
 * Each activity has a category, numeric value, unit, and an optional note.
 */
export const ActivitySchema = z.object({
  /** Category of the carbon-producing activity */
  category: z.enum(activityCategories, {
    error: "Please select an activity category",
  }),

  /** Numeric measurement of the activity */
  value: z
    .number()
    .positive("Value must be a positive number")
    .max(100000, "Value seems too large — please double-check"),

  /** Unit of measurement for the value */
  unit: z.enum(activityUnits, {
    error: "Please select a unit of measurement",
  }),

  /** Optional note or description for the activity */
  note: z
    .string()
    .max(500, "Note must be at most 500 characters")
    .trim()
    .optional(),
});

/** Inferred TypeScript type for activity log entries */
export type ActivityData = z.infer<typeof ActivitySchema>;

// =============================================================================
// Chat Message Schema
// =============================================================================

/**
 * Schema for validating chat messages sent to the AI assistant.
 * Enforces a minimum length (non-empty) and a maximum to prevent abuse.
 */
export const ChatMessageSchema = z.object({
  /** The user's chat message text */
  text: z
    .string()
    .min(1, "Message cannot be empty")
    .max(2000, "Message must be at most 2,000 characters")
    .trim(),
});

/** Inferred TypeScript type for chat message payloads */
export type ChatMessageData = z.infer<typeof ChatMessageSchema>;

// =============================================================================
// Profile Update Schema
// =============================================================================

/**
 * Schema for updating a user's profile.
 * All fields are optional — only provided fields are updated (PATCH semantics).
 */
export const ProfileUpdateSchema = z.object({
  /** Updated display name */
  displayName: z
    .string()
    .min(1, "Display name cannot be empty")
    .max(100, "Display name must be at most 100 characters")
    .trim()
    .optional(),

  /** Updated avatar / profile photo URL */
  photoURL: z
    .url("Please enter a valid URL")
    .max(2048, "Photo URL is too long")
    .optional(),

  /** User's location (city / region) for localized carbon data */
  location: z
    .string()
    .max(200, "Location must be at most 200 characters")
    .trim()
    .optional(),

  /** Short bio or status message */
  bio: z
    .string()
    .max(300, "Bio must be at most 300 characters")
    .trim()
    .optional(),
});

/** Inferred TypeScript type for profile update payloads */
export type ProfileUpdateData = z.infer<typeof ProfileUpdateSchema>;
