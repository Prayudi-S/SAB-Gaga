'use client';

import { useDoc, useUser, useFirestore } from '@/firebase';
import type { UserProfile } from '@/lib/types';
import UsersTable from '@/components/users-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


export default function UsersPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const { data: currentUserProfile, loading: profileLoading } = useDoc<UserProfile>(
    user ? `users/${user.uid}` : null
  );
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const isAdmin = currentUserProfile?.role === 'admin';
  const isLoading = userLoading || profileLoading || (isAdmin && usersLoading);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
      return;
    }
    
    if (!profileLoading && currentUserProfile && currentUserProfile.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    if (isAdmin && firestore) {
      const fetchUsers = async () => {
        setUsersLoading(true);
        try {
          const usersSnapshot = await getDocs(query(collection(firestore, 'users')));
          const usersData = usersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as UserProfile));
          setUsers(usersData);
        } catch (error: any) {
          console.error("Failed to fetch users:", error);
          const permissionError = new FirestorePermissionError({
              path: 'users',
              operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
        } finally {
          setUsersLoading(false);
        }
      };
      fetchUsers();
    } else if (!isAdmin && !userLoading && !profileLoading) {
      setUsersLoading(false);
    }
  }, [user, userLoading, currentUserProfile, profileLoading, isAdmin, firestore, router]);

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
