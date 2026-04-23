import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Building2, Globe, Phone, Mail, MapPin,
  ArrowRight, ArrowLeft, Check, Upload, Loader2, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, title: 'Company Name',    desc: 'What should we call your company?' },
  { id: 2, title: 'Contact Details', desc: 'How can clients reach you?' },
  { id: 3, title: 'Upload Logo',     desc: 'Make your brand stand out' },
];

interface CompanyForm {
  name: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  logo_url: string;
}

export default function Onboarding() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CompanyForm>({
    name: '',
    email: user?.email || '',
    phone: '',
    website: '',
    address: '',
    logo_url: '',
  });

  const setField = (key: keyof CompanyForm) => (value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2MB'); return; }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = ev => setLogoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploadingLogo(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `temp/${user!.id}/logo.${ext}`;
      const { error } = await supabase.storage.from('company-logos').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from('company-logos').getPublicUrl(path);
      setForm(prev => ({ ...prev, logo_url: data.publicUrl }));
      toast.success('Logo ready!');
    } catch {
      toast.error('Upload failed — you can add a logo later in Settings.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return form.name.trim().length >= 2;
    return true; // steps 2 & 3 are optional
  };

  const handleFinish = async () => {
    if (!form.name.trim()) { toast.error('Company name is required'); return; }
    if (!user) return;
    setSaving(true);
    try {
      // 1. Create the company
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert([{
          name: form.name.trim(),
          email: form.email,
          phone: form.phone,
          website: form.website,
          address: form.address,
          logo_url: form.logo_url || null,
        }])
        .select()
        .single();

      if (companyError) throw companyError;

      // 2. Move logo to proper path if exists
      if (form.logo_url && company.id) {
        const ext = form.logo_url.split('.').pop()?.split('?')[0];
        const oldPath = `temp/${user.id}/logo.${ext}`;
        const newPath = `${company.id}/logo.${ext}`;
        await supabase.storage.from('company-logos').move(oldPath, newPath);
        const { data: urlData } = supabase.storage.from('company-logos').getPublicUrl(newPath);
        await supabase.from('companies').update({ logo_url: `${urlData.publicUrl}?t=${Date.now()}` }).eq('id', company.id);
      }

      // 3. Link profile to company and mark onboarded
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ company_id: company.id, onboarded: true })
        .eq('id', user.id);

      if (profileError) throw profileError;

      toast.success(`Welcome to Deal Desk, ${form.name}! 🎉`);
      // Force reload to refresh auth context with new profile
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error(err);
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
            style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)' }}>
            <span className="text-white font-black text-sm">DD</span>
          </div>
          <span className="font-black text-lg text-foreground">Deal Desk</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">Step {step} of {STEPS.length}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #ea580c, #f97316)' }}
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
                  s.id < step
                    ? 'text-white'
                    : s.id === step
                    ? 'text-white ring-4 ring-orange-200'
                    : 'bg-muted text-muted-foreground'
                )}
                  style={s.id <= step ? { background: 'linear-gradient(135deg, #ea580c, #f97316)' } : {}}>
                  {s.id < step ? <Check className="h-4 w-4" /> : s.id}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn('h-0.5 w-12 rounded-full transition-all duration-500', s.id < step ? 'bg-orange-400' : 'bg-muted')} />
                )}
              </div>
            ))}
          </div>

          {/* Card */}
          <div className="bg-card border border-border rounded-2xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="p-6 sm:p-8 border-b border-border"
              style={{ background: 'linear-gradient(135deg, rgba(234,88,12,0.04), rgba(249,115,22,0.02))' }}>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-xl"
                  style={{ background: 'linear-gradient(135deg, rgba(234,88,12,0.1), rgba(249,115,22,0.05))' }}>
                  {step === 1 && <Building2 className="h-5 w-5 text-orange-500" />}
                  {step === 2 && <Mail className="h-5 w-5 text-orange-500" />}
                  {step === 3 && <Sparkles className="h-5 w-5 text-orange-500" />}
                </div>
                <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">
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

                  {/* Live preview */}
                  {form.name && (
                    <div className="rounded-xl p-4 border border-orange-200 animate-fade-in"
                      style={{ background: 'linear-gradient(135deg, rgba(234,88,12,0.04), transparent)' }}>
                      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-2">Preview — Sidebar</p>
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)' }}>
                          <span className="text-white font-black text-xs">
                            {form.name.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-foreground">{form.name}</p>
                          <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">powered by Deal Desk</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Contact details */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <OnboardField
                      id="email" label="Business Email" type="email"
                      placeholder="hello@company.com" value={form.email}
                      onChange={setField('email')} icon={<Mail className="h-4 w-4" />}
                    />
                    <OnboardField
                      id="phone" label="Phone Number" type="tel"
                      placeholder="+1 555-123-4567" value={form.phone}
                      onChange={setField('phone')} icon={<Phone className="h-4 w-4" />}
                    />
                    <OnboardField
                      id="website" label="Website" type="url"
                      placeholder="https://yourcompany.com" value={form.website}
                      onChange={setField('website')} icon={<Globe className="h-4 w-4" />}
                    />
                    <OnboardField
                      id="address" label="Business Address" type="text"
                      placeholder="123 Main St, City" value={form.address}
                      onChange={setField('address')} icon={<MapPin className="h-4 w-4" />}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="text-orange-400">ⓘ</span>
                    All fields optional — you can fill these in later from Settings.
                  </p>
                </div>
              )}

              {/* Step 3: Logo */}
              {step === 3 && (
                <div className="space-y-5">
                  <div
                    className="border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-orange-400 hover:bg-orange-50/30 dark:hover:bg-orange-950/10 group"
                    onClick={() => fileRef.current?.click()}>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />

                    {logoPreview ? (
                      <div className="flex flex-col items-center gap-4">
                        <img src={logoPreview} alt="logo preview"
                          className="h-24 w-24 rounded-2xl object-contain ring-4 ring-orange-200 shadow-lg" />
                        <div>
                          <p className="font-bold text-foreground">Logo uploaded!</p>
                          <p className="text-sm text-muted-foreground mt-0.5">Click to change it</p>
                        </div>
                        {uploadingLogo && (
                          <div className="flex items-center gap-2 text-orange-500 text-sm">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Saving to cloud…</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center group-hover:bg-orange-100 transition-colors">
                          <Upload className="h-8 w-8 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">Drop your logo here</p>
                          <p className="text-sm text-muted-foreground mt-0.5">or click to browse — PNG, JPG, WebP (max 2MB)</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    Your logo appears in the sidebar and on all documents sent to clients.
                    You can skip this and add it later.
                  </p>
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 sm:px-8 pb-6 sm:pb-8 flex items-center justify-between gap-4">
              <Button
                variant="ghost"
                onClick={() => step > 1 ? setStep(s => s - 1) : null}
                disabled={step === 1}
                className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              {step < STEPS.length ? (
                <Button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canProceed()}
                  className="gap-2 px-6 min-w-[140px]"
                  style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)', color: 'white', border: 'none' }}>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={saving || uploadingLogo}
                  className="gap-2 px-6 min-w-[180px]"
                  style={{ background: 'linear-gradient(135deg, #ea580c, #f97316)', color: 'white', border: 'none' }}>
                  {saving ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Creating workspace…</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Launch My Workspace</>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Bottom note */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            You can change all of this later in{' '}
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
