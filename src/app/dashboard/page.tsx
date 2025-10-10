'use client';

import { useEffect } from 'react';
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

  const loading = userLoading || profileLoading;
  
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
    }
  }, [user, userLoading, router]);

  // Show a skeleton loader while user/profile are loading
  if (loading) {
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

  // Once loaded, you can render content based on the role
  // For now, let's assume non-admins see a different dashboard (or are redirected)
  // This logic can be expanded.
  if (userProfile?.role === 'admin') {
      return (
        <div className="flex flex-col gap-4 md:gap-8">
          <DashboardStats payments={payments} residents={residents} />
          <PaymentTable initialPayments={payments} residents={residents} />
        </div>
      );
  }

  // Default view for non-admins (e.g., 'petugas' or 'user')
  return (
    <div>
      <h1 className="text-3xl font-bold">Welcome, {userProfile?.fullName || 'User'}!</h1>
      <p className="text-muted-foreground">This is your dashboard.</p>
      {/* TODO: Add content specific to non-admin users here */}
    </div>
  )
}

export default function DashboardPage() {
    return <DashboardContent />;
}
