import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Dashboard/Sidebar";
import { TopBar } from "@/components/Dashboard/TopBar";
import { SafetyScore } from "@/components/Dashboard/SafetyScore";
import { DetailsPanel } from "@/components/Dashboard/DetailsPanel";
import { BehaviorChart } from "@/components/Dashboard/BehaviorChart";
import { AIInsights } from "@/components/Dashboard/AIInsights";
import { VideoFeed } from "@/components/Dashboard/VideoFeed";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Search, Maximize, Settings as SettingsIcon, Minimize } from "lucide-react";

const Index = () => {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const { toast } = useToast();
  const { isConnected, lastMessage } = useWebSocket("ws://localhost:8000/ws");

  const mockBehaviorData = [
    { time: "07:20 AM", speed: 40, events: [] },
    { time: "07:40 AM", speed: 85, events: ["speeding"] },
    { time: "08:00 AM", speed: 65, events: [] },
    { time: "08:20 AM", speed: 45, events: ["harsh_braking"] },
    { time: "08:40 AM", speed: 75, events: [] },
    { time: "09:00 AM", speed: 55, events: ["harsh_braking"] },
    { time: "09:20 AM", speed: 90, events: [] },
  ];

  const aiInsights = [
    { label: "Fatigue Detected", value: "No" },
    { label: "Distraction", value: "No" },
    { label: "Yawning", value: "7 times", sublabel: "last in 35 minutes" },
    { label: "Eye Closure Time", value: "1.2 s" },
  ];

  const driverDetails = [
    { label: "Distance Travelled", value: "161 km" },
    { label: "Driving Duration", value: "6h 42m" },
    { label: "Idle Time", value: "28 minutes" },
    { label: "Trip Count", value: "6 trips" },
    { label: "Fuel Used", value: "8.2 L" },
    { label: "Fuel Efficiency", value: "12.2 km/L" },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <Sidebar />
      
      <div className="ml-16">
        <TopBar
          driverName="Reynald Carbonara"
          driverId="002837407"
          vehicleInfo="Mitsubishi Fuso - XY9980AB"
          date="Wed, 1 March 2025"
        />

        <div className="p-8">
          <div className="grid grid-cols-12 gap-6">
            {/* Main Content */}
            <div className="col-span-8 space-y-6">
              {/* Video Feed */}
              <div className="bg-white border border-border rounded-lg overflow-hidden">
                <div className="relative aspect-video bg-secondary">
                  <div className="absolute top-3 left-3 px-3 py-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded">
                    Camera 1 (Driver Face Cam)
                  </div>
                  <div className="absolute top-3 right-3 px-3 py-1 bg-black/50 backdrop-blur-sm text-white text-xs rounded">
                    01/03/25 09:26:10
                  </div>
                  
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                      <div className="w-12 h-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                    </div>
                    <p className="text-muted-foreground text-sm">Connecting to camera feed...</p>
                  </div>

                  <AIInsights insights={aiInsights} />

                  <div className="absolute bottom-4 right-4 flex items-center gap-2">
                    <Button variant="secondary" size="icon" className="w-8 h-8 bg-black/50 backdrop-blur-sm hover:bg-black/60">
                      <Search className="w-4 h-4 text-white" />
                    </Button>
                    <Button variant="secondary" size="icon" className="w-8 h-8 bg-black/50 backdrop-blur-sm hover:bg-black/60">
                      <Minimize className="w-4 h-4 text-white" />
                    </Button>
                    <Button variant="secondary" size="icon" className="w-8 h-8 bg-black/50 backdrop-blur-sm hover:bg-black/60">
                      <SettingsIcon className="w-4 h-4 text-white" />
                    </Button>
                    <Button variant="secondary" size="icon" className="w-8 h-8 bg-black/50 backdrop-blur-sm hover:bg-black/60">
                      <Maximize className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                </div>

                {/* Thumbnail */}
                <div className="p-3 border-t border-border">
                  <div className="w-32 h-20 bg-secondary rounded" />
                </div>
              </div>

              {/* Behavior Chart */}
              <BehaviorChart data={mockBehaviorData} />
            </div>

            {/* Right Sidebar */}
            <div className="col-span-4 space-y-6">
              <div className="flex gap-2 mb-2">
                <Button variant="outline" className="flex-1 text-sm">
                  General
                </Button>
                <Button variant="ghost" className="flex-1 text-sm text-muted-foreground">
                  Tracking
                </Button>
                <Button variant="ghost" className="flex-1 text-sm text-muted-foreground">
                  Performance
                </Button>
              </div>

              <SafetyScore score={87} change={2} />
              <DetailsPanel details={driverDetails} />

              {/* Trip Details */}
              <div className="bg-white border border-border rounded-lg p-6">
                <h3 className="text-sm font-medium text-muted-foreground mb-4">Trip Details</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Destination</p>
                      <p className="text-sm font-medium">008 Northshire Road, Hulme, Manchester</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Transit B</p>
                      <p className="text-sm font-medium">321 Winchester St, Leith, Edinburgh</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-500 mt-2" />
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">Transit A</p>
                      <p className="text-sm font-medium">886 Leinded St, Digbeth, Birmingham</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Validation */}
              <div className="bg-muted/50 border border-border rounded-lg p-3 text-xs text-muted-foreground">
                ✓ Validated via GPS Telematics from TGRS
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
