import { Home, Video, Users, TrendingUp, Settings, Shield } from "lucide-react";
import { motion } from "framer-motion";

export const Sidebar = () => {
  const menuItems = [
    { icon: Home, active: false },
    { icon: Video, active: false },
    { icon: Shield, active: true },
    { icon: Users, active: false },
    { icon: TrendingUp, active: false },
    { icon: Settings, active: false },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-16 bg-white border-r border-border flex flex-col items-center py-6 gap-6">
      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mb-4">
        <Shield className="w-6 h-6 text-white" />
      </div>

      <nav className="flex-1 flex flex-col gap-4">
        {menuItems.map((item, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
              item.active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <item.icon className="w-5 h-5" />
          </motion.button>
        ))}
      </nav>
    </aside>
  );
};
