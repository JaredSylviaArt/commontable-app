import { Plus, Search, Menu, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { UserNav } from "./user-nav"
import { Button } from "./ui/button"
import Link from "next/link"
import { Logo } from "./icons"
import { SidebarTrigger } from "./ui/sidebar"
import { Breadcrumb } from "./ui/breadcrumb"
import { usePathname } from "next/navigation"
import { useState } from "react"

export default function Header() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Generate breadcrumbs based on current path
  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs = []
    
    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`
      const label = segment.charAt(0).toUpperCase() + segment.slice(1)
      
      if (index === segments.length - 1) {
        breadcrumbs.push({ label, href: undefined })
      } else {
        breadcrumbs.push({ label, href: currentPath })
      }
    })
    
    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center px-4 md:px-8">
        <div className="flex items-center gap-3 mr-4">
            <SidebarTrigger className="md:hidden hover:bg-accent rounded-md p-2 transition-colors" />
        </div>

        <div className="flex-1 md:flex justify-center">
           <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for anything..."
              className="pl-9 bg-background border-input focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all duration-200"
            />
          </div>
        </div>
        
        <div className="flex items-center justify-end space-x-3 ml-4">
          <Button className="btn-primary hover-lift hidden md:flex" onClick={() => window.location.href = '/listings/new'}>
            <Plus className="mr-2 h-4 w-4" />
            <span>Create Listing</span>
          </Button>
          
          <UserNav />
          
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <div className="border-t border-border/50 bg-muted/30">
          <div className="container px-4 md:px-8 py-2">
            <Breadcrumb items={breadcrumbs} />
          </div>
        </div>
      )}
      
      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur">
          <div className="container px-4 py-4 space-y-3">
            <Button className="w-full justify-start" variant="ghost" onClick={() => { window.location.href = '/listings/new'; setIsMobileMenuOpen(false); }}>
              <Plus className="mr-2 h-4 w-4" />
              Create Listing
            </Button>
            <Button className="w-full justify-start" variant="ghost" onClick={() => { window.location.href = '/dashboard'; setIsMobileMenuOpen(false); }}>
              Dashboard
            </Button>
            <Button className="w-full justify-start" variant="ghost" onClick={() => { window.location.href = '/messages'; setIsMobileMenuOpen(false); }}>
              Messages
            </Button>
            <Button className="w-full justify-start" variant="ghost" onClick={() => { window.location.href = '/dashboard?tab=profile'; setIsMobileMenuOpen(false); }}>
              Settings
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
