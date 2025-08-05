
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth";
import { LayoutGrid, LogOut, Mail, Settings, User as UserIcon, Loader2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export function UserNav() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      toast({ title: "Success", description: "Logged out successfully." });
      router.push('/login');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Sign Out Failed",
        description: error.message,
      });
    }
  };

  if (loading) {
    return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />;
  }
  
  if (!user) {
    return (
      <Button asChild>
        <Link href="/login">Log In</Link>
      </Button>
    )
  }

  const generateGradientUrl = (id: string) => {
    // Simple hash function to get a number from a string
    const hashCode = (s: string) => s.split('').reduce((a,b) => (((a << 5) - a) + b.charCodeAt(0))|0, 0);
    const hash = Math.abs(hashCode(id));
    
    // Generate two distinct hues
    const hue1 = hash % 360;
    const hue2 = (hue1 + 120) % 360; // 120 degrees apart for contrast

    return `https://placehold.co/128x128.png/000000/FFFFFF?text=%20&bg-gradient=linear-gradient(135deg, hsl(${hue1}, 80%, 70%), hsl(${hue2}, 80%, 70%))`;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.photoURL || generateGradientUrl(user.uid)} alt={user.displayName || "User"} />
            <AvatarFallback>{user.displayName ? user.displayName.charAt(0) : <UserIcon />}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName || 'User'}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <Link href="/dashboard">
            <DropdownMenuItem>
              <LayoutGrid className="mr-2" />
              <span>Dashboard</span>
            </DropdownMenuItem>
          </Link>
           <Link href="/messages">
            <DropdownMenuItem>
                <Mail className="mr-2" />
              <span>Messages</span>
            </DropdownMenuItem>
          </Link>
          <Link href="/dashboard?tab=profile">
            <DropdownMenuItem>
              <Settings className="mr-2" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
