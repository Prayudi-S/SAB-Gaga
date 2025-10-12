'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, getDocs, where } from 'firebase/firestore';

import { useUser, useDoc, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

function DashboardContent() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(user?.uid ? `users/${user.uid}` : null);
  
  const [dataLoading, setDataLoading] = useState(true);

  const loading = userLoading || profileLoading || dataLoading;
  
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
      return;
    }

    if (user && userProfile) {
        setDataLoading(false);
    }

  }, [user, userLoading, userProfile, profileLoading, router]);


  if (loading) {
    return (
        <div className="flex flex-col gap-8">
            <Skeleton className="h-48" />
            <Skeleton className="h-96" />
        </div>
    );
  }

  return (
    <div className="space-y-8">
       <Card>
        <CardHeader>
            <CardTitle>Welcome, {userProfile?.fullName || 'User'}!</CardTitle>
            <CardDescription>This is your personal dashboard. More features coming soon!</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-4">
                <h3 className="font-semibold text-lg">Your Information</h3>
                <div className="rounded-md border p-4 space-y-2">
                    <p><strong>Email:</strong> {userProfile?.email}</p>
                    <p><strong>House Number:</strong> {userProfile?.houseNumber}</p>
                    <p><strong>Customer ID:</strong> {userProfile?.meterId}</p>
                    <p><strong>Role:</strong> {userProfile?.role}</p>
                </div>
            </div>
        </CardContent>
       </Card>
      
    </div>
  )
}

export default function DashboardPage() {
    return <DashboardContent />;
}
