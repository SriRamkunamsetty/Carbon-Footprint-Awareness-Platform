import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentData,
  DocumentReference,
  QueryConstraint,
  WhereFilterOp,
  OrderByDirection,
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe,
  serverTimestamp,
  FirestoreError,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

/**
 * Typed error class for Firestore operations.
 * Wraps the original FirestoreError with additional context.
 */
export class FirestoreServiceError extends Error {
  /** The Firestore error code, if available */
  public readonly code: string;
  /** The collection path that was being accessed */
  public readonly collectionPath: string;

  constructor(message: string, code: string, collectionPath: string) {
    super(message);
    this.name = "FirestoreServiceError";
    this.code = code;
    this.collectionPath = collectionPath;
  }
}

/**
 * Represents a single `where` clause for building Firestore queries.
 */
export interface WhereClause {
  /** The field path to filter on */
  field: string;
  /** The comparison operator */
  operator: WhereFilterOp;
  /** The value to compare against */
  value: unknown;
}

/**
 * Represents an `orderBy` clause for building Firestore queries.
 */
export interface OrderByClause {
  /** The field path to order by */
  field: string;
  /** The sort direction (defaults to 'asc') */
  direction?: OrderByDirection;
}

/**
 * Configuration object for building Firestore queries.
 * Supports filtering, ordering, pagination, and limiting.
 */
export interface QueryConfig {
  /** Array of where filter clauses */
  whereClauses?: WhereClause[];
  /** Array of orderBy clauses */
  orderByClauses?: OrderByClause[];
  /** Maximum number of documents to return */
  limitCount?: number;
  /** Document snapshot to start after (for cursor-based pagination) */
  startAfterDoc?: DocumentSnapshot;
}

/**
 * Builds an array of Firestore QueryConstraints from a QueryConfig object.
 *
 * @param config - The query configuration containing filters, ordering, limit, and pagination
 * @returns An array of QueryConstraint objects ready to be spread into a Firestore query
 */
function buildConstraints(config: QueryConfig): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];

  if (config.whereClauses) {
    for (const clause of config.whereClauses) {
      constraints.push(where(clause.field, clause.operator, clause.value));
    }
  }

  if (config.orderByClauses) {
    for (const clause of config.orderByClauses) {
      constraints.push(orderBy(clause.field, clause.direction ?? "asc"));
    }
  }

  if (config.limitCount) {
    constraints.push(limit(config.limitCount));
  }

  if (config.startAfterDoc) {
    constraints.push(startAfter(config.startAfterDoc));
  }

  return constraints;
}

/**
 * Generic Firestore CRUD service.
 *
 * Provides typed methods for reading, writing, and subscribing to
 * Firestore documents and collections. All operations are scoped
 * to the collection path provided at construction time.
 *
 * @example
 * ```ts
 * const activityService = new FirestoreService<Activity>("activities");
 * const activity = await activityService.getDocument("abc123");
 * ```
 */
export class FirestoreService<T extends DocumentData> {
  /** The Firestore collection path this service operates on */
  private readonly collectionPath: string;

  /**
   * Creates a new FirestoreService instance.
   *
   * @param collectionPath - The Firestore collection path (e.g. "users", "users/uid/activities")
   */
  constructor(collectionPath: string) {
    this.collectionPath = collectionPath;
  }

  /**
   * Retrieves a single document by its ID.
   *
   * @param docId - The document ID to retrieve
   * @returns The document data with its `id` field, or `null` if not found
   * @throws {FirestoreServiceError} If the Firestore operation fails
   *
   * @example
   * ```ts
   * const user = await userService.getDocument("user123");
   * ```
   */
  async getDocument(docId: string): Promise<(T & { id: string }) | null> {
    try {
      const docRef: DocumentReference = doc(db, this.collectionPath, docId);
      const snapshot: DocumentSnapshot = await getDoc(docRef);

      if (!snapshot.exists()) {
        return null;
      }

      return { id: snapshot.id, ...(snapshot.data() as T) };
    } catch (error) {
      const fsError = error as FirestoreError;
      throw new FirestoreServiceError(
        `Failed to get document "${docId}" from "${this.collectionPath}": ${fsError.message}`,
        fsError.code ?? "unknown",
        this.collectionPath
      );
    }
  }

  /**
   * Retrieves multiple documents from the collection, optionally filtered and ordered.
   *
   * @param config - Optional query configuration for filtering, ordering, limiting, and pagination
   * @returns An array of documents, each including its `id` field
   * @throws {FirestoreServiceError} If the Firestore operation fails
   *
   * @example
   * ```ts
   * const activities = await activityService.getDocuments({
   *   whereClauses: [{ field: "userId", operator: "==", value: uid }],
   *   orderByClauses: [{ field: "date", direction: "desc" }],
   *   limitCount: 20,
   * });
   * ```
   */
  async getDocuments(config?: QueryConfig): Promise<(T & { id: string })[]> {
    try {
      const colRef = collection(db, this.collectionPath);
      const constraints = config ? buildConstraints(config) : [];
      const q = query(colRef, ...constraints);
      const snapshot: QuerySnapshot = await getDocs(q);

      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as T),
      }));
    } catch (error) {
      const fsError = error as FirestoreError;
      throw new FirestoreServiceError(
        `Failed to get documents from "${this.collectionPath}": ${fsError.message}`,
        fsError.code ?? "unknown",
        this.collectionPath
      );
    }
  }

  /**
   * Adds a new document to the collection.
   *
   * Automatically sets a `createdAt` server timestamp on the document.
   *
   * @param data - The document data to add (without the `id` field)
   * @returns The auto-generated document ID
   * @throws {FirestoreServiceError} If the Firestore operation fails
   *
   * @example
   * ```ts
   * const newId = await activityService.addDocument({
   *   userId: "user123",
   *   category: "transport",
   *   value: 15,
   *   unit: "km",
   *   carbonEmit: 3.15,
   *   date: Timestamp.now(),
   * });
   * ```
   */
  async addDocument(data: Omit<T, "id">): Promise<string> {
    try {
      const colRef = collection(db, this.collectionPath);
      const docRef = await addDoc(colRef, {
        ...data,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      const fsError = error as FirestoreError;
      throw new FirestoreServiceError(
        `Failed to add document to "${this.collectionPath}": ${fsError.message}`,
        fsError.code ?? "unknown",
        this.collectionPath
      );
    }
  }

  /**
   * Updates an existing document by its ID with a partial data payload.
   *
   * @param docId - The document ID to update
   * @param data - A partial object containing only the fields to update
   * @throws {FirestoreServiceError} If the Firestore operation fails
   *
   * @example
   * ```ts
   * await userService.updateDocument("user123", { points: 500, streak: 7 });
   * ```
   */
  async updateDocument(docId: string, data: Partial<T>): Promise<void> {
    try {
      const docRef = doc(db, this.collectionPath, docId);
      await updateDoc(docRef, data as DocumentData);
    } catch (error) {
      const fsError = error as FirestoreError;
      throw new FirestoreServiceError(
        `Failed to update document "${docId}" in "${this.collectionPath}": ${fsError.message}`,
        fsError.code ?? "unknown",
        this.collectionPath
      );
    }
  }

  /**
   * Deletes a document by its ID.
   *
   * @param docId - The document ID to delete
   * @throws {FirestoreServiceError} If the Firestore operation fails
   *
   * @example
   * ```ts
   * await activityService.deleteDocument("activity456");
   * ```
   */
  async deleteDocument(docId: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionPath, docId);
      await deleteDoc(docRef);
    } catch (error) {
      const fsError = error as FirestoreError;
      throw new FirestoreServiceError(
        `Failed to delete document "${docId}" from "${this.collectionPath}": ${fsError.message}`,
        fsError.code ?? "unknown",
        this.collectionPath
      );
    }
  }

  /**
   * Subscribes to real-time updates for a single document.
   *
   * @param docId - The document ID to subscribe to
   * @param onData - Callback invoked with the document data (or null if deleted) on each update
   * @param onError - Optional callback invoked when an error occurs
   * @returns An unsubscribe function to stop listening for updates
   *
   * @example
   * ```ts
   * const unsub = userService.subscribeToDocument("user123", (user) => {
   *   console.log("User updated:", user);
   * });
   * // Later: unsub();
   * ```
   */
  subscribeToDocument(
    docId: string,
    onData: (data: (T & { id: string }) | null) => void,
    onError?: (error: FirestoreServiceError) => void
  ): Unsubscribe {
    const docRef = doc(db, this.collectionPath, docId);

    return onSnapshot(
      docRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          onData(null);
          return;
        }
        onData({ id: snapshot.id, ...(snapshot.data() as T) });
      },
      (error) => {
        /* c8 ignore next -- defensive guard: onError may be omitted by caller */
        if (onError) {
          onError(
            new FirestoreServiceError(
              `Subscription error for document "${docId}" in "${this.collectionPath}": ${error.message}`,
              error.code,
              this.collectionPath
            )
          );
        }
      }
    );
  }

  /**
   * Subscribes to real-time updates for a collection query.
   *
   * @param config - Optional query configuration for filtering, ordering, limiting, and pagination
   * @param onData - Callback invoked with the array of documents on each update
   * @param onError - Optional callback invoked when an error occurs
   * @returns An unsubscribe function to stop listening for updates
   *
   * @example
   * ```ts
   * const unsub = activityService.subscribeToCollection(
   *   {
   *     whereClauses: [{ field: "userId", operator: "==", value: uid }],
   *     orderByClauses: [{ field: "date", direction: "desc" }],
   *   },
   *   (activities) => console.log("Activities:", activities),
   *   (error) => console.error(error),
   * );
   * // Later: unsub();
   * ```
   */
  subscribeToCollection(
    config: QueryConfig | undefined,
    onData: (data: (T & { id: string })[]) => void,
    onError?: (error: FirestoreServiceError) => void
  ): Unsubscribe {
    const colRef = collection(db, this.collectionPath);
    const constraints = config ? buildConstraints(config) : [];
    const q = query(colRef, ...constraints);

    return onSnapshot(
      q,
      (snapshot) => {
        const results = snapshot.docs.map((docSnap) => ({
          id: docSnap.id,
          ...(docSnap.data() as T),
        }));
        onData(results);
      },
      (error) => {
        /* c8 ignore next -- defensive guard: onError may be omitted by caller */
        if (onError) {
          onError(
            new FirestoreServiceError(
              `Subscription error for collection "${this.collectionPath}": ${error.message}`,
              error.code,
              this.collectionPath
            )
          );
        }
      }
    );
  }
}
