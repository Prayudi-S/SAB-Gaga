"use client";

import React, { useState, useMemo } from 'react';
import { MoreHorizontal, PlusCircle, Search } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Payment, UserProfile } from '@/lib/types';
import { RecordPaymentDialog } from './record-payment-dialog';
import { useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';


type PaymentTableProps = {
  initialPayments: Payment[];
  residents: UserProfile[];
  userRole: 'admin' | 'petugas' | 'user';
};

export default function PaymentTable({ initialPayments, residents, userRole }: PaymentTableProps) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<Payment | null>(null);
  const firestore = useFirestore();
  const { toast } = useToast();

  const residentMap = useMemo(() => {
    return new Map(residents.map(r => [r.id, r.fullName]));
  }, [residents]);

  const handlePaymentRecorded = (newPayment: Payment) => {
    setPayments(prev => [newPayment, ...prev]);
  };
  
  const togglePaymentStatus = (paymentId: string) => {
    const payment = payments.find(p => p.id === paymentId);
    if (!payment || !firestore) return;

    const newStatus = payment.status === 'Unpaid' ? 'Paid' : 'Unpaid';
    const paymentUpdate = {
      status: newStatus,
      paymentDate: newStatus === 'Paid' ? serverTimestamp() : null,
    };

    const docRef = doc(firestore, 'payments', paymentId);
    updateDoc(docRef, paymentUpdate)
      .then(() => {
        setPayments(prev =>
          prev.map(p => p.id === paymentId ? { ...p, status: newStatus, paymentDate: new Date().toISOString() } : p)
        );
        toast({ title: "Status Updated", description: `Payment marked as ${newStatus}.` });
      })
      .catch(serverError => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'update',
          requestResourceData: paymentUpdate,
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const handleDeletePayment = () => {
    if (!paymentToDelete || !firestore) return;
    const docRef = doc(firestore, 'payments', paymentToDelete.id);
    deleteDoc(docRef)
      .then(() => {
        setPayments(prev => prev.filter(p => p.id !== paymentToDelete.id));
        toast({ title: 'Payment Deleted', description: 'Payment record has been removed.' });
        setPaymentToDelete(null);
      })
      .catch(serverError => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
        setPaymentToDelete(null);
      });
  };
  
  const getMonthName = (monthNumber: number) => {
      const date = new Date();
      date.setMonth(monthNumber - 1);
      return format(date, "MMMM", { locale: id });
  }
  
  const canManage = userRole === 'admin' || userRole === 'petugas';

  const renderPayments = (paymentList: Payment[]) => {
    const filteredList = paymentList.filter(payment => {
      const residentName = residentMap.get(payment.residentId) || '';
      return residentName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (filteredList.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={canManage ? 6 : 4} className="h-24 text-center">
            No results found.
          </TableCell>
        </TableRow>
      );
    }

    return filteredList.map(payment => (
      <TableRow key={payment.id}>
        {canManage && <TableCell className="font-medium">
          {residentMap.get(payment.residentId) || 'Unknown'}
        </TableCell>}
        <TableCell>{getMonthName(payment.month)} {payment.year}</TableCell>
        <TableCell>
          {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(payment.amount)}
        </TableCell>
        <TableCell>
          <Badge variant={payment.status === 'Paid' ? 'default' : 'destructive'} className={payment.status === 'Paid' ? 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30' : 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30'}>
            {payment.status}
          </Badge>
        </TableCell>
        <TableCell>
          {payment.paymentDate ? format(new Date(payment.paymentDate), 'dd MMMM yyyy', { locale: id }) : 'N/A'}
        </TableCell>
        {canManage && <TableCell>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button aria-haspopup="true" size="icon" variant="ghost">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => togglePaymentStatus(payment.id)}>
                {payment.status === 'Unpaid' ? 'Mark as Paid' : 'Mark as Unpaid'}
              </DropdownMenuItem>
              {userRole === 'admin' && <DropdownMenuItem
                className="text-red-600"
                onClick={() => setPaymentToDelete(payment)}
                >
                Delete
              </DropdownMenuItem>}
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>}
      </TableRow>
    ));
  };
  
  const tabs = {
    All: payments,
    Paid: payments.filter(p => p.status === 'Paid'),
    Unpaid: payments.filter(p => p.status === 'Unpaid'),
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">
          {canManage ? 'Payment Records' : 'My Payment History'}
        </CardTitle>
        <CardDescription>
          {canManage ? 'Manage and track resident payments.' : 'A log of all your past payments.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="All">
          <div className="flex items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="All">All</TabsTrigger>
              <TabsTrigger value="Paid">Paid</TabsTrigger>
              <TabsTrigger value="Unpaid">Unpaid</TabsTrigger>
            </TabsList>
            {canManage && <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by name..."
                  className="pl-8 sm:w-[300px]"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <RecordPaymentDialog
                residents={residents}
                onPaymentRecorded={handlePaymentRecorded}
                open={isDialogOpen}
                setOpen={setIsDialogOpen}
              >
                  <Button size="sm" className="gap-1">
                    <PlusCircle className="h-4 w-4" />
                    Record Payment
                  </Button>
              </RecordPaymentDialog>
            </div>}
          </div>
          {Object.entries(tabs).map(([key, value]) => (
            <TabsContent value={key} key={key}>
              <div className="mt-4 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {canManage && <TableHead>Resident</TableHead>}
                      <TableHead>Period</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid On</TableHead>
                      {canManage && <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {renderPayments(value)}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
     <AlertDialog open={!!paymentToDelete} onOpenChange={(open) => !open && setPaymentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the payment record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPaymentToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePayment}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
