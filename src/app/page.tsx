import Link from "next/link";
import { Droplets } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
            <div className="bg-primary rounded-full p-4">
                <Droplets className="h-10 w-10 text-primary-foreground" />
            </div>
        </div>
        <Card className="shadow-2xl">
            <CardHeader className="text-center">
            <CardTitle className="font-headline text-3xl">
                SAB Gaga Payments
            </CardTitle>
            <CardDescription>
                Login to manage water bill payments.
            </CardDescription>
            </CardHeader>
            <CardContent>
            <form className="grid gap-4">
                <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required />
                </div>
                <Button asChild type="submit" className="w-full mt-2">
                    <Link href="/dashboard">Sign In</Link>
                </Button>
            </form>
            </CardContent>
        </Card>
        <p className="text-center text-sm text-muted-foreground mt-6">
            New user?{" "}
            <Link href="/register" className="font-semibold text-primary hover:underline">
                Register here
            </Link>
        </p>
      </div>
    </main>
  );
}
