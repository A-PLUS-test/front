import { addDoc, collection, doc, getDocs, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Document, Folder, QuizSet, VocabularySet } from '../types';

const toDate = (value: unknown): Date => {
  if (!value) return new Date();
  const maybeTimestamp = value as { toDate?: () => Date };
  if (typeof maybeTimestamp === 'object' && maybeTimestamp?.toDate) {
    return maybeTimestamp.toDate();
  }
  if (value instanceof Date) return value;
  return new Date(value as string);
};

const mapDocument = (id: string, data: any): Document => ({
  id,
  ...data,
  uploadedAt: toDate(data.uploadedAt),
  processedAt: data.processedAt ? toDate(data.processedAt) : undefined,
  deletedAt: data.deletedAt ? toDate(data.deletedAt) : undefined,
});

const mapFolder = (id: string, data: any): Folder => ({
  id,
  ...data,
  createdAt: toDate(data.createdAt),
  updatedAt: toDate(data.updatedAt),
});

const mapQuizSet = (id: string, data: any): QuizSet => ({
  id,
  ...data,
  createdAt: toDate(data.createdAt),
});

const mapVocabularySet = (id: string, data: any): VocabularySet => ({
  id,
  ...data,
  createdAt: toDate(data.createdAt),
});

export const fetchDocumentsByUser = async (userId: string): Promise<Document[]> => {
  const docsQuery = query(collection(db, 'documents'), where('userId', '==', userId));
  const snapshot = await getDocs(docsQuery);
  const documents: Document[] = [];

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    if (data.isDeleted === true) return;
    documents.push(mapDocument(docSnapshot.id, data));
  });

  return documents.sort((a, b) => {
    const dateA = toDate(a.uploadedAt).getTime();
    const dateB = toDate(b.uploadedAt).getTime();
    return dateB - dateA;
  });
};

export const fetchFoldersByUser = async (userId: string): Promise<Folder[]> => {
  const foldersQuery = query(collection(db, 'folders'), where('userId', '==', userId));
  const snapshot = await getDocs(foldersQuery);
  const folders: Folder[] = [];

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    if (data.isDeleted === true) return;
    folders.push(mapFolder(docSnapshot.id, data));
  });

  return folders.sort((a, b) => a.name.localeCompare(b.name));
};

export const fetchQuizSetsByUser = async (userId: string): Promise<QuizSet[]> => {
  const quizQuery = query(collection(db, 'quizzes'), where('userId', '==', userId));
  const snapshot = await getDocs(quizQuery);
  const quizSets: QuizSet[] = [];

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    quizSets.push(mapQuizSet(docSnapshot.id, data));
  });

  return quizSets.sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
};

export const fetchVocabularySetsByUser = async (userId: string): Promise<VocabularySet[]> => {
  const vocabQuery = query(collection(db, 'vocabularySets'), where('userId', '==', userId));
  const snapshot = await getDocs(vocabQuery);
  const vocabularySets: VocabularySet[] = [];

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    vocabularySets.push(mapVocabularySet(docSnapshot.id, data));
  });

  return vocabularySets.sort((a, b) => toDate(b.createdAt).getTime() - toDate(a.createdAt).getTime());
};

export const createFolderForUser = async (userId: string, name: string) => {
  return addDoc(collection(db, 'folders'), {
    userId,
    name,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isDeleted: false,
    isFavorite: false,
  });
};

export const toggleFolderFavorite = async (folderId: string, currentFavorite: boolean) => {
  const folderRef = doc(db, 'folders', folderId);
  await updateDoc(folderRef, {
    isFavorite: !currentFavorite,
    updatedAt: serverTimestamp(),
  });
};
