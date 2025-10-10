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

  // 1. Fetch the current user's profile to check their role.
  const { data: currentUserProfile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);

  // 2. Determine if the current user is an admin after their profile has loaded.
  const isAdmin = !profileLoading && currentUserProfile?.role === 'admin';

  // 3. Conditionally fetch all users ONLY if the current user is confirmed to be an admin.
  const { data: users, loading: usersLoading } = useCollection<UserProfile>(
    isAdmin ? 'users' : null
  );

  // Determine overall loading state
  const isLoading = userLoading || profileLoading || (isAdmin && usersLoading);
  
  useEffect(() => {
    // If auth is done loading and there's no user, redirect to login.
    if (!userLoading && !user) {
      router.push('/');
      return;
    }
    // If the profile is done loading and the user is NOT an admin, redirect away.
    if (!profileLoading && currentUserProfile && currentUserProfile.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, userLoading, currentUserProfile, profileLoading, router]);

  // Show a skeleton loader while we verify auth state and admin role.
  // This also correctly handles the case where a non-admin is about to be redirected.
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

  // At this point, we are sure the user is an admin and the `users` data is either loaded or null (if collection is empty).
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Add, edit, and manage users and their roles.
        </p>
      </div>
      {/* Pass the fetched users to the table. `users` will have data because the isAdmin check passed. */}
      {users && <UsersTable initialUsers={users} />}
    </div>
  );
}
