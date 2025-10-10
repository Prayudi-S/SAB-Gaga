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
 * @param adminAuth - The current admin's Auth instance.
 * @param userData - The user data for the new user.
 * @returns The newly created user profile.
 */
export async function addUser(
  userData: Omit<UserProfile, 'uid'>
): Promise<UserProfile> {
  const { firestore } = initializeFirebase(); // Get main app's firestore instance

  // Create a temporary, secondary Firebase app for user creation.
  const tempAppName = `temp-user-creation-${Date.now()}`;
  const tempApp = initializeApp(firebaseConfig, tempAppName);
  const tempAuth = getAuth(tempApp);

  try {
    // 1. Create the user in Firebase Authentication
    const userCredential = await createUserWithEmailAndPassword(
      tempAuth,
      userData.email,
      userData.password as string // Assuming password is provided in this object
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
    
    // Using a non-blocking call for optimistic UI updates
    setDoc(userDocRef, newUserProfile)
      .catch((serverError) => {
        const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'create',
          requestResourceData: newUserProfile,
        });
        errorEmitter.emit('permission-error', permissionError);
        // We still throw to let the client know something went wrong with the DB write
        throw new Error(`Failed to create user document in Firestore: ${serverError.message}`);
      });
      
    // The user profile returned to the client-side
    return newUserProfile;

  } catch (error: any) {
    console.error("Error creating user:", error);
    // Re-throw the error to be caught by the calling form
    throw new Error(error.message || 'Failed to create user in authentication.');
  } finally {
    // 4. Clean up the temporary app instance
    if (tempAuth.currentUser) {
      await signOut(tempAuth);
    }
    await deleteApp(tempApp);
  }
}
