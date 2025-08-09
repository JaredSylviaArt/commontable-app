import { Wifi, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Wifi className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">You're offline</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            It looks like you've lost your internet connection. Some features may not be available until you're back online.
          </p>
          
          <div className="space-y-2 text-sm text-left bg-muted/50 p-3 rounded">
            <p className="font-medium">You can still:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Browse previously viewed listings</li>
              <li>Read cached messages</li>
              <li>View your saved items</li>
            </ul>
          </div>
          
          <Button onClick={handleRetry} className="w-full">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="w-full"
          >
            Go back
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
