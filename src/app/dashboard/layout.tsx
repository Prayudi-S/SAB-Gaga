'use client';

import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import Header from "@/components/header";
import { Droplets } from "lucide-react";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Droplets className="h-12 w-12 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-grow p-4 md:p-8 lg:p-12">{children}</main>
    </div>
  );
}
