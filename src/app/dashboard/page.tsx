'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, getDocs } from 'firebase/firestore';

import DashboardStats from "@/components/dashboard-stats";
import PaymentTable from "@/components/payment-table";
import { useUser, useDoc, useFirestore } from '@/firebase';
import { Skeleton } from '@/components/ui/skeleton';
import type { UserProfile, Payment } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

function DashboardContent() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  
  const { data: userProfile, loading: profileLoading } = useDoc<UserProfile>(user?.uid ? `users/${user.uid}` : null);
  
  const [payments, setPayments] = React.useState<Payment[]>([]);
  const [residents, setResidents] = React.useState<UserProfile[]>([]);
  const [dataLoading, setDataLoading] = React.useState(true);

  const loading = userLoading || profileLoading || dataLoading;
  const userRole = useMemo(() => userProfile?.role, [userProfile]);
  
  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/');
    }

    if (userLoading || profileLoading) return;

    async function fetchData() {
        if (!firestore || !userRole) return;

        setDataLoading(true);
        try {
            if (userRole === 'admin' || userRole === 'petugas') {
                const [paymentsSnapshot, residentsSnapshot] = await Promise.all([
                    getDocs(query(collection(firestore, 'payments'))),
                    getDocs(query(collection(firestore, 'users')))
                ]);
                setPayments(paymentsSnapshot.docs.map(doc => ({...doc.data(), id: doc.id} as Payment)));
                setResidents(residentsSnapshot.docs.map(doc => ({...doc.data(), id: doc.id} as UserProfile)));
            } else { // 'user'
                 const paymentsQuery = query(collection(firestore, 'payments'), where('residentId', '==', user?.uid));
                 const paymentsSnapshot = await getDocs(paymentsQuery);
                 setPayments(paymentsSnapshot.docs.map(doc => ({...doc.data(), id: doc.id} as Payment)));
                 if (userProfile) {
                    setResidents([userProfile]);
                 }
            }
        } catch (e) {
            console.error("Failed to fetch dashboard data:", e);
        } finally {
            setDataLoading(false);
        }
    }

    fetchData();

  }, [user, userLoading, userProfile, profileLoading, userRole, firestore, router]);


  if (loading) {
    return (
        <div className="flex flex-col gap-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className="h-32" />
                <Skeleton className-="h-32" />
            </div>
            <Skeleton className="h-96" />
        </div>
    );
  }

  // Admin and Petugas view
  if (userRole === 'admin' || userRole === 'petugas') {
      return (
        <div className="flex flex-col gap-8">
          <DashboardStats payments={payments} residents={residents} />
          <PaymentTable initialPayments={payments} residents={residents} userRole={userRole} />
        </div>
      );
  }

  // Regular user view
  return (
    <div className="space-y-8">
       <Card>
        <CardHeader>
            <CardTitle>Welcome, {userProfile?.fullName || 'User'}!</CardTitle>
            <CardDescription>This is your personal dashboard where you can see your payment history.</CardDescription>
        </CardHeader>
       </Card>
      <PaymentTable initialPayments={payments} residents={userProfile ? [userProfile] : []} userRole={userRole} />
    </div>
  )
}

export default function DashboardPage() {
    return <DashboardContent />;
}
