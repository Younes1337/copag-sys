import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  variant?: "default" | "success" | "warning" | "destructive";
}

export const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue,
  variant = "default" 
}: StatsCardProps) => {
  const variantClasses = {
    default: "border-primary/30",
    success: "border-success/30 glow-success",
    warning: "border-warning/30 glow-warning",
    destructive: "border-destructive/30 glow-destructive",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-6 ${variantClasses[variant]}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
          variant === "success" ? "bg-success/20" :
          variant === "warning" ? "bg-warning/20" :
          variant === "destructive" ? "bg-destructive/20" :
          "bg-primary/20"
        }`}>
          <Icon className={`w-6 h-6 ${
            variant === "success" ? "text-success" :
            variant === "warning" ? "text-warning" :
            variant === "destructive" ? "text-destructive" :
            "text-primary"
          }`} />
        </div>
        {trend && trendValue && (
          <div className={`text-sm font-medium ${
            trend === "up" ? "text-success" :
            trend === "down" ? "text-destructive" :
            "text-muted-foreground"
          }`}>
            {trendValue}
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-3xl font-bold mb-1">{value}</h3>
        <p className="text-sm text-muted-foreground">{title}</p>
      </div>
    </motion.div>
  );
};
