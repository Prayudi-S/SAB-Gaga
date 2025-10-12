import type { Metadata } from "next";
import Header from "@/components/header";

export const metadata: Metadata = {
  title: "Dashboard | SAB Gaga Payments",
  description: "Payment management dashboard for SAB Gaga.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-grow p-4 md:p-8 lg:p-12">{children}</main>
    </div>
  );
}
