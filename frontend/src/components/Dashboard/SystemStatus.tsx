import { Server, Cpu, Camera, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

interface SystemStatusProps {
  backend: boolean;
  aiModel: boolean;
  camera: boolean;
  telegram: boolean;
}

export const SystemStatus = ({ backend, aiModel, camera, telegram }: SystemStatusProps) => {
  const services = [
    { name: "Backend Server", icon: Server, status: backend },
    { name: "AI Model", icon: Cpu, status: aiModel },
    { name: "Camera Feed", icon: Camera, status: camera },
    { name: "Telegram Bot", icon: MessageSquare, status: telegram },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      <h2 className="text-xl font-semibold mb-4">System Status</h2>

      <div className="space-y-3">
        {services.map((service, index) => (
          <motion.div
            key={service.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <service.icon className={`w-5 h-5 ${service.status ? "text-success" : "text-muted-foreground"}`} />
              <span className="text-sm font-medium">{service.name}</span>
            </div>
            <Badge variant={service.status ? "default" : "secondary"}>
              <div className={`w-2 h-2 rounded-full mr-2 ${
                service.status ? "bg-success animate-pulse-glow" : "bg-muted-foreground"
              }`} />
              {service.status ? "Online" : "Offline"}
            </Badge>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};
