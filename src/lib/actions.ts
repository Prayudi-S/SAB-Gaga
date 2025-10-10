'use server';

import { initializeApp, getApps, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

import { initializeFirebase } from '@/firebase';
import type { UserProfile } from './types';
import { firebaseConfig } from '@/firebase/config';

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
  userData: Omit<UserProfile, 'uid'> & { password?: string }
): Promise<UserProfile> {
  // Get the main app's firestore instance, which is authenticated as the admin
  const { firestore } = initializeFirebase(); 
  
  // Create a unique name for the temporary app
  const tempAppName = `temp-user-creation-${Date.now()}`;
  // Initialize a temporary, secondary Firebase app for user creation.
  const tempApp = initializeApp(firebaseConfig, tempAppName);
  const tempAuth = getAuth(tempApp);

  try {
    if (!userData.password) {
        throw new Error("Password is required to create a new user.");
    }
    // 1. Create the user in Firebase Authentication using the temporary auth instance
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
    
    // 3. Save the user profile to Firestore using the MAIN Firestore instance
    //    (which is still authenticated as the admin)
    const userDocRef = doc(firestore, 'users', newUserProfile.uid);
    await setDoc(userDocRef, newUserProfile);
      
    // The user profile returned to the client-side
    return newUserProfile;

  } catch (error: any) {
    console.error("Error creating user:", error);
    if (error.code === 'auth/email-already-in-use') {
        throw new Error('This email address is already in use by another account.');
    }
    throw new Error(error.message || 'Failed to create user.');
  } finally {
    // 4. Clean up: Sign out from the temporary app and delete it
    if (tempAuth.currentUser) {
      await signOut(tempAuth);
    }
    await deleteApp(tempApp);
  }
}
