import { Sparkles, ChevronUp, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";

interface InsightItem {
  label: string;
  value: string;
  sublabel?: string;
}

interface AIInsightsProps {
  insights: InsightItem[];
}

export const AIInsights = ({ insights }: AIInsightsProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm border border-border rounded-lg p-3"
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-xs font-medium">AI Insights</span>
        <ChevronUp className="w-4 h-4 ml-auto text-muted-foreground" />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {insights.map((insight, index) => (
          <div key={index} className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{insight.label}</span>
            <div className="flex items-center gap-1">
              <span className="font-medium">{insight.value}</span>
              {insight.sublabel && (
                <span className="text-muted-foreground text-xs">{insight.sublabel}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
