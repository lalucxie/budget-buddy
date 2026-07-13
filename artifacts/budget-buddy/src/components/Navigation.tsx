import { Link, useLocation } from "react-router-dom";
import { House, Plus, Target, Heart, Sparkles } from "lucide-react";

export function Navigation() {
  const location = useLocation();
  const path = location.pathname;

  const navItem = (to: string, Icon: React.FC<any>, label: string) => {
    const active = path === to;
    return (
      <Link to={to} className="flex flex-col items-center gap-1 group" aria-label={label}>
        <Icon
          size={22}
          strokeWidth={1.5}
          className={`transition-colors duration-200 ${
            active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
          }`}
        />
        {active && <div className="w-1 h-1 rounded-full bg-primary" />}
      </Link>
    );
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-[400px] mx-auto">
      <div className="glass-card flex items-center justify-between px-6 py-3 shadow-lg relative">
        {navItem("/dashboard", House, "Home")}
        {navItem("/goals", Target, "Goals")}

        {/* Center add button */}
        <div className="relative -top-6">
          <Link
            to="/add"
            aria-label="Add expense"
            className="w-14 h-14 rounded-full gradient-btn flex items-center justify-center absolute -translate-x-1/2 left-1/2 shadow-xl hover:scale-110 transition-transform"
          >
            <Plus size={28} strokeWidth={2} className="text-white" />
          </Link>
        </div>

        {navItem("/pet", Heart, "Pet")}
        {navItem("/insights", Sparkles, "Insights")}
      </div>
    </div>
  );
}
