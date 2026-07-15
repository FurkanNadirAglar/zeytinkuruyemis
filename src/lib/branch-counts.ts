import {
  Timestamp,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore';

import { getDb } from '@/lib/firebase';

const BRANCH_COUNTS_COLLECTION = 'branchCounts';

export type BranchCountItem = {
  productId: string;
  productName: string;
  category: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  rawKg: number;
  roastedKg: number;
  totalKg: number;
  totalAmount: number;
};

export type BranchCountRecord = {
  branchId: string;
  branchName: string;
  items: BranchCountItem[];
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type SaveBranchCountInput = {
  branchId: string;
  branchName: string;
  items: BranchCountItem[];
};

function branchCountDoc(branchId: string) {
  return doc(getDb(), BRANCH_COUNTS_COLLECTION, branchId);
}

function branchCountsCollection() {
  return collection(getDb(), BRANCH_COUNTS_COLLECTION);
}

function mapTimestamp(value: unknown) {
  return value instanceof Timestamp ? value.toDate() : null;
}

function mapCountItem(data: unknown): BranchCountItem | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const item = data as Record<string, unknown>;

  return {
    productId: typeof item.productId === 'string' ? item.productId : '',
    productName: typeof item.productName === 'string' ? item.productName : '',
    category: typeof item.category === 'string' ? item.category : '',
    unit: typeof item.unit === 'string' ? item.unit : 'Kg',
    purchasePrice: typeof item.purchasePrice === 'number' ? item.purchasePrice : 0,
    salePrice: typeof item.salePrice === 'number' ? item.salePrice : 0,
    rawKg: typeof item.rawKg === 'number' ? item.rawKg : 0,
    roastedKg: typeof item.roastedKg === 'number' ? item.roastedKg : 0,
    totalKg: typeof item.totalKg === 'number' ? item.totalKg : 0,
    totalAmount: typeof item.totalAmount === 'number' ? item.totalAmount : 0,
  };
}

function mapBranchCount(data: Record<string, unknown>): BranchCountRecord {
  const rawItems = Array.isArray(data.items) ? data.items : [];

  return {
    branchId: typeof data.branchId === 'string' ? data.branchId : '',
    branchName: typeof data.branchName === 'string' ? data.branchName : '',
    items: rawItems
      .map((item) => mapCountItem(item))
      .filter((item): item is BranchCountItem => item !== null),
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt),
  };
}

export async function saveBranchCount(input: SaveBranchCountInput) {
  const normalizedBranchId = input.branchId.trim();
  const normalizedBranchName = input.branchName.trim();

  if (!normalizedBranchId) {
    throw new Error('Sayim kaydi icin sube secilmelidir.');
  }

  if (!normalizedBranchName) {
    throw new Error('Sube adi bos olamaz.');
  }

  await setDoc(
    branchCountDoc(normalizedBranchId),
    {
      branchId: normalizedBranchId,
      branchName: normalizedBranchName,
      items: input.items,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function subscribeBranchCount(
  branchId: string,
  callback: (record: BranchCountRecord | null) => void,
  onError?: (error: Error) => void,
) {
  return onSnapshot(
    branchCountDoc(branchId),
    (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      callback(mapBranchCount(snapshot.data()));
    },
    (error) => {
      onError?.(error);
    },
  );
}

export function subscribeBranchCounts(
  callback: (records: BranchCountRecord[]) => void,
  onError?: (error: Error) => void,
) {
  const snapshotQuery = query(branchCountsCollection(), orderBy('branchName', 'asc'));

  return onSnapshot(
    snapshotQuery,
    (snapshot) => {
      callback(snapshot.docs.map((item) => mapBranchCount(item.data())));
    },
    (error) => {
      onError?.(error);
    },
  );
}
