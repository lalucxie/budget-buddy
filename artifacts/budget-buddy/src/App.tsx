import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Navigation } from "@/components/Navigation";
import Landing from "@/pages/landing";
import Setup from "@/pages/setup";
import Dashboard from "@/pages/dashboard";
import AddExpense from "@/pages/add";
import Goals from "@/pages/goals";
import Insights from "@/pages/insights";
import Pet from "@/pages/pet";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

// Layout with Navigation
function AppLayout() {
  return (
    <div className="max-w-[430px] mx-auto min-h-screen relative pb-24 shadow-2xl bg-gradient-to-br from-[#E8D5F5] to-[#FFD6E7] overflow-x-hidden">
      <Outlet />
      <Navigation />
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
            <Route element={<AppLayout />}>
              <Route path="/setup" element={<Setup />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/add" element={<AddExpense />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/pet" element={<Pet />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;