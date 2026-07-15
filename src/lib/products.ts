import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

import { getDb } from '@/lib/firebase';

const PRODUCTS_COLLECTION = 'products';

export type Product = {
  id: string;
  name: string;
  stock: number;
  unit?: string;
  category?: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type CreateProductInput = {
  name: string;
  stock?: number;
  unit?: string;
  category?: string;
};

function productsCollection() {
  return collection(getDb(), PRODUCTS_COLLECTION);
}

function mapTimestamp(value: unknown) {
  return value instanceof Timestamp ? value.toDate() : null;
}

export async function createProduct(input: CreateProductInput) {
  const trimmedName = input.name.trim();

  if (!trimmedName) {
    throw new Error('Urun adi bos olamaz.');
  }

  const docRef = await addDoc(productsCollection(), {
    name: trimmedName,
    stock: input.stock ?? 0,
    unit: input.unit?.trim() || null,
    category: input.category?.trim() || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function listProducts(): Promise<Product[]> {
  const snapshot = await getDocs(query(productsCollection(), orderBy('name', 'asc')));

  return snapshot.docs.map((doc) => {
    const data = doc.data();

    return {
      id: doc.id,
      name: typeof data.name === 'string' ? data.name : '',
      stock: typeof data.stock === 'number' ? data.stock : 0,
      unit: typeof data.unit === 'string' ? data.unit : undefined,
      category: typeof data.category === 'string' ? data.category : undefined,
      createdAt: mapTimestamp(data.createdAt),
      updatedAt: mapTimestamp(data.updatedAt),
    };
  });
}
