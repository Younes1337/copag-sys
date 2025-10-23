import { useState, useEffect } from "react";
import { Sidebar } from "@/components/Dashboard/Sidebar";
import { TopBar } from "@/components/Dashboard/TopBar";
import { SafetyScore } from "@/components/Dashboard/SafetyScore";
// Removed DetailsPanel import
// Removed BehaviorChart import
import { AIInsights } from "@/components/Dashboard/AIInsights";
import { VideoFeed } from "@/components/Dashboard/VideoFeed";
import { EyeMetrics } from "@/components/Dashboard/EyeMetrics";
import { DistractionPieChart } from "@/components/Dashboard/DistractionPieChart";
import { useToast } from "@/hooks/use-toast";
import { useInference } from "@/hooks/useInference";
import { Eye, AlertTriangle, Activity, Zap, Brain, Wifi } from "lucide-react";

const Index = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const { toast } = useToast();
  
  // Initialize inference hook for real-time detection
  const {
    isInitialized: isInferenceInitialized,
    isLoading: isInferenceLoading,
    error: inferenceError,
    detections,
    detectionCounts,
    initializeModel,
    startInference,
    stopInference
  } = useInference();

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

  // Removed driver details section


  // Initialize inference model on component mount
  useEffect(() => {
    if (!isInferenceInitialized && !isInferenceLoading) {
      initializeModel();
    }
  }, [isInferenceInitialized, isInferenceLoading, initializeModel]);

  // Start/stop inference when camera is activated/deactivated
  useEffect(() => {
    if (isCameraActive && isInferenceInitialized && videoElement) {
      startInference(videoElement);
    } else if (!isCameraActive) {
      stopInference();
    }
  }, [isCameraActive, isInferenceInitialized, videoElement, startInference, stopInference]);


  // Distraction analysis data - use real-time detection counts
  const distractionData = [
    {
      name: "Dangerous Driving",
      value: Number(detectionCounts["DangerousDriving"]) || 0,
      color: "#dc2626", // Red
      icon: AlertTriangle
    },
    {
      name: "Distracted",
      value: Number(detectionCounts["Distracted"]) || 0,
      color: "#f59e0b", // Orange
      icon: Eye
    },
    {
      name: "Drinking",
      value: Number(detectionCounts["Drinking"]) || 0,
      color: "#8b5cf6", // Purple
      icon: Activity
    },
    {
      name: "Yawn",
      value: Number(detectionCounts["Yawn"]) || 0,
      color: "#84cc16", // Lime
      icon: Activity
    },
    {
      name: "Safe Driving",
      value: Number(detectionCounts["SafeDriving"]) || 0,
      color: "#10b981", // Green
      icon: Eye
    }
  ];

  const handleStartCamera = () => {
    console.log('handleStartCamera called in Index component');
    setIsCameraActive(true);
    setIsMonitoring(true);
    
    toast({
      title: "Camera Started",
      description: "Driver monitoring camera is now active with AI inference",
    });
  };

  const handleStopCamera = () => {
    setIsCameraActive(false);
    setIsMonitoring(false);
    stopInference(); // Stop inference when camera stops
    
    toast({
      title: "Camera Stopped",
      description: "Driver monitoring camera has been stopped",
    });
  };

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
              {/* Video Feed with Camera Controls */}
              <VideoFeed 
                isActive={isCameraActive}
                onStartCamera={handleStartCamera}
                onStopCamera={handleStopCamera}
                isConnected={true}
                onVideoElement={setVideoElement}
              />

              {/* Real-time Eye Metrics */}
              <EyeMetrics 
                isActive={isCameraActive}
                videoElement={videoElement}
              />
            </div>

            {/* Right Sidebar */}
            <div className="col-span-4 space-y-6">
              <SafetyScore score={87} change={2} />
              
              {/* Distraction Analysis Pie Chart */}
              <DistractionPieChart distractionData={distractionData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
