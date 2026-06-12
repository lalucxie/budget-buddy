import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Navigation } from "@/components/Navigation";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import Landing from "@/pages/landing";
import Setup from "@/pages/setup";
import Dashboard from "@/pages/dashboard";
import AddExpense from "@/pages/add";
import Goals from "@/pages/goals";
import Insights from "@/pages/insights";
import Pet from "@/pages/pet";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function ProtectedRoute() {
  const { user, loading } = useAuth();
  const { profile, loading: profileLoading } = useProfile(user?.id);

  if (loading || profileLoading) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E8D5F5] to-[#FFD6E7]">
        <div className="text-center space-y-3">
          <div className="text-5xl float inline-block">💰</div>
          <p className="text-muted-foreground text-sm font-medium animate-pulse">loading your vibe...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (!profile?.onboarding_complete) return <Navigate to="/setup" replace />;

  return (
    <div className="max-w-[430px] mx-auto min-h-screen relative pb-24 shadow-2xl bg-gradient-to-br from-[#E8D5F5] to-[#FFD6E7] overflow-x-hidden">
      <Outlet />
      <Navigation />
    </div>
  );
}

function SetupRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E8D5F5] to-[#FFD6E7]">
        <div className="text-center space-y-3">
          <div className="text-5xl float inline-block">💰</div>
          <p className="text-muted-foreground text-sm font-medium animate-pulse">loading your vibe...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="max-w-[430px] mx-auto min-h-screen relative shadow-2xl bg-gradient-to-br from-[#E8D5F5] to-[#FFD6E7] overflow-x-hidden">
      <Setup />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Routes>
            <Route path="/" element={
              <div className="max-w-[430px] mx-auto min-h-screen relative shadow-2xl bg-gradient-to-br from-[#E8D5F5] to-[#FFD6E7] overflow-x-hidden">
                <Landing />
              </div>
            } />
            <Route path="/setup" element={<SetupRoute />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/add" element={<AddExpense />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/pet" element={<Pet />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
