'use client';

import { useCollection, useDoc, useUser } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import UsersTable from '@/components/users-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

export default function UsersPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const userProfilePath = useMemo(() => (user ? `users/${user.uid}` : null), [user]);
  const { data: currentUserProfile, loading: profileLoading } = useDoc<UserProfile>(userProfilePath);

  const isAdmin = useMemo(() => currentUserProfile?.role === 'admin', [currentUserProfile]);

  // IMPORTANT: Only fetch the collection if the user is confirmed to be an admin.
  // The 'users' string will only be passed to useCollection if isAdmin is true. Otherwise, it's null.
  const { data: users, loading: usersLoading } = useCollection<UserProfile>(isAdmin ? 'users' : null);

  const isLoading = userLoading || profileLoading || (isAdmin && usersLoading);

  // Effect to handle redirection based on auth state and role
  useEffect(() => {
    // If user loading is finished and there's no user, redirect to login
    if (!userLoading && !user) {
      router.push('/');
      return;
    }
    // If profile loading is finished and the user is NOT an admin, redirect to dashboard
    if (!profileLoading && currentUserProfile && currentUserProfile.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, userLoading, currentUserProfile, profileLoading, router]);

  // Show a full-page loading skeleton until we know the user's role and have their data.
  if (isLoading || !isAdmin) {
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

  // Only render the table if the user is an admin and the data has been loaded.
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
