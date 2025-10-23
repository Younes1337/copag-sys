import { MapPin, Clock, Fuel, Zap } from "lucide-react";

interface DetailItem {
  label: string;
  value: string;
  icon?: any;
}

interface DetailsPanelProps {
  details: DetailItem[];
}

export const DetailsPanel = ({ details }: DetailsPanelProps) => {
  return (
    <div className="bg-white border border-border rounded-lg p-6">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Details</h3>
      
      <div className="space-y-4">
        {details.map((detail, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{detail.label}</span>
            <span className="text-sm font-medium">{detail.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
