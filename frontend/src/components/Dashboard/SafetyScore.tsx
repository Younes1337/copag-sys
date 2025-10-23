import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

interface SafetyScoreProps {
  score: number;
  change: number;
}

export const SafetyScore = ({ score, change }: SafetyScoreProps) => {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-white border border-border rounded-lg p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Safety Score</h3>
      
      <div className="relative w-32 h-32 mx-auto">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r="45"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="8"
          />
          <motion.circle
            cx="64"
            cy="64"
            r="45"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold">{score}</span>
          <div className="flex items-center gap-1 text-success text-xs font-medium mt-1">
            <TrendingUp className="w-3 h-3" />
            +{change}
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground text-center mt-4">
        The driver meets safety standards and follows the rules of safe driving.
      </p>
    </div>
  );
};
