"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import type { Payment, UserProfile } from '@/lib/types';
import { useFirestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const paymentSchema = z.object({
  residentId: z.string().min(1, "Resident is required."),
  amount: z.coerce.number().min(1, "Amount must be greater than 0."),
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2020)
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

type RecordPaymentDialogProps = {
  residents: UserProfile[];
  onPaymentRecorded: (payment: Payment) => void;
  children: React.ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
};

const months = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: format(new Date(0, i), "MMMM", { locale: id }),
}));

export function RecordPaymentDialog({ residents, onPaymentRecorded, children, open, setOpen }: RecordPaymentDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      amount: 75000,
      residentId: '',
    },
  });

  const onSubmit = async (values: PaymentFormValues) => {
    if (!firestore) return;

    const newPaymentData = {
      ...values,
      status: 'Paid',
      paymentDate: serverTimestamp(),
    };
    
    const collectionRef = collection(firestore, 'payments');

    try {
      const docRef = await addDoc(collectionRef, newPaymentData);
      
      const newPaymentObject: Payment = {
        ...values,
        id: docRef.id,
        status: 'Paid',
        paymentDate: new Date().toISOString(),
      };
      
      onPaymentRecorded(newPaymentObject);
      toast({
        title: "Payment Recorded",
        description: `Payment for ${residents.find(r => r.id === values.residentId)?.fullName} has been successfully recorded.`,
        className: 'bg-green-100 border-green-300 text-green-900'
      });
      setOpen(false);
      form.reset();

    } catch (serverError: any) {
        const permissionError = new FirestorePermissionError({
            path: collectionRef.path,
            operation: 'create',
            requestResourceData: newPaymentData,
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Record New Payment</DialogTitle>
          <DialogDescription>
            Fill in the details below to record a new payment.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
            <FormField
              control={form.control}
              name="residentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resident</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a resident" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {residents.map((resident) => (
                        <SelectItem key={resident.id} value={resident.id}>
                          {resident.fullName} ({resident.houseNumber})
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
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (IDR)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="75000" {...field} />
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
                     <Select onValueChange={(val) => field.onChange(Number(val))} defaultValue={String(field.value)}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select month" />
                        </Trigger>
                      </FormControl>
                      <SelectContent>
                        {months.map((month) => (
                          <SelectItem key={month.value} value={String(month.value)}>
                            {month.label}
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
                      <Input type="number" placeholder="2024" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Recording...' : 'Record Payment'}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
