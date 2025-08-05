
"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { mockListings } from "@/lib/mock-data"
import { DollarSign, Gift, Package, Repeat } from "lucide-react"

const chartData = [
  { category: "Give", count: 1 },
  { category: "Sell", count: 2 },
  { category: "Share", count: 1 },
]

const chartConfig = {
  count: {
    label: "Count",
    color: "hsl(var(--primary))",
  },
}

export function DashboardStats() {
  const myListings = mockListings.filter(l => l.author.id === "user-1");

  const totalListings = myListings.length;
  const itemsSold = myListings.filter(l => l.category === "Sell").length;
  const itemsGiven = myListings.filter(l => l.category === "Give").length;
  const itemsShared = myListings.filter(l => l.category === "Share").length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalListings}</div>
          <p className="text-xs text-muted-foreground">
            Number of items you've listed
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{itemsSold}</div>
          <p className="text-xs text-muted-foreground">
            Items you've sold for a price
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Items Given</CardTitle>
          <Gift className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{itemsGiven}</div>
          <p className="text-xs text-muted-foreground">
            Items you've given away for free
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Items Shared</CardTitle>
          <Repeat className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{itemsShared}</div>
          <p className="text-xs text-muted-foreground">
            Resources you've shared with others
          </p>
        </CardContent>
      </Card>
       <Card className="lg:col-span-4">
        <CardHeader>
          <CardTitle className="font-headline">Listings Overview</CardTitle>
          <CardDescription>A breakdown of your listings by category.</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ChartContainer config={chartConfig}>
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="category"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
               <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                allowDecimals={false}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Bar dataKey="count" fill="var(--color-count)" radius={8} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
