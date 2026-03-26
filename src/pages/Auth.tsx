import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Mail, Lock, User, ArrowRight, Chrome } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // For demo, just navigate to dashboard
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-primary p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-primary-foreground blur-3xl" />
          <div className="absolute bottom-40 right-20 w-96 h-96 rounded-full bg-primary-foreground blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary-foreground/20 flex items-center justify-center backdrop-blur-sm">
              <span className="text-primary-foreground font-bold text-xl">DD</span>
            </div>
            <span className="text-primary-foreground font-bold text-2xl">Deal Desk</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-primary-foreground leading-tight">
            Manage Your Business<br />Like a Pro
          </h1>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            The all-in-one platform for invoicing, contracts, client management, and deal tracking. Built for agencies and service providers worldwide.
          </p>
          <div className="flex gap-4">
            <div className="bg-primary-foreground/10 backdrop-blur-sm px-4 py-3 rounded-lg">
              <p className="text-2xl font-bold text-primary-foreground">10K+</p>
              <p className="text-sm text-primary-foreground/70">Active Users</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm px-4 py-3 rounded-lg">
              <p className="text-2xl font-bold text-primary-foreground">$50M+</p>
              <p className="text-sm text-primary-foreground/70">Invoices Sent</p>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm px-4 py-3 rounded-lg">
              <p className="text-2xl font-bold text-primary-foreground">98%</p>
              <p className="text-sm text-primary-foreground/70">Satisfaction</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-primary-foreground/60 text-sm">
          © 2024 Deal Desk. All rights reserved.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">DD</span>
            </div>
            <span className="font-bold text-xl text-foreground">Deal Desk</span>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">
              {isLogin ? 'Welcome back' : 'Create account'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {isLogin
                ? 'Enter your credentials to access your account'
                : 'Start your 14-day free trial today'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="password">Password</Label>
                {isLogin && (
                  <a href="#" className="text-sm text-primary hover:underline">
                    Forgot password?
                  </a>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex items-center gap-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                  Remember me for 30 days
                </Label>
              </div>
            )}

            <Button type="submit" variant="gradient" size="xl" className="w-full gap-2">
              {isLogin ? 'Sign In' : 'Create Account'}
              <ArrowRight className="h-5 w-5" />
            </Button>
          </form>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-sm text-muted-foreground">
              or continue with
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" size="lg" className="gap-2">
              <Chrome className="h-5 w-5" />
              Google
            </Button>
            <Button variant="outline" size="lg" className="gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              Apple
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-semibold hover:underline"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
