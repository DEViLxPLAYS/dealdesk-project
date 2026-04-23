import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Mail, Lock, User, Building2, ArrowRight, Loader2, CheckCircle2, Eye, EyeOff, Chrome } from 'lucide-react';

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
      navigate('/dashboard', { replace: true });
    } catch (error: any) {
      toast.error(error.message || 'Invalid email or password.');
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
      toast.error(error.message || 'Signup failed. Please try again.');
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
      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-40 right-20 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <span className="text-white font-black text-lg">DD</span>
          </div>
          <span className="text-white font-bold text-2xl">Deal Desk</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Manage Your Business<br />Like a Pro
            </h1>
            <p className="text-white/80 text-lg max-w-md">
              The all-in-one platform for invoicing, contracts, client management, and deal tracking. Built for agencies and service providers worldwide.
            </p>
          </div>
          <div className="flex gap-4">
            {[
              { value: '10K+', label: 'Active Users' },
              { value: '$50M+', label: 'Invoices Sent' },
              { value: '98%', label: 'Satisfaction' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-white/70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-white/60 text-sm">
          © {new Date().getFullYear()} Deal Desk. All rights reserved.
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center">
            <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-white font-bold">DD</span>
            </div>
            <span className="font-bold text-xl text-foreground">Deal Desk</span>
          </div>

          {mode === 'confirm' ? (
            <ConfirmEmailScreen email={email} onBackToLogin={() => setMode('login')} />
          ) : (
            <>
              <div className="text-center">
                <h2 className="text-3xl font-bold text-foreground">
                  {mode === 'login' ? 'Welcome back' : 'Create account'}
                </h2>
                <p className="text-muted-foreground mt-2">
                  {mode === 'login'
                    ? 'Enter your credentials to access your account'
                    : 'Start your 14-day free trial today'}
                </p>
              </div>

              <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-5">
                {mode === 'signup' && (
                  <>
                    <FormField id="fullName" label="Full Name" type="text"
                      placeholder="John Doe" value={fullName} onChange={setFullName}
                      icon={<User className="h-5 w-5 text-muted-foreground" />} />
                    <FormField id="companyName" label="Company Name" type="text"
                      placeholder="Your Agency Name" value={companyName} onChange={setCompanyName}
                      icon={<Building2 className="h-5 w-5 text-muted-foreground" />} />
                  </>
                )}

                <FormField id="email" label="Email" type="email"
                  placeholder="you@company.com" value={email} onChange={setEmail}
                  icon={<Mail className="h-5 w-5 text-muted-foreground" />} />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === 'login' && (
                      <a href="#" className="text-sm text-primary hover:underline">Forgot password?</a>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input id="password" type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••" value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12" required />
                    <button type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {mode === 'signup' && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input id="confirmPassword" type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••" value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="pl-10 h-12" required />
                    </div>
                  </div>
                )}

                <Button type="submit" variant="gradient" size="xl" className="w-full gap-2" disabled={loading}>
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>
                      {mode === 'login' ? 'Sign In' : 'Create Account'}
                      <ArrowRight className="h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>

              {mode === 'login' && (
                <>
                  <div className="relative">
                    <Separator />
                    <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-sm text-muted-foreground">
                      or continue with
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" size="lg" className="gap-2" onClick={() => toast.info('Google login coming soon')}>
                      <Chrome className="h-5 w-5" /> Google
                    </Button>
                    <Button variant="outline" size="lg" className="gap-2" onClick={() => toast.info('Apple login coming soon')}>
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
                      </svg>
                      Apple
                    </Button>
                  </div>
                </>
              )}

              <p className="text-center text-sm text-muted-foreground">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button type="button"
                  onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                  className="text-primary font-semibold hover:underline">
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
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
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</span>
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
    <div className="text-center space-y-6 py-4">
      <div className="flex justify-center">
        <div className="h-20 w-20 rounded-full gradient-primary flex items-center justify-center shadow-glow">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-foreground">Check your email</h3>
        <p className="text-muted-foreground">
          We sent a confirmation link to<br />
          <span className="font-semibold text-foreground">{email}</span>
        </p>
      </div>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Didn't receive it? Check your spam folder or resend below.
        </p>
        <Button variant="outline" onClick={resend} disabled={resending} className="gap-2">
          {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          Resend confirmation email
        </Button>
        <div>
          <button type="button" onClick={onBackToLogin}
            className="text-sm text-primary hover:underline">
            Back to sign in
          </button>
        </div>
      </div>
    </div>
  );
}
