import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';

import { getDb } from '@/lib/firebase';

const BRANCHES_COLLECTION = 'branches';

export type Branch = {
  id: string;
  name: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type CreateBranchInput = {
  name: string;
};

function branchesCollection() {
  return collection(getDb(), BRANCHES_COLLECTION);
}

function mapTimestamp(value: unknown) {
  return value instanceof Timestamp ? value.toDate() : null;
}

function normalizeBranchInput(input: CreateBranchInput) {
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error('Şube adı boş olamaz.');
  }

  return {
    name: trimmedName,
  };
}

function mapBranch(docId: string, data: Record<string, unknown>): Branch {
  return {
    id: docId,
    name: typeof data.name === 'string' ? data.name : '',
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt),
  };
}

export async function createBranch(input: CreateBranchInput) {
  const normalized = normalizeBranchInput(input);

  const docRef = await addDoc(branchesCollection(), {
    ...normalized,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateBranch(branchId: string, input: CreateBranchInput) {
  const normalized = normalizeBranchInput(input);

  await updateDoc(doc(getDb(), BRANCHES_COLLECTION, branchId), {
    ...normalized,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteBranch(branchId: string) {
  await deleteDoc(doc(getDb(), BRANCHES_COLLECTION, branchId));
}

export async function listBranches(): Promise<Branch[]> {
  const snapshot = await getDocs(query(branchesCollection(), orderBy('name', 'asc')));

  return snapshot.docs.map((item) => mapBranch(item.id, item.data()));
}

export function subscribeBranches(
  callback: (branches: Branch[]) => void,
  onError?: (error: Error) => void,
) {
  const snapshotQuery = query(branchesCollection(), orderBy('name', 'asc'));

  return onSnapshot(
    snapshotQuery,
    (snapshot) => {
      callback(snapshot.docs.map((item) => mapBranch(item.id, item.data())));
    },
    (error) => {
      onError?.(error);
    },
  );
}
