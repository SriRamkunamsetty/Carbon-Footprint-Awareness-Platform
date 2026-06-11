import { useState, useEffect, useCallback, useRef } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
  serverTimestamp,
  Unsubscribe,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { EcoGoal } from "@/types";

/**
 * Return value of the useGoals hook.
 */
export interface UseGoalsReturn {
  /** The current list of goals */
  goals: EcoGoal[];
  /** Whether the initial data is loading */
  loading: boolean;
  /** Error message if the subscription or operation failed */
  error: string | null;
  /** Add a new goal to Firestore */
  addGoal: (data: Omit<EcoGoal, "id" | "createdAt" | "status" | "currentValue">) => Promise<string>;
  /** Update an existing goal by its ID */
  updateGoal: (goalId: string, data: Partial<EcoGoal>) => Promise<void>;
  /** Delete a goal by its ID */
  deleteGoal: (goalId: string) => Promise<void>;
  /** Mark a goal as completed */
  completeGoal: (goalId: string) => Promise<void>;
}

/**
 * Custom hook for managing user eco-goals in Firestore with real-time updates.
 *
 * Subscribes to the user's goals subcollection via `onSnapshot` and provides
 * CRUD operations (add, update, delete) and a convenience method to mark
 * a goal as completed. Automatically cleans up subscriptions on unmount.
 *
 * @param userId - The authenticated user's UID, or null if not logged in
 * @returns An object containing goals, loading/error state, and mutation methods
 *
 * @example
 * ```tsx
 * const { goals, loading, addGoal, completeGoal } = useGoals(user?.uid ?? null);
 *
 * await addGoal({
 *   userId: user.uid,
 *   title: "Bike to work",
 *   category: "transport",
 *   targetValue: 50,
 *   deadline: Timestamp.fromDate(new Date("2026-07-01")),
 * });
 * ```
 */
export function useGoals(userId: string | null): UseGoalsReturn {
  const [goals, setGoals] = useState<EcoGoal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const unsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!userId) {
      setGoals([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const colRef = collection(db, "users", userId, "goals");
    const q = query(
      colRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    // Clean up any previous subscription
    if (unsubRef.current) {
      unsubRef.current();
    }

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs: EcoGoal[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<EcoGoal, "id">),
        }));
        setGoals(docs);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    unsubRef.current = unsub;

    return () => {
      unsub();
    };
  }, [userId]);

  /**
   * Adds a new goal document to the user's goals subcollection.
   * Sets initial status to "active" and currentValue to 0.
   */
  const addGoal = useCallback(
    async (data: Omit<EcoGoal, "id" | "createdAt" | "status" | "currentValue">): Promise<string> => {
      if (!userId) {
        throw new Error("Cannot add goal: no authenticated user");
      }

      const colRef = collection(db, "users", userId, "goals");
      const docRef = await addDoc(colRef, {
        ...data,
        currentValue: 0,
        status: "active",
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    },
    [userId]
  );

  /**
   * Updates an existing goal document with partial data.
   */
  const updateGoal = useCallback(
    async (goalId: string, data: Partial<EcoGoal>): Promise<void> => {
      if (!userId) {
        throw new Error("Cannot update goal: no authenticated user");
      }

      const docRef = doc(db, "users", userId, "goals", goalId);
      await updateDoc(docRef, data);
    },
    [userId]
  );

  /**
   * Deletes a goal document by its ID.
   */
  const deleteGoal = useCallback(
    async (goalId: string): Promise<void> => {
      if (!userId) {
        throw new Error("Cannot delete goal: no authenticated user");
      }

      const docRef = doc(db, "users", userId, "goals", goalId);
      await deleteDoc(docRef);
    },
    [userId]
  );

  /**
   * Marks a goal as completed by setting status to "completed"
   * and currentValue to the targetValue.
   */
  const completeGoal = useCallback(
    async (goalId: string): Promise<void> => {
      if (!userId) {
        throw new Error("Cannot complete goal: no authenticated user");
      }

      const goal = goals.find((g) => g.id === goalId);
      const docRef = doc(db, "users", userId, "goals", goalId);

      await updateDoc(docRef, {
        status: "completed",
        currentValue: goal?.targetValue ?? 0,
      });
    },
    [userId, goals]
  );

  return {
    goals,
    loading,
    error,
    addGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
  };
}
