import { Plus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { UserNav } from "./user-nav"
import { Button } from "./ui/button"
import Link from "next/link"
import { Logo } from "./icons"
import { SidebarTrigger } from "./ui/sidebar"

export default function Header() {
  return (
    <header className="sticky top-0 z-10 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center px-4 md:px-8">
        <div className="flex items-center gap-2 mr-4">
            <SidebarTrigger className="md:hidden" />
            <Link href="/" className="hidden md:flex items-center gap-2">
                <Logo className="w-6 h-6 text-primary" />
                <h2 className="text-lg font-headline font-semibold">CommonTable</h2>
            </Link>
        </div>

        <div className="flex-1 md:flex justify-center">
           <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for anything..."
              className="pl-9 bg-muted border-none focus-visible:ring-primary"
            />
          </div>
        </div>
        <div className="flex items-center justify-end space-x-2 ml-4">
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 shrink-0">
            <Link href="/listings/new">
                <Plus className="md:mr-2 h-4 w-4" />
                <span className="hidden md:inline">Create Listing</span>
            </Link>
          </Button>
          <UserNav />
        </div>
      </div>
    </header>
  )
}
