import { Video, Play } from "lucide-react";
import { motion } from "framer-motion";

interface VideoFeedProps {
  isActive: boolean;
}

export const VideoFeed = ({ isActive }: VideoFeedProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-6 glow-primary"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Video className="w-5 h-5 text-primary" />
          Live Video Feed
        </h2>
        {isActive && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive animate-pulse-glow" />
            <span className="text-sm text-destructive font-medium">LIVE</span>
          </div>
        )}
      </div>

      <div className="relative aspect-video bg-secondary/50 rounded-lg overflow-hidden border border-primary/20">
        {isActive ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                <Video className="w-10 h-10 text-primary" />
              </div>
              <p className="text-muted-foreground">Camera feed will appear here</p>
              <p className="text-sm text-muted-foreground mt-2">Connect to backend at ws://localhost:8000/ws</p>
            </div>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Play className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Click Start Monitoring to begin</p>
            </div>
          </div>
        )}

        {/* AI Detection Overlay */}
        {isActive && (
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="glass-card px-4 py-2">
              <span className="text-sm font-medium text-success">✓ AI Detection Active</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};
