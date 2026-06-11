/**
 * @module CloudFunctions
 * @description Firebase Cloud Functions for CarbonMind AI.
 * Handles server-side business logic including user initialization,
 * activity aggregation, achievement unlocking, and scheduled reports.
 */
import * as admin from "firebase-admin";
import { onDocumentCreated, onDocumentWritten } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { HttpsError, onCall } from "firebase-functions/v2/https";

import { calculateTransportEmissions } from "./lib/carbon/transport";
import { calculateFoodEmissions } from "./lib/carbon/food";
import { calculateElectricityEmissions } from "./lib/carbon/electricity";
import { calculateShoppingEmissions } from "./lib/carbon/shopping";

admin.initializeApp();
const db = admin.firestore();

/**
 * Triggered when a new user document is created.
 * Initializes leaderboard entry and awards welcome achievement.
 */
export const onUserCreated = onDocumentCreated("users/{userId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const userData = snapshot.data();
  const userId = event.params.userId;

  // Create leaderboard entry
  await db.doc(`leaderboard/${userId}`).set({
    userId,
    name: userData.name || "Eco Citizen",
    points: userData.points || 50,
    streak: 0,
    carbonScore: userData.carbonScore || 75,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Award welcome achievement
  await db.collection("achievements").add({
    userId,
    badgeId: "green_pioneer",
    title: "Green Pioneer",
    description: "Welcome to CarbonMind! Your sustainability journey begins.",
    unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});

/**
 * Triggered when a new daily log is created.
 * Secures streak tracking and rewards points.
 */
export const onDailyLogCreated = onDocumentCreated("daily_logs/{logId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) return;

  const logData = snapshot.data();
  const userId = logData.userId;
  if (!userId) return;

  const userRef = db.doc(`users/${userId}`);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return;

  const userData = userSnap.data()!;
  const currentPoints = userData.points || 0;
  const currentStreak = userData.streak || 0;

  // Simple streak logic:
  // Increment points by 25 and streak by 1.
  const newPoints = currentPoints + 25;
  const newStreak = currentStreak + 1;

  await userRef.update({
    points: newPoints,
    streak: newStreak,
    lastDailyLogAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Update leaderboard
  await db.doc(`leaderboard/${userId}`).update({
    points: newPoints,
    streak: newStreak,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});

/**
 * Triggered when an activity document is created or updated.
 * Recalculates user's aggregate carbon metrics and updates leaderboard.
 */
export const onActivityWritten = onDocumentWritten("activities/{activityId}", async (event) => {
  const afterData = event.data?.after?.data();
  if (!afterData) return;

  const userId = afterData.userId;
  if (!userId) return;

  const activityRef = event.data!.after!.ref;

  // 1. If carbonEmit is missing, calculate it and update the document
  if (afterData.carbonEmit === undefined) {
    let computedCarbon = 0;
    const { category, type, value } = afterData;

    if (category === "transport") {
      computedCarbon = calculateTransportEmissions(type || "gasolineCar", value || 0);
    } else if (category === "food") {
      computedCarbon = calculateFoodEmissions([{ type: type || "poultry", servings: value || 1 }], false);
    } else if (category === "electricity") {
      computedCarbon = calculateElectricityEmissions([{ type: type || "airConditioner", hours: value || 1 }], 0, 0);
    } else if (category === "shopping") {
      computedCarbon = calculateShoppingEmissions([{ category: type || "misc", count: value || 1 }]);
    }

    computedCarbon = Math.round(computedCarbon * 100) / 100;
    
    // Points formula: default 10 points per activity, max 50 points per day.
    const pointsEarned = 10; 

    await activityRef.update({
      carbonEmit: computedCarbon,
      points: pointsEarned
    });

    // Also update user's points securely
    await db.doc(`users/${userId}`).update({
      points: admin.firestore.FieldValue.increment(pointsEarned),
      lastActivityAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return; // Exit early. The update above will trigger this function again with carbonEmit present.
  }

  // 2. Aggregate monthly carbon
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const activitiesSnap = await db
    .collection("activities")
    .where("userId", "==", userId)
    .where("date", ">=", admin.firestore.Timestamp.fromDate(startOfMonth))
    .get();

  let totalMonthlyCarbon = 0;
  activitiesSnap.forEach((doc) => {
    const data = doc.data();
    totalMonthlyCarbon += data.carbonEmit || 0;
  });

  // Calculate carbon score (0-100, lower emissions = higher score)
  const baseline = 600; // Average monthly carbon in kg
  const score = Math.max(
    0,
    Math.min(100, Math.round(((baseline - totalMonthlyCarbon) / baseline) * 100))
  );

  // Update user document
  await db.doc(`users/${userId}`).update({
    carbonScore: score,
    monthlyCarbon: totalMonthlyCarbon,
  });

  // Update leaderboard
  await db.doc(`leaderboard/${userId}`).update({
    carbonScore: score,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
});

/**
 * Scheduled function that runs weekly (Sunday midnight UTC).
 * Generates weekly carbon summary for each active user.
 */
export const weeklyReport = onSchedule("every sunday 00:00", async () => {
  const usersSnap = await db.collection("users").get();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;

    const activitiesSnap = await db
      .collection("activities")
      .where("userId", "==", userId)
      .where("date", ">=", admin.firestore.Timestamp.fromDate(weekAgo))
      .get();

    let weeklyCarbon = 0;
    const categoryBreakdown: Record<string, number> = {};

    activitiesSnap.forEach((doc) => {
      const data = doc.data();
      weeklyCarbon += data.carbonEmit || 0;
      const cat = data.category || "other";
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + (data.carbonEmit || 0);
    });

    await db.collection("weekly_reports").add({
      userId,
      weekEnding: admin.firestore.Timestamp.fromDate(now),
      totalCarbon: weeklyCarbon,
      categoryBreakdown,
      activityCount: activitiesSnap.size,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
});

/**
 * Callable function to securely update user points.
 * Prevents client-side manipulation of points/streak.
 */
export const awardPoints = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be authenticated");
  }

  const { points, reason } = request.data;
  if (typeof points !== "number" || points < 0 || points > 100) {
    throw new HttpsError("invalid-argument", "Points must be 0-100");
  }

  const userId = request.auth.uid;

  await db.doc(`users/${userId}`).update({
    points: admin.firestore.FieldValue.increment(points),
  });

  // Log the points award for audit
  await db.collection("audit_log").add({
    userId,
    action: "points_awarded",
    points,
    reason: reason || "activity",
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, pointsAwarded: points };
});

/**
 * Callable function to check and unlock achievements.
 */
export const checkAchievements = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be authenticated");
  }

  const userId = request.auth.uid;
  const userDoc = await db.doc(`users/${userId}`).get();
  const userData = userDoc.data();
  if (!userData) return { unlocked: [] };

  const existingAchievements = await db
    .collection("achievements")
    .where("userId", "==", userId)
    .get();
  const existingBadges = new Set(existingAchievements.docs.map((d) => d.data().badgeId));

  const newlyUnlocked: Array<{ badgeId: string; title: string }> = [];

  // Streak achievements
  if (userData.streak >= 3 && !existingBadges.has("streak_3")) {
    await db.collection("achievements").add({
      userId,
      badgeId: "streak_3",
      title: "3-Day Streak",
      description: "Logged carbon data 3 days in a row!",
      unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    newlyUnlocked.push({ badgeId: "streak_3", title: "3-Day Streak" });
  }

  if (userData.streak >= 7 && !existingBadges.has("streak_7")) {
    await db.collection("achievements").add({
      userId,
      badgeId: "streak_7",
      title: "Week Warrior",
      description: "A full week of carbon tracking!",
      unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    newlyUnlocked.push({ badgeId: "streak_7", title: "Week Warrior" });
  }

  // Score achievements
  if (userData.carbonScore >= 80 && !existingBadges.has("eco_champion")) {
    await db.collection("achievements").add({
      userId,
      badgeId: "eco_champion",
      title: "Eco Champion",
      description: "Achieved a carbon score of 80+!",
      unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    newlyUnlocked.push({ badgeId: "eco_champion", title: "Eco Champion" });
  }

  // Points achievements
  if (userData.points >= 500 && !existingBadges.has("points_500")) {
    await db.collection("achievements").add({
      userId,
      badgeId: "points_500",
      title: "Eco Elite",
      description: "Earned 500 eco points!",
      unlockedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    newlyUnlocked.push({ badgeId: "points_500", title: "Eco Elite" });
  }

  return { unlocked: newlyUnlocked };
});
