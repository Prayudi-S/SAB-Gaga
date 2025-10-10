'use client';

import { useCollection, useDoc, useUser } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import UsersTable from '@/components/users-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';

function UsersPageContent() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  const userProfilePath = useMemo(() => (user ? `users/${user.uid}` : null), [user]);
  const { data: currentUserProfile, loading: profileLoading } = useDoc<UserProfile>(userProfilePath);

  const isAdmin = useMemo(() => currentUserProfile?.role === 'admin', [currentUserProfile]);

  // Only attempt to fetch all users if the current user is confirmed to be an admin.
  const { data: users, loading: usersLoading } = useCollection<UserProfile>(isAdmin ? 'users' : null);

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

  // Show skeleton loader while verifying auth/role or loading users.
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

  // At this point, we are sure the user is an admin and `users` data is available.
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Add, edit, and manage users and their roles.
        </p>
      </div>
      {/* `users` will be an array here (it could be empty) because the query only runs for admins. */}
      <UsersTable initialUsers={users || []} />
    </div>
  );
}


export default function UsersPage() {
    return <UsersPageContent />;
}
