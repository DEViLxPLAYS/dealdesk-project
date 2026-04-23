import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Mail, Lock, User, Building2, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'confirm';

export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(true);
  const navigate = useNavigate();

  // Auto-redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate('/dashboard', { replace: true });
      setSessionChecking(false);
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please fill in all fields'); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.user && !data.user.email_confirmed_at) {
        toast.warning('Please confirm your email first. Check your inbox.');
        return;
      }
      toast.success('Welcome back!');
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !fullName || !companyName) {
      toast.error('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, company_name: companyName },
          emailRedirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) throw error;
      setMode('confirm');
    } catch (error: any) {
      toast.error(error.message || 'Signup failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sessionChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Left: Branding panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)' }}>
        {/* Animated background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-24 left-16 w-80 h-80 rounded-full opacity-10 animate-pulse"
            style={{ background: 'radial-gradient(circle, #ea580c, transparent)' }} />
          <div className="absolute bottom-32 right-12 w-96 h-96 rounded-full opacity-8 animate-pulse"
            style={{ background: 'radial-gradient(circle, #f97316, transparent)', animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-5 animate-pulse"
            style={{ background: 'radial-gradient(circle, #fb923c, transparent)', animationDelay: '2s' }} />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, #fff 0, #fff 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, #fff 0, #fff 1px, transparent 1px, transparent 60px)' }} />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)' }}>
            <span className="text-white font-black text-lg">DD</span>
          </div>
          <div>
            <span className="text-white font-black text-2xl tracking-tight">Deal Desk</span>
            <div className="text-xs text-orange-400/60 font-medium tracking-widest uppercase">Business CRM Platform</div>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-black text-white leading-tight tracking-tight">
              Run Your Agency<br />
              <span style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                background: 'linear-gradient(90deg, #ea580c, #f97316, #fb923c)' }}>
                Like a Machine
              </span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed max-w-md">
              Clients, invoices, contracts, proposals, projects — all in one seamless platform. Your brand, your data, your control.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { value: '10K+', label: 'Active Companies' },
              { value: '$50M+', label: 'Invoices Sent' },
              { value: '98%', label: 'Satisfaction' },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl p-4 backdrop-blur-sm"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <p className="text-2xl font-black text-white">{stat.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {['Invoice Management', 'Deal Pipeline', 'Contract Builder', 'Client Portal', 'PDF Export'].map(f => (
              <span key={f} className="px-3 py-1.5 rounded-full text-xs font-semibold text-orange-400"
                style={{ background: 'rgba(234,88,12,0.12)', border: '1px solid rgba(234,88,12,0.2)' }}>
                {f}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-slate-600 text-sm">
          © {new Date().getFullYear()} Deal Desk. All rights reserved.
        </div>
      </div>

      {/* ── Right: Form panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-md space-y-6 animate-fade-in">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)' }}>
              <span className="text-white font-black text-sm">DD</span>
            </div>
            <span className="font-black text-xl text-foreground">Deal Desk</span>
          </div>

          {mode === 'confirm' ? (
            <ConfirmEmailScreen email={email} onBackToLogin={() => setMode('login')} />
          ) : (
            <>
              <div>
                <h2 className="text-3xl font-black text-foreground tracking-tight">
                  {mode === 'login' ? 'Welcome back' : 'Start for free'}
                </h2>
                <p className="text-muted-foreground mt-1.5">
                  {mode === 'login'
                    ? 'Sign in to your company account'
                    : 'Create your company account — no credit card required'}
                </p>
              </div>

              <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
                {mode === 'signup' && (
                  <>
                    <FormField id="fullName" label="Full Name" type="text"
                      placeholder="John Doe" value={fullName} onChange={setFullName}
                      icon={<User className="h-4 w-4" />} />
                    <FormField id="companyName" label="Company Name" type="text"
                      placeholder="Digital Next" value={companyName} onChange={setCompanyName}
                      icon={<Building2 className="h-4 w-4" />} />
                  </>
                )}

                <FormField id="email" label="Work Email" type="email"
                  placeholder="you@company.com" value={email} onChange={setEmail}
                  icon={<Mail className="h-4 w-4" />} />

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-sm font-semibold">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••" value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12" required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'signup' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="confirmPassword" type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••" value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="pl-10 h-12" required />
                    </div>
                  </div>
                )}

                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button type="button" className="text-sm text-primary hover:underline font-medium">
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button type="submit" disabled={loading} size="lg" className="w-full h-12 gap-2 font-bold"
                  style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)', color: 'white', border: 'none' }}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>
                      {mode === 'login' ? 'Sign In' : 'Create Free Account'}
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button type="button" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-primary font-bold hover:underline">
                  {mode === 'login' ? 'Create one free' : 'Sign in'}
                </button>
              </p>

              {mode === 'signup' && (
                <p className="text-center text-xs text-muted-foreground">
                  By creating an account you agree to our Terms of Service. A confirmation email will be sent to verify your address.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FormField({ id, label, type, placeholder, value, onChange, icon }: {
  id: string; label: string; type: string; placeholder: string;
  value: string; onChange: (v: string) => void; icon: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-semibold">{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <Input id={id} type={type} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)} className="pl-10 h-12" required />
      </div>
    </div>
  );
}

function ConfirmEmailScreen({ email, onBackToLogin }: { email: string; onBackToLogin: () => void }) {
  const [resending, setResending] = useState(false);

  const resend = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) throw error;
      toast.success('Confirmation email resent!');
    } catch {
      toast.error('Failed to resend. Try again shortly.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="text-center space-y-6 py-8">
      <div className="flex justify-center">
        <div className="h-20 w-20 rounded-full flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, rgba(234,88,12,0.15), rgba(249,115,22,0.1))' }}>
          <CheckCircle2 className="h-10 w-10 text-orange-500" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-black text-foreground">Check your email</h3>
        <p className="text-muted-foreground">
          We sent a confirmation link to<br />
          <span className="font-semibold text-foreground">{email}</span>
        </p>
      </div>
      <div className="space-y-3 pt-2">
        <p className="text-sm text-muted-foreground">
          Didn't receive it? Check your spam folder or
        </p>
        <Button variant="outline" onClick={resend} disabled={resending} className="gap-2">
          {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          Resend confirmation email
        </Button>
        <div>
          <button type="button" onClick={onBackToLogin}
            className="text-sm text-primary hover:underline font-medium">
            ← Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}
