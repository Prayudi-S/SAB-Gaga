'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, Query, DocumentData, QuerySnapshot, FirestoreError } from 'firebase/firestore';
import { useFirestore } from '../provider';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T>(path: string | null) {
  const db = useFirestore();
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (!db || !path) {
      setLoading(false);
      setData(null);
      return;
    }

    setLoading(true);
    const collectionRef = collection(db, path);
    const unsubscribe = onSnapshot(
      collectionRef,
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as unknown as T));
        setData(items);
        setLoading(false);
      },
      (err: FirestoreError) => {
        const permissionError = new FirestorePermissionError({
          path: collectionRef.path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, path]);

  return { data, loading, error };
}
