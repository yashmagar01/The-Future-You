import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Stat Card Skeleton for Dashboard
export const StatCardSkeleton = () => (
  <Card className="border-border/50">
    <CardHeader className="pb-2">
      <Skeleton className="h-4 w-24" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-4 w-32" />
    </CardContent>
  </Card>
);

// Gallery Card Skeleton
export const GalleryCardSkeleton = () => (
  <Card className="overflow-hidden border-border/50">
    <Skeleton className="h-48 w-full" />
    <CardContent className="p-4 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-5 w-16" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </CardContent>
  </Card>
);

// Chart Skeleton for Dashboard
export const ChartSkeleton = () => (
  <Card className="border-border/50">
    <CardHeader>
      <Skeleton className="h-6 w-40 mb-2" />
      <Skeleton className="h-4 w-56" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-[250px] w-full" />
    </CardContent>
  </Card>
);

// List Item Skeleton
export const ListItemSkeleton = () => (
  <div className="flex items-start gap-3 pb-4 border-b border-border/50">
    <Skeleton className="h-10 w-10 rounded-lg" />
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
  </div>
);

// Full Page Loading (for transitions)
export const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="relative w-16 h-16 mx-auto">
        <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
        <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
      </div>
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Button Loading State
export const ButtonLoader = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
    <span>Processing...</span>
  </div>
);
