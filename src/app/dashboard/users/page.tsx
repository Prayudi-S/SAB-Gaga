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

  // Fetch the current user's profile first to check their role.
  const { data: currentUserProfile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);

  // Conditionally fetch all users only if the current user is an admin.
  const { data: users, loading: usersLoading } = useCollection<UserProfile>(
    currentUserProfile?.role === 'admin' ? 'users' : null
  );

  const isLoading = userLoading || profileLoading || (currentUserProfile?.role === 'admin' && usersLoading);

  useEffect(() => {
    // If user is not logged in, redirect to login page.
    if (!userLoading && !user) {
      router.push('/');
      return;
    }
    // If user is logged in but is not an admin, redirect to the main dashboard.
    if (!profileLoading && currentUserProfile && currentUserProfile.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, userLoading, currentUserProfile, profileLoading, router]);


  // Show skeleton loader while verifying auth state and role.
  if (isLoading || !currentUserProfile || currentUserProfile.role !== 'admin') {
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

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Add, edit, and manage users and their roles.
        </p>
      </div>
      {/* Pass the fetched users to the table. `users` will only have data if the user is an admin. */}
      {users && <UsersTable initialUsers={users} />}
    </div>
  );
}
