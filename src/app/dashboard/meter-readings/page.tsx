'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDoc, collection, serverTimestamp, query, orderBy, getDocs } from 'firebase/firestore';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useUser, useDoc, useFirestore } from '@/firebase';
import type { UserProfile, MeterReading } from '@/lib/types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Skeleton } from '@/components/ui/skeleton';

const readingSchema = z.object({
  residentId: z.string().min(1, 'Resident is required.'),
  reading: z.coerce.number().min(0, 'Reading must be a positive number.'),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020).max(new Date().getFullYear() + 5),
});

type ReadingFormValues = z.infer<typeof readingSchema>;

const months = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: format(new Date(0, i), 'MMMM', { locale: id }),
}));

export default function MeterReadingsPage() {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const userProfilePath = useMemo(() => (user ? `users/${user.uid}` : null), [user]);
  const { data: currentUserProfile, loading: profileLoading } = useDoc<UserProfile>(userProfilePath);
  
  const canRecord = useMemo(() => currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'petugas', [currentUserProfile]);

  useEffect(() => {
    // Phase 1: Wait for auth and profile to finish loading.
    if (userLoading || profileLoading) {
      return; // Wait until we know who the user is and what their role is.
    }

    // Phase 2: Handle redirection or authorization.
    if (!user) {
      router.push('/'); // Not logged in, redirect.
      return;
    }

    if (!currentUserProfile) {
      // Logged in but profile doesn't exist.
      toast({
          variant: 'destructive',
          title: 'Profile Not Found',
          description: 'Could not load your user profile. Redirecting...',
      });
      router.push('/dashboard');
      return;
    }
    
    // User is logged in and has a profile. Now check role.
    if (!canRecord) {
      toast({
          variant: 'destructive',
          title: 'Access Denied',
          description: 'You do not have permission to view this page.',
      });
      router.push('/dashboard');
      return;
    }

    // Phase 3: User is authorized (admin/petugas). Fetch all necessary data.
    async function fetchData() {
        if (!firestore) return;
        setPageLoading(true); // Start loading page data.
        try {
            // Fetch all users for the dropdown
            const usersQuery = query(collection(firestore, 'users'));
            const usersSnapshot = await getDocs(usersQuery);
            const usersData = usersSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id } as UserProfile));
            setUsers(usersData);

            // Fetch all meter readings for the history table
            const readingsQuery = query(collection(firestore, 'meterReadings'), orderBy('recordedAt', 'desc'));
            const readingsSnapshot = await getDocs(readingsQuery);
            const readingsData = readingsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MeterReading));
            setReadings(readingsData);

        } catch (error: any) {
            console.error("Failed to fetch data:", error);
            // Let the error emitter handle permission errors, but show a toast for other errors.
            if (!(error instanceof FirestorePermissionError)) {
               toast({
                    variant: 'destructive',
                    title: 'Failed to load data',
                    description: error.message || 'Could not fetch necessary data from Firestore.',
                });
            }
        } finally {
            setPageLoading(false); // Finish loading page data.
        }
    }

    fetchData();
    
  // The dependency array ensures this effect runs only when the user/profile/auth state changes.
  }, [user, userLoading, currentUserProfile, profileLoading, canRecord, firestore, router, toast]);

  const userMap = useMemo(() => {
    return new Map(users.map(u => [u.uid, u.fullName]));
  }, [users]);

  const form = useForm<ReadingFormValues>({
    resolver: zodResolver(readingSchema),
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      reading: 0,
      residentId: '',
    },
  });

  const onSubmit = async (data: ReadingFormValues) => {
    if (!firestore || !user) return;

    const newReadingData = {
      ...data,
      recordedBy: user.uid,
      recordedAt: serverTimestamp(),
    };

    const collectionRef = collection(firestore, 'meterReadings');
    
    addDoc(collectionRef, newReadingData).then(docRef => {
        toast({
            title: 'Reading Recorded',
            description: `Meter reading for ${userMap.get(data.residentId)} has been recorded.`,
            className: 'bg-green-100 border-green-300 text-green-900',
        });
        
        // Optimistically update the UI
        const optimisticReading: MeterReading = {
            ...newReadingData,
            id: docRef.id,
            recordedAt: new Date(), // Use current date for immediate feedback
        };
        setReadings(prev => [optimisticReading, ...prev]);

        form.reset({
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
            reading: 0,
            residentId: ''
        });
    }).catch(serverError => {
        const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: newReadingData,
        });
        errorEmitter.emit('permission-error', permissionError);
    });
  };

  // Show a full page skeleton while we verify authentication and authorization.
  // This state persists until we know if the user is an admin/petugas and have fetched data.
  if (userLoading || profileLoading || pageLoading) {
    return (
       <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
            <Skeleton className="h-[550px] w-full" />
        </div>
        <div className="lg:col-span-2">
            <Skeleton className="h-[550px] w-full" />
        </div>
      </div>
    );
  }
  
  // This check is a safeguard. If the user isn't authorized, the effect above should have already redirected them.
  // Returning null prevents any rendering attempt if the redirection is pending.
  if (!canRecord) {
      return null;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Record Meter Usage</CardTitle>
            <CardDescription>
              Fill the form to record a new water meter reading.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="residentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Resident</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a resident" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users?.map((u) => (
                            <SelectItem key={u.uid} value={u.uid}>
                              {u.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reading"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meter Reading (m³)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g. 125" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Month</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {months.map((m) => (
                              <SelectItem key={m.value} value={String(m.value)}>
                                {m.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? 'Recording...' : 'Record Usage'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Meter Reading History</CardTitle>
            <CardDescription>A log of all recorded meter readings.</CardDescription>
          </Header>
          <CardContent>
             <div className="rounded-md border">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Resident</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Reading (m³)</TableHead>
                    <TableHead>Recorded On</TableHead>
                    <TableHead>Recorded By</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {readings && readings.length > 0 ? (
                    readings.map(reading => (
                        <TableRow key={reading.id}>
                        <TableCell className="font-medium">{userMap.get(reading.residentId) || 'Unknown'}</TableCell>
                        <TableCell>{months.find(m => m.value === reading.month)?.label} {reading.year}</TableCell>
                        <TableCell>{reading.reading}</TableCell>
                        <TableCell>
                            {reading.recordedAt && (reading.recordedAt as any).seconds ? 
                                format(new Date((reading.recordedAt as any).seconds * 1000), 'dd MMMM yyyy, HH:mm', { locale: id }) 
                                : 'Just now'}
                        </TableCell>
                        <TableCell>{userMap.get(reading.recordedBy) || 'Unknown'}</TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                        No readings recorded yet.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
