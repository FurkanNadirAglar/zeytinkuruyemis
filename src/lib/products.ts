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
} from "firebase/firestore";
import { getDb } from '@/lib/firebase';

const PRODUCTS_COLLECTION = 'products';

export type Product = {
  id: string;
  name: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  stockKg: number;
  category: string;
  createdAt?: Date | null;
  updatedAt?: Date | null;
};

export type CreateProductInput = {
  name: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  stockKg: number;
  category: string;
};

function productsCollection() {
  return collection(getDb(), PRODUCTS_COLLECTION);
}

function mapTimestamp(value: unknown) {
  return value instanceof Timestamp ? value.toDate() : null;
}

function normalizeNumber(value: number, fieldLabel: string) {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${fieldLabel} gecersiz.`);
  }

  return value;
}

function normalizeProductInput(input: CreateProductInput) {
  const trimmedName = input.name.trim();
  const trimmedUnit = input.unit.trim();
  const trimmedCategory = input.category.trim();

  if (!trimmedName) {
    throw new Error('Urun adi bos olamaz.');
  }

  if (!trimmedUnit) {
    throw new Error('Birim bos olamaz.');
  }

  if (!trimmedCategory) {
    throw new Error('Kategori bos olamaz.');
  }

  return {
    name: trimmedName,
    unit: trimmedUnit,
    category: trimmedCategory,
    purchasePrice: normalizeNumber(input.purchasePrice, 'Alis fiyati'),
    salePrice: normalizeNumber(input.salePrice, 'Satis fiyati'),
    stockKg: normalizeNumber(input.stockKg, 'Stok'),
  };
}

function mapProduct(docId: string, data: Record<string, unknown>): Product {
  return {
    id: docId,
    name: typeof data.name === 'string' ? data.name : '',
    unit: typeof data.unit === 'string' ? data.unit : 'Kg',
    purchasePrice: typeof data.purchasePrice === 'number' ? data.purchasePrice : 0,
    salePrice: typeof data.salePrice === 'number' ? data.salePrice : 0,
    stockKg: typeof data.stockKg === 'number' ? data.stockKg : 0,
    category: typeof data.category === 'string' ? data.category : 'Diger',
    createdAt: mapTimestamp(data.createdAt),
    updatedAt: mapTimestamp(data.updatedAt),
  };
}

export async function createProduct(input: CreateProductInput) {
  const normalized = normalizeProductInput(input);

  const docRef = await addDoc(productsCollection(), {
    ...normalized,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateProduct(productId: string, input: CreateProductInput) {
  const normalized = normalizeProductInput(input);

  await updateDoc(doc(getDb(), PRODUCTS_COLLECTION, productId), {
    ...normalized,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteProduct(productId: string) {
  await deleteDoc(doc(getDb(), PRODUCTS_COLLECTION, productId));
}

export async function listProducts(): Promise<Product[]> {
  const snapshot = await getDocs(query(productsCollection(), orderBy('name', 'asc')));

  return snapshot.docs.map((item) => mapProduct(item.id, item.data()));
}

export function subscribeProducts(
  callback: (products: Product[]) => void,
  onError?: (error: Error) => void,
) {
  const snapshotQuery = query(productsCollection(), orderBy('name', 'asc'));

  return onSnapshot(
    snapshotQuery,
    (snapshot) => {
      callback(snapshot.docs.map((item) => mapProduct(item.id, item.data())));
    },
    (error) => {
      onError?.(error);
    },
  );
}
