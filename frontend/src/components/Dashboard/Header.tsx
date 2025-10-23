import { Activity, Video, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  isConnected: boolean;
  isMonitoring: boolean;
  onToggleMonitoring: () => void;
}

export const Header = ({ isConnected, isMonitoring, onToggleMonitoring }: HeaderProps) => {
  return (
    <header className="glass-card p-4 mb-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Video className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Driver Monitor</h1>
            <p className="text-sm text-muted-foreground">AI-Powered Safety System</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Badge 
          variant={isConnected ? "default" : "destructive"}
          className="gap-2"
        >
          {isConnected ? (
            <>
              <Wifi className="w-4 h-4" />
              Connected
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4" />
              Disconnected
            </>
          )}
        </Badge>

        <Button
          onClick={onToggleMonitoring}
          variant={isMonitoring ? "destructive" : "default"}
          size="lg"
          className="gap-2"
        >
          <Activity className="w-5 h-5" />
          {isMonitoring ? "Stop Monitoring" : "Start Monitoring"}
        </Button>
      </div>
    </header>
  );
};
