import { ChevronLeft, ChevronRight, Calendar, ExternalLink, HelpCircle, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TopBarProps {
  driverName: string;
  driverId: string;
  vehicleInfo: string;
  date: string;
}

export const TopBar = ({ driverName, driverId, vehicleInfo, date }: TopBarProps) => {
  return (
    <div className="bg-white border-b border-border px-8 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Monitoring</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm font-medium">{driverName}</span>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <HelpCircle className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8 relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </Button>
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
            B
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">{driverName}</h1>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span>ID {driverId}</span>
            <span>•</span>
            <span>West Logistics Fleet A</span>
            <span>•</span>
            <span>{vehicleInfo}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="gap-2">
            <Calendar className="w-4 h-4" />
            {date}
          </Button>
          <Button variant="ghost" size="icon" className="w-8 h-8">
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button variant="outline" className="gap-2">
            View Profile
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
