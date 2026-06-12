/**
 * @module FirestoreService Tests
 * Tests for the FirestoreService class that provides typed CRUD operations
 * on Firestore documents and collections.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirestoreService, FirestoreServiceError } from '@/services/firestore.service';

// Mock firebase at the module level - this is hoisted before any imports
vi.mock('@/lib/firebase', () => ({
  db: {},
}));

// Mock the entire firebase/firestore module with vi.fn() stubs
vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  serverTimestamp: vi.fn(() => 'mockTimestamp'),
}));

// Import mocked functions AFTER vi.mock declarations so they get the mock versions
import {
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  collection,
  query,
} from 'firebase/firestore';

describe('FirestoreService', () => {
  let service: FirestoreService<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FirestoreService('testCollection');
  });

  describe('getDocument', () => {
    it('returns null if document does not exist', async () => {
      vi.mocked(doc).mockReturnValue('docRef' as any);
      vi.mocked(getDoc).mockResolvedValue({ exists: () => false } as any);

      const docData = await service.getDocument('doc123');
      expect(docData).toBeNull();
    });

    it('returns doc data if it exists', async () => {
      const mockData = { name: 'John Doe', email: 'john@example.com' };
      vi.mocked(doc).mockReturnValue('docRef' as any);
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        id: 'doc123',
        data: () => mockData,
      } as any);

      const docData = await service.getDocument('doc123');
      expect(docData).toEqual({ id: 'doc123', ...mockData });
    });

    it('throws FirestoreServiceError on operation failure', async () => {
      vi.mocked(doc).mockReturnValue('docRef' as any);
      vi.mocked(getDoc).mockRejectedValue({ code: 'permission-denied', message: 'Denied' });

      await expect(service.getDocument('doc123')).rejects.toThrow(FirestoreServiceError);
    });
  });

  describe('getDocuments', () => {
    it('returns list of documents', async () => {
      const mockDocs = [
        { id: '1', data: () => ({ name: 'Doc 1' }) },
        { id: '2', data: () => ({ name: 'Doc 2' }) },
      ];
      vi.mocked(collection).mockReturnValue('colRef' as any);
      vi.mocked(query).mockReturnValue('queryRef' as any);
      vi.mocked(getDocs).mockResolvedValue({ docs: mockDocs } as any);

      const results = await service.getDocuments({
        whereClauses: [{ field: 'userId', operator: '==', value: '123' }],
        orderByClauses: [{ field: 'date', direction: 'desc' }],
        limitCount: 5,
        startAfterDoc: {} as any,
      });

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({ id: '1', name: 'Doc 1' });
    });

    it('throws FirestoreServiceError on list failure', async () => {
      vi.mocked(collection).mockReturnValue('colRef' as any);
      vi.mocked(getDocs).mockRejectedValue({ code: 'unavailable', message: 'Server unavailable' });

      await expect(service.getDocuments()).rejects.toThrow(FirestoreServiceError);
    });
  });

  describe('addDocument', () => {
    it('creates a doc and returns the generated ID', async () => {
      vi.mocked(collection).mockReturnValue('colRef' as any);
      vi.mocked(addDoc).mockResolvedValue({ id: 'newId' } as any);

      const newId = await service.addDocument({
        email: 'john@example.com',
        name: 'John',
      });
      expect(addDoc).toHaveBeenCalled();
      expect(newId).toBe('newId');
    });

    it('throws FirestoreServiceError on add failure', async () => {
      vi.mocked(collection).mockReturnValue('colRef' as any);
      vi.mocked(addDoc).mockRejectedValue({ code: 'aborted', message: 'Aborted' });

      await expect(service.addDocument({})).rejects.toThrow(FirestoreServiceError);
    });
  });

  describe('updateDocument', () => {
    it('updates a doc with partial data', async () => {
      vi.mocked(doc).mockReturnValue('docRef' as any);
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      await service.updateDocument('doc123', {
        name: 'John Updated',
      });
      expect(updateDoc).toHaveBeenCalled();
    });

    it('throws FirestoreServiceError on update failure', async () => {
      vi.mocked(doc).mockReturnValue('docRef' as any);
      vi.mocked(updateDoc).mockRejectedValue({ code: 'not-found', message: 'Not found' });

      await expect(service.updateDocument('doc123', {})).rejects.toThrow(FirestoreServiceError);
    });
  });

  describe('deleteDocument', () => {
    it('deletes a doc', async () => {
      vi.mocked(doc).mockReturnValue('docRef' as any);
      vi.mocked(deleteDoc).mockResolvedValue(undefined);

      await service.deleteDocument('doc123');
      expect(deleteDoc).toHaveBeenCalled();
    });

    it('throws FirestoreServiceError on delete failure', async () => {
      vi.mocked(doc).mockReturnValue('docRef' as any);
      vi.mocked(deleteDoc).mockRejectedValue({ code: 'cancelled', message: 'Cancelled' });

      await expect(service.deleteDocument('doc123')).rejects.toThrow(FirestoreServiceError);
    });
  });

  describe('subscribeToDocument', () => {
    it('calls onSnapshot and handles data updates', () => {
      vi.mocked(doc).mockReturnValue('docRef' as any);
      let snapCallback: any;
      vi.mocked(onSnapshot).mockImplementation((ref: any, onNext: any, onError: any) => {
        snapCallback = onNext;
        return () => {};
      });

      const onData = vi.fn();
      service.subscribeToDocument('doc123', onData);

      snapCallback({
        exists: () => true,
        id: 'doc123',
        data: () => ({ name: 'Subscribed' }),
      });

      expect(onData).toHaveBeenCalledWith({ id: 'doc123', name: 'Subscribed' });

      snapCallback({
        exists: () => false,
      });

      expect(onData).toHaveBeenCalledWith(null);
    });

    it('handles subscription error callbacks', () => {
      vi.mocked(doc).mockReturnValue('docRef' as any);
      let errorCallback: any;
      vi.mocked(onSnapshot).mockImplementation((ref: any, onNext: any, onError: any) => {
        errorCallback = onError;
        return () => {};
      });

      const onError = vi.fn();
      service.subscribeToDocument('doc123', () => {}, onError);

      errorCallback({ code: 'permission-denied', message: 'Denied' });

      expect(onError).toHaveBeenCalledWith(expect.any(FirestoreServiceError));
    });
  });

  describe('subscribeToCollection', () => {
    it('subscribes to collection snap and triggers callback', () => {
      vi.mocked(collection).mockReturnValue('colRef' as any);
      let snapCallback: any;
      vi.mocked(onSnapshot).mockImplementation((q: any, onNext: any, onError: any) => {
        snapCallback = onNext;
        return () => {};
      });

      const onData = vi.fn();
      service.subscribeToCollection(undefined, onData);

      snapCallback({
        docs: [
          { id: '1', data: () => ({ name: 'Doc 1' }) }
        ]
      });

      expect(onData).toHaveBeenCalledWith([{ id: '1', name: 'Doc 1' }]);
    });

    it('handles collection subscription error callbacks', () => {
      vi.mocked(collection).mockReturnValue('colRef' as any);
      let errorCallback: any;
      vi.mocked(onSnapshot).mockImplementation((q: any, onNext: any, onError: any) => {
        errorCallback = onError;
        return () => {};
      });

      const onError = vi.fn();
      service.subscribeToCollection(undefined, () => {}, onError);

      errorCallback({ code: 'permission-denied', message: 'Denied' });

      expect(onError).toHaveBeenCalledWith(expect.any(FirestoreServiceError));
    });
  });
});
