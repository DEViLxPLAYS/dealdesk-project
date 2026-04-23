import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import Pipeline from "./pages/Pipeline";
import Invoices from "./pages/Invoices";
import Contracts from "./pages/Contracts";
import Projects from "./pages/Projects";
import Messages from "./pages/Messages";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

// ── Auth guard: only lets authenticated users through ──────────────
function RequireAuth() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)' }}>
            <span className="text-white font-black text-lg">DD</span>
          </div>
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <CompanyProvider>
      <Outlet />
    </CompanyProvider>
  );
}

// ── Redirect logged-in users away from auth page ──────────────────
function RedirectIfAuth() {
  const { session, isLoading } = useAuth();
  if (isLoading) return null;
  if (session) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" richColors />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route element={<RedirectIfAuth />}>
              <Route path="/auth" element={<Auth />} />
            </Route>

            {/* Protected routes */}
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/clients"   element={<Clients />} />
                <Route path="/pipeline"  element={<Pipeline />} />
                <Route path="/invoices"  element={<Invoices />} />
                <Route path="/contracts" element={<Contracts />} />
                <Route path="/projects"  element={<Projects />} />
                <Route path="/messages"  element={<Messages />} />
                <Route path="/reports"   element={<Reports />} />
                <Route path="/settings"  element={<Settings />} />
              </Route>
            </Route>

            {/* Redirects & 404 */}
            <Route path="/"  element={<Navigate to="/dashboard" replace />} />
            <Route path="*"  element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
