'use client'

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { LogOut, User, Droplets, Users, SlidersHorizontal, BookText, Menu } from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import { useRouter, usePathname } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useUser, useDoc } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import type { UserProfile } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function Header() {
  const userAvatar = PlaceHolderImages.find(image => image.id === 'user-avatar');
  const { user } = useUser();
  const { data: userProfile } = useDoc<UserProfile>(user?.uid ? `users/${user.uid}` : null);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
      router.push('/');
    } catch (error) {
      console.error("Logout error:", error);
      toast({ variant: "destructive", title: "Logout Failed", description: "Could not log you out. Please try again." });
    }
  };

  const handleMobileNav = (href: string) => {
    router.push(href);
    setIsMobileMenuOpen(false);
  };

  const getInitials = (email?: string | null) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  }
  
  const isAdminOrPetugas = userProfile?.role === 'admin' || userProfile?.role === 'petugas';

  const navLinkClasses = (href: string) => cn(
    "transition-colors flex items-center gap-2",
    pathname === href ? "text-primary-foreground" : "text-primary-foreground/70 hover:text-primary-foreground"
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-primary px-4 sm:px-6 shadow-md">
      <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-primary-foreground md:text-base">
        <Droplets className="h-6 w-6" />
        <span className="font-headline text-xl">SAB Gaga</span>
      </Link>
      
      {/* Mobile Menu Button */}
      {userProfile && (
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-primary-foreground">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Droplets className="h-5 w-5" />
                  SAB Gaga
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-4 mt-6">
                <Button
                  variant={pathname === "/dashboard" ? "default" : "ghost"}
                  className="justify-start"
                  onClick={() => handleMobileNav("/dashboard")}
                >
                  Dashboard
                </Button>
                {userProfile?.role === 'admin' && (
                  <Button
                    variant={pathname === "/dashboard/users" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => handleMobileNav("/dashboard/users")}
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Users
                  </Button>
                )}
                {(userProfile?.role === 'admin' || userProfile?.role === 'petugas') && (
                  <Button
                    variant={pathname === "/dashboard/meter-record" ? "default" : "ghost"}
                    className="justify-start"
                    onClick={() => handleMobileNav("/dashboard/meter-record")}
                  >
                    <BookText className="mr-2 h-4 w-4" />
                    Meter Record
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      )}
      
      {/* Desktop Navigation */}
      {userProfile && (
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
           <Link href="/dashboard" className={navLinkClasses("/dashboard")}>
            Dashboard
          </Link>
          {userProfile?.role === 'admin' && (
             <Link href="/dashboard/users" className={navLinkClasses("/dashboard/users")}>
                <Users className="h-4 w-4" />
                Users
            </Link>
          )}
           {(userProfile?.role === 'admin' || userProfile?.role === 'petugas') && (
            <>
            <Link href="/dashboard/meter-record" className={navLinkClasses("/dashboard/meter-record")}>
                <BookText className="h-4 w-4" />
                Meter Record (New)
            </Link>
            </>
           )}
        </nav>
      )}

      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          {/* Search bar could go here */}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-primary">
              <Avatar>
                {user?.photoURL ? (
                  <AvatarImage src={user.photoURL} alt="User Avatar" />
                ) : userAvatar ? (
                  <AvatarImage src={userAvatar.imageUrl} alt="User Avatar" data-ai-hint={userAvatar.imageHint} />
                ) : null }
                <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{userProfile?.fullName || user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
