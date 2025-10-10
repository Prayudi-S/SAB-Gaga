'use server';

import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { initializeFirebase } from '@/firebase';
import type { UserProfile } from './types';
import { firebaseConfig } from '@/firebase/config';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


/**
 * Adds a new user to Firebase Authentication and Firestore.
 * IMPORTANT: This uses a secondary, temporary Firebase app instance to create a user
 * and then immediately signs them out. This prevents the admin's session from being replaced.
 * In a production environment, this entire logic should be handled by a secure backend
 * (e.g., a Cloud Function) using the Firebase Admin SDK.
 *
 * @param userData - The user data for the new user.
 * @returns The newly created user profile.
 */
export async function addUser(
  userData: Omit<UserProfile, 'uid' | 'password'> & { password?: string }
): Promise<UserProfile> {
  const { firestore } = initializeFirebase(); // Get main app's firestore instance

  // Create a temporary, secondary Firebase app for user creation.
  const tempAppName = `temp-user-creation-${Date.now()}`;
  const tempApp = initializeApp(firebaseConfig, tempAppName);
  const tempAuth = getAuth(tempApp);

  try {
    if (!userData.password) {
        throw new Error("Password is required to create a new user.");
    }
    // 1. Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      tempAuth,
      userData.email,
      userData.password
    );
    const user = userCredential.user;

    // 2. Create the user profile object with the REAL UID from Auth
    const newUserProfile: UserProfile = {
      uid: user.uid,
      email: userData.email,
      fullName: userData.fullName,
      houseNumber: userData.houseNumber,
      meterId: userData.meterId,
      role: userData.role,
    };
    
    // 3. Save the user profile to Firestore
    const userDocRef = doc(firestore, 'users', newUserProfile.uid);
    
    // Use `await` here to ensure the database operation completes before returning.
    // This makes error handling more predictable.
    await setDoc(userDocRef, newUserProfile);
      
    // The user profile returned to the client-side
    return newUserProfile;

  } catch (error: any) {
    console.error("Error creating user:", error);
    // Re-throw the error to be caught by the calling form
    if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email address is already in use by another account.');
    }
    throw new Error(error.message || 'Failed to create user.');
  } finally {
    // 4. Clean up the temporary app instance
    if (tempAuth.currentUser) {
      await signOut(tempAuth);
    }
    await deleteApp(tempApp);
  }
}
