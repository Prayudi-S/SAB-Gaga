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
import type { Payment, Resident } from '@/lib/types';
import { RecordPaymentDialog } from './record-payment-dialog';

type PaymentTableProps = {
  initialPayments: Payment[];
  residents: Resident[];
};

export default function PaymentTable({ initialPayments, residents }: PaymentTableProps) {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const residentMap = useMemo(() => {
    return new Map(residents.map(r => [r.id, r.name]));
  }, [residents]);

  const handlePaymentRecorded = (newPayment: Omit<Payment, 'id'>) => {
    const paymentWithId = { ...newPayment, id: `pay-${Date.now()}` };
    setPayments(prev => [paymentWithId, ...prev]);
  };

  const togglePaymentStatus = (paymentId: string) => {
    setPayments(prevPayments =>
      prevPayments.map(p => {
        if (p.id === paymentId) {
          const isNowPaid = p.status === 'Unpaid';
          return {
            ...p,
            status: isNowPaid ? 'Paid' : 'Unpaid',
            paymentDate: isNowPaid ? new Date().toISOString() : undefined,
          };
        }
        return p;
      })
    );
  };
  
  const getMonthName = (monthNumber: number) => {
      const date = new Date();
      date.setMonth(monthNumber - 1);
      return format(date, "MMMM", { locale: id });
  }

  const renderPayments = (paymentList: Payment[]) => {
    const filteredList = paymentList.filter(payment => {
      const residentName = residentMap.get(payment.residentId) || '';
      return residentName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (filteredList.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-24 text-center">
            No results found.
          </TableCell>
        </TableRow>
      );
    }

    return filteredList.map(payment => (
      <TableRow key={payment.id}>
        <TableCell className="font-medium">
          {residentMap.get(payment.residentId) || 'Unknown'}
        </TableCell>
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
        <TableCell>
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
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    ));
  };
  
  const tabs = {
    All: payments,
    Paid: payments.filter(p => p.status === 'Paid'),
    Unpaid: payments.filter(p => p.status === 'Unpaid'),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Payment Records</CardTitle>
        <CardDescription>Manage and track resident payments.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="All">
          <div className="flex items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="All">All</TabsTrigger>
              <TabsTrigger value="Paid">Paid</TabsTrigger>
              <TabsTrigger value="Unpaid">Unpaid</TabsTrigger>
            </TabsList>
            <div className="flex items-center gap-2">
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
            </div>
          </div>
          {Object.entries(tabs).map(([key, value]) => (
            <TabsContent value={key} key={key}>
              <div className="mt-4 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resident</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid On</TableHead>
                      <TableHead>
                        <span className="sr-only">Actions</span>
                      </TableHead>
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
  );
}
