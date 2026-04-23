import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Building2, Globe, Phone, Mail, MapPin,
  ArrowRight, ArrowLeft, Check, Loader2, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, title: 'Company Name',    desc: 'What should we call your company?' },
  { id: 2, title: 'Contact Details', desc: 'How can clients reach you?' },
];

interface CompanyForm {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
}

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<CompanyForm>({
    name: '',
    email: user?.email || '',
    phone: '',
    website: '',
    address: '',
  });

  const setField = (key: keyof CompanyForm) => (value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const canProceed = () => {
    if (step === 1) return form.name.trim().length >= 2;
    return true;
  };

  const handleFinish = async () => {
    if (!form.name.trim()) { toast.error('Company name is required'); return; }
    if (!user) return;
    setSaving(true);
    try {
      // 1. Create the company row
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert([{
          name: form.name.trim(),
          email: form.email || null,
          phone: form.phone || null,
          website: form.website || null,
          address: form.address || null,
          logo_url: null,
        }])
        .select()
        .single();

      if (companyError) throw companyError;
      if (!company) throw new Error('Company was not created. Please try again.');

      // 2. Link the profile to the company and mark onboarded
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ company_id: company.id, onboarded: true })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // 3. Force auth context to re-read the updated profile
      //    so sidebar, settings, and all pages see company_id immediately
      await refreshProfile();

      toast.success(`Welcome to Deal Desk, ${form.name}! 🎉`, {
        description: 'Add your logo anytime in Settings → Business Profile.',
        duration: 6000,
      });
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      console.error('Onboarding error:', err);
      toast.error(err.message || 'Setup failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const progress = (step / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
            <span className="text-white font-black text-sm">DD</span>
          </div>
          <span className="font-black text-lg text-foreground">Deal Desk</span>
        </div>
        <span className="text-sm text-muted-foreground font-medium">
          Step {step} of {STEPS.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #4f46e5, #7c3aed)' }}
        />
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-lg">

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300',
                  s.id < step ? 'text-white' : s.id === step ? 'text-white ring-4 ring-primary/20' : 'bg-muted text-muted-foreground'
                )}
                  style={s.id <= step ? { background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' } : {}}>
                  {s.id < step ? <Check className="h-4 w-4" /> : s.id}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn('h-0.5 w-16 rounded-full transition-all duration-500', s.id < step ? 'bg-primary' : 'bg-muted')} />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-border"
              style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.05), rgba(124,58,237,0.02))' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl"
                  style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.12), rgba(124,58,237,0.06))' }}>
                  {step === 1 && <Building2 className="h-5 w-5 text-primary" />}
                  {step === 2 && <Mail className="h-5 w-5 text-primary" />}
                </div>
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  Step {step} — {STEPS[step - 1].title}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground">
                {STEPS[step - 1].desc}
              </h2>
              {step === 1 && (
                <p className="text-muted-foreground mt-1.5 text-sm">
                  This name appears on all your invoices, contracts, and proposals.
                </p>
              )}
              {step === 2 && (
                <p className="text-muted-foreground mt-1.5 text-sm">
                  All fields are optional — you can fill these in later from Settings.
                </p>
              )}
            </div>

            {/* Form body */}
            <div className="p-6 sm:p-8 space-y-5">

              {/* Step 1: Company name */}
              {step === 1 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="font-semibold">Company Name *</Label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="companyName"
                        placeholder="e.g. Digital Next Agency"
                        value={form.name}
                        onChange={e => setField('name')(e.target.value)}
                        className="pl-10 h-12 text-base font-medium"
                        autoFocus
                        onKeyDown={e => e.key === 'Enter' && canProceed() && setStep(2)}
                      />
                    </div>
                  </div>

                  {/* Live sidebar preview */}
                  {form.name && (
                    <div className="rounded-xl p-4 border border-primary/20"
                      style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.04), transparent)' }}>
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">
                        Preview — Sidebar
                      </p>
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                          <span className="text-white font-black text-xs">
                            {form.name.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{form.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
                            powered by Deal Desk
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Contact details */}
              {step === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <OnboardField id="email" label="Business Email" type="email"
                    placeholder="hello@company.com" value={form.email}
                    onChange={setField('email')} icon={<Mail className="h-4 w-4" />} />
                  <OnboardField id="phone" label="Phone Number" type="tel"
                    placeholder="+1 555-123-4567" value={form.phone}
                    onChange={setField('phone')} icon={<Phone className="h-4 w-4" />} />
                  <OnboardField id="website" label="Website" type="url"
                    placeholder="https://yourcompany.com" value={form.website}
                    onChange={setField('website')} icon={<Globe className="h-4 w-4" />} />
                  <OnboardField id="address" label="Business Address" type="text"
                    placeholder="123 Main St, City" value={form.address}
                    onChange={setField('address')} icon={<MapPin className="h-4 w-4" />} />
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 sm:px-8 pb-6 sm:pb-8 flex items-center justify-between gap-4">
              <Button variant="ghost" onClick={() => step > 1 ? setStep(s => s - 1) : null}
                disabled={step === 1} className="gap-2">
                <ArrowLeft className="h-4 w-4" /> Back
              </Button>

              {step < STEPS.length ? (
                <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
                  className="gap-2 px-6 min-w-[140px]"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', border: 'none' }}>
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleFinish} disabled={saving}
                  className="gap-2 px-6 min-w-[200px]"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: 'white', border: 'none' }}>
                  {saving
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating workspace…</>
                    : <><Sparkles className="h-4 w-4" /> Launch My Workspace</>
                  }
                </Button>
              )}
            </div>
          </div>

          {/* Bottom note */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            You can add your logo and more details in{' '}
            <span className="font-semibold text-foreground">Settings → Business Profile</span>.
          </p>
        </div>
      </div>
    </div>
  );
}

function OnboardField({ id, label, type, placeholder, value, onChange, icon }: {
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
