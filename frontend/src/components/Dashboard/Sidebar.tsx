import { Shield } from "lucide-react";

export const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-16 bg-white border-r border-border flex flex-col items-center py-6">
      <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
        <Shield className="w-6 h-6 text-white" />
      </div>
    </aside>
  );
};
