'use client'

import Image from "next/image";
import Link from "next/link";
import { LogOut, User, Droplets, Users } from "lucide-react";
import { getAuth, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useUser } from "@/firebase";
import { useToast } from "@/hooks/use-toast";

export default function Header() {
  const userAvatar = PlaceHolderImages.find(image => image.id === 'user-avatar');
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

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

  const getInitials = (email?: string | null) => {
    if (!email) return 'U';
    return email.substring(0, 2).toUpperCase();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-primary px-4 sm:px-6 shadow-md">
      <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-primary-foreground md:text-base">
        <Droplets className="h-6 w-6" />
        <span className="font-headline text-xl">SAB Gaga</span>
      </Link>
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
            href="/dashboard/users"
            className="text-primary-foreground/70 transition-colors hover:text-primary-foreground"
          >
            Users
        </Link>
      </nav>
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
            <DropdownMenuLabel>{user?.email || 'Admin'}</DropdownMenuLabel>
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
