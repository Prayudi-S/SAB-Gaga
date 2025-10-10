'use client';

import { useDoc, useUser, useFirestore } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import UsersTable from '@/components/users-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs } from 'firebase/firestore';

export default function UsersPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const { data: currentUserProfile, loading: profileLoading } = useDoc<UserProfile>(
    user ? `users/${user.id}` : null
  );
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const isAdmin = currentUserProfile?.role === 'admin';
  const isLoading = userLoading || profileLoading || (isAdmin && usersLoading);

  useEffect(() => {
    // If auth is done and there's no user, redirect to login
    if (!userLoading && !user) {
      router.push('/');
      return;
    }
    // If profile loading is done and we have a profile, but the user is not an admin, redirect
    if (!profileLoading && currentUserProfile && currentUserProfile.role !== 'admin') {
      router.push('/dashboard');
    }

    // Fetch users only if the current user is an admin
    if (isAdmin && firestore) {
      const fetchUsers = async () => {
        setUsersLoading(true);
        try {
          const usersSnapshot = await getDocs(collection(firestore, 'users'));
          const usersData = usersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as UserProfile));
          setUsers(usersData);
        } catch (error) {
          console.error("Failed to fetch users:", error);
          // Handle error appropriately, maybe show a toast
        } finally {
          setUsersLoading(false);
        }
      };
      fetchUsers();
    } else if (!userLoading && !profileLoading && !isAdmin) {
      // If user is determined not to be an admin, stop the users loading state
      setUsersLoading(false);
    }
  }, [user, userLoading, currentUserProfile, profileLoading, isAdmin, firestore, router]);

  // Show a loading skeleton while we're verifying the user's role and fetching data
  if (isLoading) {
    return (
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Add, edit, and manage users and their roles.
          </p>
        </div>
        <div className="flex flex-col gap-4">
            <div className="flex justify-end">
                <Skeleton className="h-10 w-48" />
            </div>
            <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  // If the user is not an admin after loading is complete, show nothing (or a message)
  // The useEffect will handle redirection anyway.
  if (!isAdmin) {
    return null; 
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Add, edit, and manage users and their roles.
        </p>
      </div>
      <UsersTable initialUsers={users || []} />
    </div>
  );
}
