import { FirestoreService } from '@/services/firestore.service';
import { db } from '@/lib/firebase';
import { doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import { vi } from 'vitest';

vi.mock('@/lib/firebase', () => ({
  db: {},
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  serverTimestamp: vi.fn(),
}));

describe('FirestoreService', () => {
  let service: FirestoreService<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new FirestoreService('testCollection');
  });

  describe('getDocument', () => {
    it('returns null if profile does not exist', async () => {
      (doc as any).mockReturnValue('docRef');
      (getDoc as any).mockResolvedValue({ exists: () => false });

      const docData = await service.getDocument('doc123');
      expect(docData).toBeNull();
    });

    it('returns doc data if it exists', async () => {
      const mockData = { name: 'John Doe', email: 'john@example.com' };
      (doc as any).mockReturnValue('docRef');
      (getDoc as any).mockResolvedValue({
        exists: () => true,
        id: 'doc123',
        data: () => mockData,
      });

      const docData = await service.getDocument('doc123');
      expect(docData).toEqual({ id: 'doc123', ...mockData });
    });
  });

  describe('addDocument', () => {
    it('creates a doc', async () => {
      (addDoc as any).mockResolvedValue({ id: 'newId' });

      await service.addDocument({
        email: 'john@example.com',
        name: 'John',
      });
      expect(addDoc).toHaveBeenCalled();
    });
  });

  describe('updateDocument', () => {
    it('updates a doc', async () => {
      (doc as any).mockReturnValue('docRef');
      (updateDoc as any).mockResolvedValue(undefined);

      await service.updateDocument('doc123', {
        name: 'John Updated',
      });
      expect(updateDoc).toHaveBeenCalled();
    });
  });
});
