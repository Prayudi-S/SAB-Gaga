'use server';

import { doc, setDoc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';
import type { UserProfile } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Creates a user document in Firestore.
 * 
 * NOTE: This is a simulation. In a production app, creating a user in Firebase Auth
 * should be done from a secure backend environment (e.g., Cloud Function) using the Admin SDK.
 * This client-side implementation relies on security rules that allow an admin to write to
 * any user's document, which is acceptable for this prototype.
 * 
 * @param userData - The user data to be saved.
 * @returns The newly created user profile.
 */
export async function addUser(
  userData: Omit<UserProfile, 'uid'>
): Promise<UserProfile> {
  const { firestore } = initializeFirebase();
  
  // This is a temporary, client-side-generated UID.
  // In a real scenario, the UID would come from creating the user in Firebase Auth.
  const tempUid = `temp-${Date.now()}`;
  
  const newUserProfile: UserProfile = {
    ...userData,
    uid: tempUid, 
  };

  const userDocRef = doc(firestore, 'users', newUserProfile.uid);
  
  // We use a non-blocking call with .catch for error handling
  setDoc(userDocRef, newUserProfile)
    .catch((serverError) => {
      const permissionError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'create',
        requestResourceData: newUserProfile,
      });
      errorEmitter.emit('permission-error', permissionError);
      
      // Re-throw to allow the calling function to catch it as well
      throw new Error(`Failed to create user document: ${serverError.message}`);
    });
    
  console.warn(`
    [SIMULATION] User created in Firestore with temporary UID: ${newUserProfile.uid}. 
    Authentication record was NOT created.
    Full Name: ${newUserProfile.fullName}, Email: ${newUserProfile.email}
  `);

  return newUserProfile;
}
