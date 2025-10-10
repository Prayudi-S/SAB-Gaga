'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardStats from "@/components/dashboard-stats";
import PaymentTable from "@/components/payment-table";
import { residents, payments } from "@/lib/data";
import { useUser, useDoc } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile } from '@/lib/types';

function DashboardContent() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(user?.uid ? `users/${user.uid}` : null);

  const loading = userLoading || (user && profileLoading);
  
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
      return;
    }

    if (!loading && user && userProfile) {
      if (userProfile.role !== 'admin') {
        router.push('/');
      }
    }
  }, [user, userProfile, userLoading, loading, router]);

  if (loading || !user || !userProfile || userProfile.role !== 'admin') {
    return (
        <div className="flex flex-col gap-4 md:gap-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
                <Skeleton className="h-28" />
            </div>
            <Skeleton className="h-96" />
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <DashboardStats payments={payments} residents={residents} />
      <PaymentTable initialPayments={payments} residents={residents} />
    </div>
  );
}

export default function DashboardPage() {
    return <DashboardContent />;
}
