import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import Auth from "./pages/Auth";
import EmailConfirmed from "./pages/EmailConfirmed";
import Onboarding from "./pages/Onboarding";
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

// ── Loading splash ─────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <div className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg"
          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
          <span className="text-white font-black text-xl">DD</span>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}

// ── Redirect logged-in users away from /auth ───────────────────────
function RedirectIfAuth() {
  const { session, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (session) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

// ── Require auth — gate for all protected routes ───────────────────
function RequireAuth() {
  const { session, profile, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;

  // Not logged in → auth page
  if (!session) return <Navigate to="/auth" replace />;

  // Logged in but hasn't completed onboarding → onboarding page
  // Skip onboarding for team members (employees/managers who have company_id set by create_team_member)
  if (profile && !profile.company_id && profile.role !== 'super_admin') {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <CompanyProvider>
      <Outlet />
    </CompanyProvider>
  );
}

// ── Onboarding guard — only for logged-in users without company ────
function RequireOnboarding() {
  const { session, profile, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (!session) return <Navigate to="/auth" replace />;
  // Already onboarded → dashboard
  if (profile?.company_id || profile?.role === 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}

// ── Role guard — blocks employees from restricted routes ───────────
function RequireRole({ allowed }: { allowed: string[] }) {
  const { profile, isLoading } = useAuth();
  if (isLoading) return <LoadingScreen />;
  if (profile && !allowed.includes(profile.role)) {
    return <Navigate to="/clients" replace />;
  }
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
            {/* Public: Auth + Email confirmed */}
            <Route element={<RedirectIfAuth />}>
              <Route path="/auth" element={<Auth />} />
            </Route>
            <Route path="/email-confirmed" element={<EmailConfirmed />} />

            {/* Semi-protected: Onboarding (logged in, no company yet) */}
            <Route element={<RequireOnboarding />}>
              <Route path="/onboarding" element={<Onboarding />} />
            </Route>

            {/* Fully protected: App */}
            <Route element={<RequireAuth />}>
              <Route element={<AppLayout />}>
                {/* Employee-blocked routes (owner / manager / admin / super_admin only) */}
                <Route element={<RequireRole allowed={['owner', 'admin', 'manager', 'super_admin']} />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/reports"   element={<Reports />} />
                </Route>

                {/* Open to all roles */}
                <Route path="/clients"   element={<Clients />} />
                <Route path="/pipeline"  element={<Pipeline />} />
                <Route path="/invoices"  element={<Invoices />} />
                <Route path="/contracts" element={<Contracts />} />
                <Route path="/projects"  element={<Projects />} />
                <Route path="/messages"  element={<Messages />} />
                <Route path="/settings"  element={<Settings />} />
              </Route>
            </Route>

            {/* Root redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
