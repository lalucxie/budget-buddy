import { Link, useLocation } from "react-router-dom";
import { Home, Plus, Star, Footprints, Sparkles } from "lucide-react";

export function Navigation() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-[400px] mx-auto">
      <div className="glass-card flex items-center justify-between px-6 py-3 shadow-lg relative">
        <Link to="/dashboard" className="flex flex-col items-center gap-1 group">
          <Home className={`w-6 h-6 transition-colors ${currentPath === '/dashboard' ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
          {currentPath === '/dashboard' && <div className="w-1 h-1 rounded-full bg-primary" />}
        </Link>
        <Link to="/goals" className="flex flex-col items-center gap-1 group">
          <Star className={`w-6 h-6 transition-colors ${currentPath === '/goals' ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
          {currentPath === '/goals' && <div className="w-1 h-1 rounded-full bg-primary" />}
        </Link>

        {/* Center Add Button */}
        <div className="relative -top-6">
          <Link to="/add" className="w-14 h-14 rounded-full gradient-btn flex items-center justify-center absolute -translate-x-1/2 left-1/2 shadow-xl hover:scale-110 transition-transform">
            <Plus className="w-8 h-8 text-white" />
          </Link>
        </div>

        <Link to="/pet" className="flex flex-col items-center gap-1 group">
          <Footprints className={`w-6 h-6 transition-colors ${currentPath === '/pet' ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
          {currentPath === '/pet' && <div className="w-1 h-1 rounded-full bg-primary" />}
        </Link>
        <Link to="/insights" className="flex flex-col items-center gap-1 group">
          <Sparkles className={`w-6 h-6 transition-colors ${currentPath === '/insights' ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`} />
          {currentPath === '/insights' && <div className="w-1 h-1 rounded-full bg-primary" />}
        </Link>
      </div>
    </div>
  );
}