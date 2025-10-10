'use client';

import { useCollection, useDoc, useUser } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import UsersTable from '@/components/users-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const { data: currentUserProfile, loading: profileLoading } = useDoc<UserProfile>(
    user ? `users/${user.uid}` : null
  );

  const isAdmin = currentUserProfile?.role === 'admin';

  const { data: users, loading: usersLoading } = useCollection<UserProfile>(
    // Only fetch all users if the current user is an admin
    isAdmin ? 'users' : null
  );

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
  }, [user, userLoading, currentUserProfile, profileLoading, router]);

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
