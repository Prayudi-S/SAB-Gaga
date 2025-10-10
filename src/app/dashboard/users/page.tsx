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

  const { data: users, loading: usersLoading } = useCollection<UserProfile>('users');
  const { data: currentUserProfile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.uid}` : null);

  const isLoading = userLoading || usersLoading || profileLoading;

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
      return;
    }
    if (!profileLoading && currentUserProfile && currentUserProfile.role !== 'admin') {
      router.push('/dashboard');
    }
  }, [user, userLoading, currentUserProfile, profileLoading, router]);


  if (isLoading || !currentUserProfile || currentUserProfile.role !== 'admin') {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] w-full" />
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
      {users && <UsersTable initialUsers={users} />}
    </div>
  );
}
