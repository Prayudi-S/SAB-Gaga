import DashboardStats from "@/components/dashboard-stats";
import PaymentTable from "@/components/payment-table";
import { residents, payments } from "@/lib/data";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4 md:gap-8">
      <DashboardStats payments={payments} residents={residents} />
      <PaymentTable initialPayments={payments} residents={residents} />
    </div>
  );
}
