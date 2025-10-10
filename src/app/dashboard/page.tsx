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
  
  // Conditionally fetch user profile from Firestore only when user is available
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(user?.uid ? `users/${user.uid}` : null);

  const loading = userLoading || (user && profileLoading);
  
  useEffect(() => {
    if (!userLoading && !user) {
      // If user loading is finished and there's no user, redirect immediately.
      router.push('/');
      return;
    }

    if (!loading && user) {
      // If all loading is finished and there is a user
      if (userProfile?.role !== 'admin') {
        router.push('/');
      }
    }
  }, [user, userProfile, userLoading, loading, router]);

  // Show skeleton loader while user or profile is loading, or if the user is not an admin yet.
  if (loading || !user || userProfile?.role !== 'admin') {
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

  // Render dashboard content only for admin users.
  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <DashboardStats payments={payments} residents={residents} />
      <PaymentTable initialPayments={payments} residents={residents} />
    </div>
  );
}

// Wrapper component to use hooks conditionally
function ConditionalDashboard() {
  const { user, loading } = useUser();

  // Render DashboardContent only when we have a user object,
  // or we are still in the loading phase.
  // The redirection logic is handled inside DashboardContent.
  if (loading || user) {
    return <DashboardContent />;
  }

  // If not loading and no user, we can show a loader or redirect here as a fallback,
  // though the useEffect in DashboardContent should handle it.
  return (
    <div className="flex flex-col gap-4 md:gap-8 p-4 md:p-8">
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

export default function DashboardPage() {
    return <ConditionalDashboard />;
}
