import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, Banknote, AlertCircle, CheckCircle2 } from "lucide-react";
import type { Payment, UserProfile } from "@/lib/types";

type DashboardStatsProps = {
  payments: Payment[];
  residents: UserProfile[];
};

export default function DashboardStats({ payments, residents }: DashboardStatsProps) {
  const totalResidents = residents.length;
  const paidPayments = payments.filter((p) => p.status === 'Paid');
  const unpaidPayments = payments.filter((p) => p.status === 'Unpaid');

  const totalPaid = paidPayments.reduce((acc, p) => acc + p.amount, 0);
  const totalUnpaid = unpaidPayments.reduce((acc, p) => acc + p.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Residents</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalResidents}</div>
          <p className="text-xs text-muted-foreground">Active water subscribers</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
          <p className="text-xs text-muted-foreground">From {paidPayments.length} transactions</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Unpaid</CardTitle>
          <AlertCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalUnpaid)}</div>
          <p className="text-xs text-muted-foreground">From {unpaidPayments.length} pending bills</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          <Banknote className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{unpaidPayments.length}</div>
          <p className="text-xs text-muted-foreground">Residents with outstanding bills</p>
        </CardContent>
      </Card>
    </div>
  );
}
