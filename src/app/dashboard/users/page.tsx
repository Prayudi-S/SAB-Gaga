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

  const { data: users, loading: usersLoading } = useCollection<UserProfile>(isAdmin ? 'users' : null);

  const isLoading = userLoading || profileLoading || (isAdmin && usersLoading);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
      return;
    }
    if (!profileLoading && currentUserProfile && currentUserProfile.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, userLoading, currentUserProfile, profileLoading, router]);

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
