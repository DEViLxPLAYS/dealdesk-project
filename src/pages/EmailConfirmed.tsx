import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmailConfirmed() {
  const [countdown, setCountdown] = useState(6);
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if Supabase has set the session from the email link hash
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setConfirmed(true);
    });

    // Listen for auth state change (Supabase processes the hash token)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setConfirmed(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Countdown + auto redirect
  useEffect(() => {
    if (!confirmed) return;
    if (countdown <= 0) {
      navigate('/dashboard', { replace: true });
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [confirmed, countdown, navigate]);

  const handleGoNow = () => navigate('/dashboard', { replace: true });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="h-16 border-b border-border flex items-center px-6 gap-3">
        <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
          <span className="text-white font-black text-sm">DD</span>
        </div>
        <span className="font-bold text-lg text-foreground">Deal Desk</span>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8 animate-fade-in">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="h-24 w-24 rounded-full gradient-primary flex items-center justify-center shadow-glow">
                <CheckCircle2 className="h-12 w-12 text-white" />
              </div>
              {/* Pulse ring */}
              <div className="absolute inset-0 rounded-full gradient-primary opacity-30 animate-ping" />
            </div>
          </div>

          {/* Text */}
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Email Confirmed!
            </h1>
            <p className="text-muted-foreground text-lg">
              Your Deal Desk account is verified and ready to go.
            </p>
          </div>

          {/* Action */}
          {confirmed ? (
            <div className="space-y-4">
              <Button onClick={handleGoNow} size="lg" variant="gradient" className="w-full gap-2 h-12">
                Open Deal Desk <ArrowRight className="h-5 w-5" />
              </Button>
              <p className="text-sm text-muted-foreground">
                Redirecting automatically in{' '}
                <span className="font-bold text-primary tabular-nums">{countdown}s</span>
              </p>
              {/* Countdown bar */}
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full gradient-primary rounded-full transition-all duration-1000"
                  style={{ width: `${((6 - countdown) / 6) * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Verifying your session…</span>
            </div>
          )}
        </div>
      </div>

      <div className="h-16 flex items-center justify-center border-t border-border">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Deal Desk. All rights reserved.
        </p>
      </div>
    </div>
  );
}
