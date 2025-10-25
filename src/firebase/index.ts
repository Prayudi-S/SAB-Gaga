import { initializeApp, getApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, initializeFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';
import { initializeApp as initializeSecondaryApp, deleteApp } from 'firebase/app';
import { getAuth as getAuthFromApp, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore as getFirestoreFromApp, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useCollection } from './firestore/use-collection';
import { useDoc } from './firestore/use-doc';
import { useUser } from './auth/use-user';
import { FirebaseProvider, useFirebase, useFirebaseApp, useFirestore, useAuth } from './provider';
import { FirebaseClientProvider } from './client-provider';

function initializeFirebase(): { app: FirebaseApp; auth: Auth; firestore: Firestore; } {
  const apps = getApps();
  const app = apps.length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  // Configure Firestore to avoid blocked WebChannel requests by some extensions/ad-blockers
  // experimentalAutoDetectLongPolling helps fall back to long polling when needed
  // useFetchStreams set to false improves compatibility with some proxies/extensions
  const firestore = (() => {
    try {
      return initializeFirestore(app, { experimentalAutoDetectLongPolling: true, useFetchStreams: false });
    } catch {
      // if already initialized
      return getFirestore(app);
    }
  })();
  return { app, auth, firestore };
}

export {
  initializeFirebase,
  FirebaseProvider,
  FirebaseClientProvider,
  useCollection,
  useDoc,
  useUser,
  useFirebase,
  useFirebaseApp,
  useFirestore,
  useAuth,
};

export async function registerUserAsAdmin(
  params: { email: string; password: string; name: string; address: string; meterId: string }
): Promise<string> {
  const { email, password, name, address, meterId } = params;

  const primaryDb = getFirestore();

  const secondary = initializeSecondaryApp(firebaseConfig, 'secondary');
  try {
    const secondaryAuth = getAuthFromApp(secondary);
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const newUid = cred.user.uid;

    await setDoc(doc(primaryDb, 'users', newUid), {
      fullName: name,
      houseNumber: address,
      meterId,
      email,
      role: 'user',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return newUid;
  } finally {
    await deleteApp(secondary);
  }
}
