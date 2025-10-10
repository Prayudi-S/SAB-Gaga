'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addDoc, collection, serverTimestamp, query, orderBy, getDocs, where } from 'firebase/firestore';
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
  residentId: z.string().min(1, 'Resident UID is required.'),
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

  const { data: currentUserProfile, loading: profileLoading } = useDoc<UserProfile>(user ? `users/${user.id}` : null);
  
  const userRole = useMemo(() => currentUserProfile?.role, [currentUserProfile]);

  useEffect(() => {
    if (userLoading || profileLoading) {
      return; 
    }

    if (!user) {
      router.push('/'); 
      return;
    }
    
    async function fetchData() {
        if (!firestore || !userRole) return;
        setPageLoading(true);
        try {
            let readingsData: MeterReading[] = [];
            // Admin/Petugas can see all readings and all users
            if (userRole === 'admin' || userRole === 'petugas') {
                const usersSnapshot = await getDocs(query(collection(firestore, 'users')));
                const usersData = usersSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as UserProfile));
                setUsers(usersData);

                const readingsSnapshot = await getDocs(query(collection(firestore, 'meterReadings'), orderBy('recordedAt', 'desc')));
                readingsData = readingsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MeterReading));
            } 
            // Regular user can only see their own readings
            else if (userRole === 'user') {
                const readingsQuery = query(
                    collection(firestore, 'meterReadings'), 
                    where('residentId', '==', user.id),
                    orderBy('recordedAt', 'desc')
                );
                const readingsSnapshot = await getDocs(readingsQuery);
                readingsData = readingsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MeterReading));
                // For a regular user, the 'users' map only needs their own profile
                if(currentUserProfile) {
                    setUsers([currentUserProfile]);
                }
            }
            setReadings(readingsData);

        } catch (error: any) {
            console.error("Error fetching data:", error);
            const permissionError = new FirestorePermissionError({
                path: error.customData?.path || 'users or meterReadings',
                operation: 'list',
            });
            errorEmitter.emit('permission-error', permissionError);
        } finally {
            setPageLoading(false);
        }
    }

    fetchData();
    
  }, [user, userLoading, currentUserProfile, profileLoading, userRole, firestore, router, toast]);

  const userMap = useMemo(() => {
    return new Map(users.map(u => [u.id, u.fullName]));
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
      recordedBy: user.id,
      recordedAt: serverTimestamp(),
    };

    const collectionRef = collection(firestore, 'meterReadings');
    
    addDoc(collectionRef, newReadingData).then(docRef => {
        toast({
            title: 'Reading Recorded',
            description: `Meter reading has been recorded for user UID ${data.residentId}.`,
            className: 'bg-green-100 border-green-300 text-green-900',
        });
        
        const optimisticReading: MeterReading = {
            ...newReadingData,
            id: docRef.id,
            recordedAt: new Date(),
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
  
  if (userLoading || profileLoading || pageLoading) {
    const isOperator = userRole === 'admin' || userRole === 'petugas';
    return (
       <div className={`grid gap-8 ${isOperator ? 'lg:grid-cols-3' : 'lg:grid-cols-1'}`}>
        {isOperator && (
            <div className="lg:col-span-1">
                <Skeleton className="h-[550px] w-full" />
            </div>
        )}
        <div className={isOperator ? "lg:col-span-2" : "lg:col-span-1"}>
            <Skeleton className="h-[550px] w-full" />
        </div>
      </div>
    );
  }

  const renderFormForOperators = () => (
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Record Meter Usage</CardTitle>
            <CardDescription>
              Fill the form to record a new water meter reading. Please enter the Resident UID.
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
                      <FormLabel>Resident UID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter user's unique ID" {...field} />
                      </FormControl>
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
  );

  const historyCardClass = userRole === 'user' ? 'lg:col-span-1' : 'lg:col-span-2';

  return (
    <div className={`grid gap-8 ${userRole === 'user' ? 'lg:grid-cols-1' : 'lg:grid-cols-3'}`}>
      { (userRole === 'admin' || userRole === 'petugas') && renderFormForOperators() }

      <div className={historyCardClass}>
        <Card>
          <CardHeader>
            <CardTitle>{userRole === 'user' ? 'My Meter Reading History' : 'All Meter Reading History'}</CardTitle>
            <CardDescription>A log of {userRole === 'user' ? 'your' : 'all'} recorded meter readings.</CardDescription>
          </CardHeader>
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
                        <TableCell className="font-medium">{userMap.get(reading.residentId) || reading.residentId}</TableCell>
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
