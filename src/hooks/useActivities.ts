import { useState, useEffect, useCallback, useRef } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  DocumentSnapshot,
  Timestamp,
  serverTimestamp,
  Unsubscribe,
  QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Activity } from "@/types";

/**
 * Filter configuration for querying activities.
 */
export interface ActivityFilter {
  /** Filter activities on or after this date */
  startDate?: Date;
  /** Filter activities on or before this date */
  endDate?: Date;
  /** Filter by activity category */
  category?: Activity["category"];
}

/**
 * Options for the useActivities hook.
 */
export interface UseActivitiesOptions {
  /** The authenticated user's UID */
  userId: string | null;
  /** Optional filters to apply to the activity query */
  filter?: ActivityFilter;
  /** Number of activities to fetch per page (default: 20) */
  pageSize?: number;
}

/**
 * Return value of the useActivities hook.
 */
export interface UseActivitiesReturn {
  /** The current list of activities */
  activities: Activity[];
  /** Whether the initial data is loading */
  loading: boolean;
  /** Error message if the subscription or operation failed */
  error: string | null;
  /** Add a new activity to Firestore */
  addActivity: (data: Omit<Activity, "id">) => Promise<string>;
  /** Delete an activity by its ID */
  deleteActivity: (activityId: string) => Promise<void>;
  /** Manually refresh the subscription */
  refresh: () => void;
  /** Whether more activities are available beyond the current page */
  hasMore: boolean;
  /** Load the next page of activities */
  loadMore: () => void;
}

/**
 * Custom hook that subscribes to a user's activities from Firestore in real-time.
 *
 * Provides filtering by date range and category, cursor-based pagination,
 * and CRUD operations. Automatically cleans up Firestore subscriptions on
 * unmount or when dependencies change.
 *
 * @param options - Configuration including userId, filters, and page size
 * @returns An object containing activities, loading/error state, and CRUD methods
 *
 * @example
 * ```tsx
 * const { activities, loading, addActivity, deleteActivity, hasMore, loadMore } = useActivities({
 *   userId: user?.uid ?? null,
 *   filter: { category: "transport" },
 *   pageSize: 10,
 * });
 * ```
 */
export function useActivities(options: UseActivitiesOptions): UseActivitiesReturn {
  const { userId, filter, pageSize = 20 } = options;

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState<number>(0);

  const unsubRef = useRef<Unsubscribe | null>(null);

  /**
   * Sets up the Firestore real-time subscription based on current filters and pagination.
   */
  useEffect(() => {
    const active = true;

    if (!userId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (active) setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const colRef = collection(db, "users", userId, "activities");
    const constraints: QueryConstraint[] = [
      where("userId", "==", userId),
      orderBy("date", "desc"),
    ];

    if (filter?.category) {
      constraints.push(where("category", "==", filter.category));
    }

    if (filter?.startDate) {
      constraints.push(where("date", ">=", Timestamp.fromDate(filter.startDate)));
    }

    if (filter?.endDate) {
      constraints.push(where("date", "<=", Timestamp.fromDate(filter.endDate)));
    }

    // Fetch one extra to determine if there are more pages
    constraints.push(limit(pageSize + 1));

    const q = query(colRef, ...constraints);

    // Clean up any previous subscription
    if (unsubRef.current) {
      unsubRef.current();
    }

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as Omit<Activity, "id">),
        }));

        if (docs.length > pageSize) {
          setHasMore(true);
          setLastDoc(snapshot.docs[pageSize - 1]);
          setActivities(docs.slice(0, pageSize));
        } else {
          setHasMore(false);
          setLastDoc(snapshot.docs[snapshot.docs.length - 1] ?? null);
          setActivities(docs);
        }

        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    unsubRef.current = unsub;

    return () => {
      if (unsub) unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, filter?.category, filter?.startDate?.getTime(), filter?.endDate?.getTime(), pageSize, refreshKey]);

  /**
   * Loads the next page of activities by fetching documents after the last visible one.
   */
  const loadMore = useCallback(async () => {
    if (!userId || !lastDoc || !hasMore) return;

    const colRef = collection(db, "users", userId, "activities");
    const constraints: QueryConstraint[] = [
      where("userId", "==", userId),
      orderBy("date", "desc"),
    ];

    if (filter?.category) {
      constraints.push(where("category", "==", filter.category));
    }

    if (filter?.startDate) {
      constraints.push(where("date", ">=", Timestamp.fromDate(filter.startDate)));
    }

    if (filter?.endDate) {
      constraints.push(where("date", "<=", Timestamp.fromDate(filter.endDate)));
    }

    constraints.push(startAfter(lastDoc), limit(pageSize + 1));

    const q = query(colRef, ...constraints);
    const snapshot = await getDocs(q);

    const newDocs = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<Activity, "id">),
    }));

    if (newDocs.length > pageSize) {
      setHasMore(true);
      setLastDoc(snapshot.docs[pageSize - 1]);
      setActivities((prev) => [...prev, ...newDocs.slice(0, pageSize)]);
    } else {
      setHasMore(false);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] ?? null);
      setActivities((prev) => [...prev, ...newDocs]);
    }
  }, [userId, lastDoc, hasMore, filter, pageSize]);

  /**
   * Adds a new activity document to the user's activities subcollection.
   */
  const addActivity = useCallback(
    async (data: Omit<Activity, "id">): Promise<string> => {
      if (!userId) {
        throw new Error("Cannot add activity: no authenticated user");
      }

      const colRef = collection(db, "users", userId, "activities");
      const docRef = await addDoc(colRef, {
        ...data,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    },
    [userId]
  );

  /**
   * Deletes an activity document by its ID from the user's activities subcollection.
   */
  const deleteActivity = useCallback(
    async (activityId: string): Promise<void> => {
      if (!userId) {
        throw new Error("Cannot delete activity: no authenticated user");
      }

      const docRef = doc(db, "users", userId, "activities", activityId);
      await deleteDoc(docRef);
    },
    [userId]
  );

  /**
   * Forces a re-subscription to refresh data.
   */
  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  return {
    activities,
    loading,
    error,
    addActivity,
    deleteActivity,
    refresh,
    hasMore,
    loadMore,
  };
}
