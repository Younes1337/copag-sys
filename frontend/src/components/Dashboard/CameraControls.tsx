import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, Camera, CameraOff } from "lucide-react";
import { motion } from "framer-motion";

export const CameraControls = ({ 
  isActive, 
  onStartCamera, 
  onStopCamera, 
  isConnected = false 
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleStartCamera = async () => {
    console.log('Start camera button clicked!');
    setIsLoading(true);
    try {
      // Call the parent handler - camera access will be handled in VideoFeed
      console.log('Calling onStartCamera...');
      onStartCamera();
    } catch (error) {
      console.error('Error starting camera:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopCamera = () => {
    onStopCamera();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3"
    >
      {!isActive ? (
        <Button
          onClick={handleStartCamera}
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Starting Camera...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4" />
              <span>Start Camera</span>
            </div>
          )}
        </Button>
      ) : (
        <Button
          onClick={handleStopCamera}
          variant="destructive"
          className="bg-destructive hover:bg-destructive/90 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 hover:scale-105"
        >
          <div className="flex items-center gap-2">
            <CameraOff className="w-4 h-4" />
            <span>Stop Camera</span>
          </div>
        </Button>
      )}

      {/* Connection Status */}
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
        <span className="text-sm text-muted-foreground">
          {isActive ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </motion.div>
  );
};
