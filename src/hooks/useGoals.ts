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
  serverTimestamp,
  type Unsubscribe,
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
 * Subscribes to the user's goal documents via `onSnapshot` and provides
 * CRUD operations (add, update, delete) and a convenience method to mark
 * a goal as completed. Automatically cleans up subscriptions on unmount.
 */
export function useGoals(userId: string | null): UseGoalsReturn {
  const isAuthenticated = Boolean(userId);
  const [goals, setGoals] = useState<EcoGoal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const unsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      return;
    }

    queueMicrotask(() => {
      if (!isMounted) {
        return;
      }

      setLoading(true);
      setError(null);
    });

    const goalsRef = collection(db, "goals");
    const goalsQuery = query(
      goalsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    if (unsubRef.current) {
      unsubRef.current();
    }

    const unsubscribe = onSnapshot(
      goalsQuery,
      (snapshot) => {
        if (!isMounted) {
          return;
        }

        const docs: EcoGoal[] = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<EcoGoal, "id">),
        }));

        setGoals(docs);
        setLoading(false);
      },
      (subscriptionError) => {
        if (!isMounted) {
          return;
        }

        setError(subscriptionError.message);
        setLoading(false);
      }
    );

    unsubRef.current = unsubscribe;

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [userId]);

  const addGoal = useCallback(
    async (data: Omit<EcoGoal, "id" | "createdAt" | "status" | "currentValue">): Promise<string> => {
      if (!userId) {
        throw new Error("Cannot add goal: no authenticated user");
      }

      const goalsRef = collection(db, "goals");
      const docRef = await addDoc(goalsRef, {
        ...data,
        currentValue: 0,
        status: "active",
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    },
    [userId]
  );

  const updateGoal = useCallback(
    async (goalId: string, data: Partial<EcoGoal>): Promise<void> => {
      if (!userId) {
        throw new Error("Cannot update goal: no authenticated user");
      }

      const goalRef = doc(db, "goals", goalId);
      await updateDoc(goalRef, data);
    },
    [userId]
  );

  const deleteGoal = useCallback(
    async (goalId: string): Promise<void> => {
      if (!userId) {
        throw new Error("Cannot delete goal: no authenticated user");
      }

      const goalRef = doc(db, "goals", goalId);
      await deleteDoc(goalRef);
    },
    [userId]
  );

  const completeGoal = useCallback(
    async (goalId: string): Promise<void> => {
      if (!userId) {
        throw new Error("Cannot complete goal: no authenticated user");
      }

      const goal = goals.find((entry) => entry.id === goalId);
      const goalRef = doc(db, "goals", goalId);

      await updateDoc(goalRef, {
        status: "completed",
        currentValue: goal?.targetValue ?? 0,
      });
    },
    [userId, goals]
  );

  return {
    goals: isAuthenticated ? goals : [],
    loading: isAuthenticated ? loading : false,
    error: isAuthenticated ? error : null,
    addGoal,
    updateGoal,
    deleteGoal,
    completeGoal,
  };
}
