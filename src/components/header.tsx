'use client'

import Image from "next/image";
import Link from "next/link";
import { LogOut, User, Droplets } from "lucide-react";

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

export default function Header() {
  const userAvatar = PlaceHolderImages.find(image => image.id === 'user-avatar');

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-primary px-4 sm:px-6 shadow-md">
      <Link href="/dashboard" className="flex items-center gap-2 text-lg font-semibold text-primary-foreground md:text-base">
        <Droplets className="h-6 w-6" />
        <span className="font-headline text-xl">SAB Gaga</span>
      </Link>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex-1 sm:flex-initial">
          {/* Search bar could go here */}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-primary">
              <Avatar>
                {userAvatar && <AvatarImage src={userAvatar.imageUrl} alt="User Avatar" data-ai-hint={userAvatar.imageHint} />}
                <AvatarFallback>AG</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Admin Gaga</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
