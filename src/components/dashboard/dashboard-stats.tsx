
"use client"

import { mockListings } from "@/lib/mock-data"
import { DollarSign, Gift, Package, Repeat } from "lucide-react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"

export function DashboardStats() {
  const myListings = mockListings.filter(l => l.author.id === "user-1");

  const totalListings = myListings.length;
  const itemsSold = myListings.filter(l => l.category === "Sell").length;
  const itemsGiven = myListings.filter(l => l.category === "Give").length;
  const itemsShared = myListings.filter(l => l.category === "Share").length;

  return (
    <div className="space-y-6">
      {/* Compact Stats Cards */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 hover:shadow-md transition-all duration-200 border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Listings</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalListings}</p>
            </div>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Package className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4 hover:shadow-md transition-all duration-200 border-0 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Items Sold</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{itemsSold}</p>
            </div>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4 hover:shadow-md transition-all duration-200 border-0 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Items Given</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{itemsGiven}</p>
            </div>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Gift className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </Card>
        
        <Card className="p-4 hover:shadow-md transition-all duration-200 border-0 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Items Shared</p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{itemsShared}</p>
            </div>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Repeat className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
