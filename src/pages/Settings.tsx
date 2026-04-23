import { useState, useRef, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building, CreditCard, Bell, Upload, Check, Loader2,
  Globe, Phone, Mail, MapPin, Shield, AlertCircle, ExternalLink,
} from 'lucide-react';
import { useCompany } from '@/contexts/CompanyContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    features: ['Up to 50 clients', 'Invoices & Contracts', 'Basic Reports', '1 user'],
    color: 'border-muted',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 69,
    features: ['Unlimited clients', 'All modules', 'Advanced Reports', '5 users', 'PDF branding'],
    color: 'border-primary',
    popular: true,
  },
  {
    id: 'agency',
    name: 'Agency',
    price: 149,
    features: ['Unlimited everything', 'White-label', 'Priority support', 'Unlimited users', 'API access'],
    color: 'border-violet-500',
  },
];

export default function Settings() {
  const { company, updateCompany, uploadLogo } = useCompany();
  const { user, isSuperAdmin } = useAuth();

  // Form state mirrors company data for live editing
  const [form, setForm] = useState({
    name: company?.name || '',
    email: company?.email || '',
    phone: company?.phone || '',
    website: company?.website || '',
    address: company?.address || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedProfile, setSavedProfile] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync form when company loads/updates from real-time
  const prevCompanyId = useRef(company?.id);
  if (company && company.id !== prevCompanyId.current) {
    prevCompanyId.current = company.id;
    setForm({
      name: company.name || '',
      email: company.email || '',
      phone: company.phone || '',
      website: company.website || '',
      address: company.address || '',
    });
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Company name is required'); return; }
    setSavingProfile(true);
    try {
      await updateCompany(form);
      toast.success('Settings saved!', { description: 'Your changes are now live across the platform.' });
      setSavedProfile(true);
      setTimeout(() => setSavedProfile(false), 3000);
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2MB'); return; }
    setUploadingLogo(true);
    try {
      await uploadLogo(file);
      toast.success('Logo updated!', { description: 'Your new logo is live across the app.' });
    } catch {
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handlePayPalSubscribe = (planId: string) => {
    // PayPal sandbox/live plan IDs to be configured
    const PAYPAL_PLAN_IDS: Record<string, string> = {
      starter: 'P-STARTER_PLAN_ID', // Replace with real PayPal plan IDs
      pro:     'P-PRO_PLAN_ID',
      agency:  'P-AGENCY_PLAN_ID',
    };
    const planPid = PAYPAL_PLAN_IDS[planId];
    if (!planPid || planPid.includes('PLAN_ID')) {
      toast.info('PayPal subscription coming soon! Contact support to upgrade.', { duration: 5000 });
      return;
    }
    window.open(
      `https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=${planPid}`,
      '_blank'
    );
  };

  const isTrialExpired = company?.trial_ends_at
    ? new Date(company.trial_ends_at) < new Date()
    : false;
  const trialDaysLeft = company?.trial_ends_at
    ? Math.max(0, Math.ceil((new Date(company.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="min-h-screen">
      <Header title="Settings" subtitle="Manage your company account" />

      <div className="p-4 sm:p-6 max-w-5xl mx-auto">
        <Tabs defaultValue="business" className="space-y-6">
          <TabsList className="bg-muted/50 p-1 flex-wrap h-auto gap-1 w-full sm:w-auto">
            <TabsTrigger value="business" className="gap-2 text-xs sm:text-sm">
              <Building className="h-3.5 w-3.5" /> Business
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2 text-xs sm:text-sm">
              <CreditCard className="h-3.5 w-3.5" /> Billing
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2 text-xs sm:text-sm">
              <Bell className="h-3.5 w-3.5" /> Alerts
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="admin" className="gap-2 text-xs sm:text-sm">
                <Shield className="h-3.5 w-3.5" /> Admin
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── Business Profile Tab ── */}
          <TabsContent value="business" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Company Profile</CardTitle>
                <CardDescription>
                  These details appear on all your invoices, contracts, and proposals in real-time.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {/* Logo upload */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="relative group">
                      <Avatar className="h-20 w-20 ring-2 ring-border">
                        <AvatarImage src={company?.logo_url || undefined} />
                        <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                          {(company?.name || 'DD').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {uploadingLogo && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2">
                      <div className="flex gap-2 flex-wrap">
                        <Button type="button" variant="outline" size="sm" className="gap-2"
                          onClick={() => fileInputRef.current?.click()} disabled={uploadingLogo}>
                          <Upload className="h-3.5 w-3.5" />
                          {uploadingLogo ? 'Uploading…' : 'Upload Logo'}
                        </Button>
                        <input ref={fileInputRef} type="file" accept="image/*"
                          className="hidden" onChange={handleLogoUpload} />
                      </div>
                      <p className="text-xs text-muted-foreground">JPG, PNG, WebP. Max 2MB. Shows in sidebar & all documents.</p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <SettingField
                      id="name" label="Company Name" type="text"
                      placeholder="Digital Next" value={form.name}
                      onChange={v => setForm(p => ({ ...p, name: v }))}
                      icon={<Building className="h-4 w-4" />}
                    />
                    <SettingField
                      id="email" label="Business Email" type="email"
                      placeholder="hello@company.com" value={form.email}
                      onChange={v => setForm(p => ({ ...p, email: v }))}
                      icon={<Mail className="h-4 w-4" />}
                    />
                    <SettingField
                      id="phone" label="Phone Number" type="tel"
                      placeholder="+1 555-123-4567" value={form.phone}
                      onChange={v => setForm(p => ({ ...p, phone: v }))}
                      icon={<Phone className="h-4 w-4" />}
                    />
                    <SettingField
                      id="website" label="Website" type="url"
                      placeholder="https://yourcompany.com" value={form.website}
                      onChange={v => setForm(p => ({ ...p, website: v }))}
                      icon={<Globe className="h-4 w-4" />}
                    />
                    <div className="sm:col-span-2">
                      <SettingField
                        id="address" label="Business Address" type="text"
                        placeholder="123 Main St, City, State 10001" value={form.address}
                        onChange={v => setForm(p => ({ ...p, address: v }))}
                        icon={<MapPin className="h-4 w-4" />}
                      />
                    </div>
                  </div>

                  {/* Real-time preview chip */}
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-success/5 border border-success/20">
                    <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                    <p className="text-xs text-success font-medium">
                      Changes are applied in real-time across all documents and the sidebar
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={savingProfile}
                      className={cn('gap-2 min-w-[140px]', savedProfile && 'bg-success')}
                      style={!savedProfile ? { background: 'linear-gradient(135deg, #ea580c, #f97316)', color: 'white', border: 'none' } : {}}>
                      {savingProfile ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                      ) : savedProfile ? (
                        <><Check className="h-4 w-4" /> Saved!</>
                      ) : (
                        'Save Changes'
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Account info */}
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-border/50">
                  <div>
                    <p className="text-sm font-medium">Login Email</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <Badge variant="secondary">Verified</Badge>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">Member Since</p>
                    <p className="text-xs text-muted-foreground">
                      {company?.created_at ? new Date(company.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Billing Tab ── */}
          <TabsContent value="billing" className="space-y-6 animate-fade-in">
            {/* Trial / Status banner */}
            {company?.subscription_status === 'trial' && (
              <div className={cn(
                'flex items-start gap-3 p-4 rounded-xl border',
                isTrialExpired
                  ? 'bg-destructive/5 border-destructive/30'
                  : 'bg-amber-500/5 border-amber-500/20'
              )}>
                <AlertCircle className={cn('h-5 w-5 mt-0.5 flex-shrink-0', isTrialExpired ? 'text-destructive' : 'text-amber-500')} />
                <div>
                  <p className={cn('font-semibold text-sm', isTrialExpired ? 'text-destructive' : 'text-amber-600')}>
                    {isTrialExpired ? 'Trial expired' : `${trialDaysLeft} days left in your free trial`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isTrialExpired
                      ? 'Subscribe to continue using Deal Desk.'
                      : 'Subscribe before your trial ends to keep uninterrupted access.'}
                  </p>
                </div>
              </div>
            )}

            {company?.subscription_status === 'active' && (
              <div className="flex items-start gap-3 p-4 rounded-xl border bg-success/5 border-success/20">
                <Check className="h-5 w-5 mt-0.5 text-success flex-shrink-0" />
                <div>
                  <p className="font-semibold text-sm text-success">Active subscription — {company.plan} plan</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Your subscription is active and will renew automatically.</p>
                </div>
              </div>
            )}

            {/* Plans */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {PLANS.map(plan => {
                const isCurrent = company?.plan === plan.id && company?.subscription_status === 'active';
                return (
                  <Card key={plan.id} className={cn('relative border-2 transition-all', plan.color, plan.popular && 'shadow-lg')}>
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-white text-xs">Most Popular</Badge>
                      </div>
                    )}
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black">${plan.price}</span>
                        <span className="text-muted-foreground text-sm">/month</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-center gap-2 text-sm">
                            <Check className="h-3.5 w-3.5 text-success flex-shrink-0" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      {isCurrent ? (
                        <Button disabled variant="outline" className="w-full">
                          <Check className="h-4 w-4 mr-2" /> Current Plan
                        </Button>
                      ) : (
                        <Button onClick={() => handlePayPalSubscribe(plan.id)}
                          className="w-full gap-2"
                          style={plan.popular ? { background: 'linear-gradient(135deg, #ea580c, #f97316)', color: 'white', border: 'none' } : {}}>
                          <ExternalLink className="h-3.5 w-3.5" />
                          Subscribe with PayPal
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">PayPal Subscription</CardTitle>
                <CardDescription>Manage your subscription directly through PayPal.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {company?.paypal_subscription_id ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Subscription ID</p>
                      <p className="text-xs text-muted-foreground font-mono">{company.paypal_subscription_id}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => window.open('https://www.paypal.com/myaccount/autopay/', '_blank')} className="gap-2">
                      <ExternalLink className="h-3.5 w-3.5" /> Manage on PayPal
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No active PayPal subscription linked.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Notifications Tab ── */}
          <TabsContent value="notifications" className="space-y-6 animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Choose what updates you receive at {user?.email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { title: 'Invoice Updates', desc: 'Notify when invoices are paid or become overdue' },
                  { title: 'New Client Added', desc: 'Notify when a new client is added to your roster' },
                  { title: 'Contract Signed', desc: 'Notify when a contract status changes' },
                  { title: 'Project Milestones', desc: 'Notify about project progress updates' },
                  { title: 'Deal Stage Changes', desc: 'Notify when pipeline deals move stages' },
                ].map((item, i) => (
                  <div key={item.title} className="flex items-center justify-between animate-slide-up"
                    style={{ animationDelay: `${i * 60}ms` }}>
                    <div>
                      <p className="font-medium text-foreground text-sm">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-muted peer-focus:ring-2 peer-focus:ring-primary/20 rounded-full peer peer-checked:bg-primary transition-all">
                        <div className="absolute top-[2px] left-[2px] h-5 w-5 bg-white rounded-full shadow transition-all peer-checked:translate-x-5" />
                      </div>
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Super Admin Tab ── */}
          {isSuperAdmin && (
            <TabsContent value="admin" className="space-y-6 animate-fade-in">
              <Card className="border-amber-500/30 bg-amber-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-600">
                    <Shield className="h-5 w-5" /> Super Admin Panel
                  </CardTitle>
                  <CardDescription>You have full access to all companies and data.</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    As Super Admin, you can see and manage all companies. Access company-level data via the Supabase dashboard or build an Admin UI.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

function SettingField({ id, label, type, placeholder, value, onChange, icon }: {
  id: string; label: string; type: string; placeholder: string;
  value: string; onChange: (v: string) => void; icon: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-semibold">{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">{icon}</span>
        <Input id={id} type={type} placeholder={placeholder} value={value}
          onChange={e => onChange(e.target.value)} className="pl-10 h-11" />
      </div>
    </div>
  );
}
