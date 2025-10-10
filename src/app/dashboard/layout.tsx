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
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  );
}
