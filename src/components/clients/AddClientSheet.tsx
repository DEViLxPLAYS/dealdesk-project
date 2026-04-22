import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, Mail, Building2, Phone, MessageSquare, Globe, Navigation, MessageCircle } from 'lucide-react';
import { Client } from '@/types';

interface AddClientSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddClient: (client: Partial<Client>) => void;
  initialData?: Partial<Client> | null;
}

export function AddClientSheet({ open, onOpenChange, onAddClient, initialData }: AddClientSheetProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    email: initialData?.email || '',
    company: initialData?.company || '',
    phone: initialData?.phone || '',
    whatsapp: initialData?.whatsapp || '',
    country: initialData?.country || '',
    leadSource: initialData?.leadSource || 'website',
    message: initialData?.message || '',
  });

  // Keep form in sync when initialData changes
  useEffect(() => {
    if (open) {
      setFormData({
        name: initialData?.name || '',
        email: initialData?.email || '',
        company: initialData?.company || '',
        phone: initialData?.phone || '',
        whatsapp: initialData?.whatsapp || '',
        country: initialData?.country || '',
        leadSource: initialData?.leadSource || 'website',
        message: initialData?.message || '',
      });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddClient({
      ...formData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setFormData({
      name: '',
      email: '',
      company: '',
      phone: '',
      whatsapp: '',
      country: '',
      leadSource: 'website',
      message: '',
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto bg-background/95 backdrop-blur-md border-l border-border/50 shadow-2xl p-0">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-screen">
          {/* Header Section */}
          <div className="p-8 space-y-2 bg-gradient-to-br from-primary/5 via-transparent to-transparent border-b border-border/50">
            <SheetHeader className="text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">
                    {initialData ? 'Edit Client Profile' : 'Create New Client Profile'}
                  </SheetTitle>
                  <SheetDescription className="text-muted-foreground font-medium">
                    {initialData ? 'Update the details for this partnership.' : 'Please provide the full details to register a new partnership.'}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
          </div>

          <div className="flex-1 p-8 space-y-10 pb-32">
            {/* Personal Information Group */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary/80">Personal Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="name" className="text-xs font-bold uppercase text-muted-foreground/70 ml-1">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative group transition-all">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="name"
                      required
                      placeholder="e.g. Sarah Williams"
                      className="pl-11 h-12 bg-muted/20 border-border/40 focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all rounded-xl shadow-sm"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="email" className="text-xs font-bold uppercase text-muted-foreground/70 ml-1">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative group transition-all">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      required
                      placeholder="sarah@example.com"
                      className="pl-11 h-12 bg-muted/20 border-border/40 focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all rounded-xl shadow-sm"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Details Group */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary/80">Contact Channels</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="phone" className="text-xs font-bold uppercase text-muted-foreground/70 ml-1">Phone Number</Label>
                  <div className="relative group transition-all">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="phone"
                      placeholder="+1 (000) 000-0000"
                      className="pl-11 h-12 bg-muted/20 border-border/40 focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all rounded-xl shadow-sm"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="whatsapp" className="text-xs font-bold uppercase text-muted-foreground/70 ml-1">WhatsApp Business</Label>
                  <div className="relative group transition-all">
                    <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-success transition-colors" />
                    <Input
                      id="whatsapp"
                      placeholder="Same as phone or different..."
                      className="pl-11 h-12 bg-muted/20 border-border/40 focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all rounded-xl shadow-sm"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Corporate & Geography Group */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary/80">Corporate & Geography</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="company" className="text-xs font-bold uppercase text-muted-foreground/70 ml-1">Company Name</Label>
                  <div className="relative group transition-all">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                    <Input
                      id="company"
                      placeholder="Global Tech Ltd."
                      className="pl-11 h-12 bg-muted/20 border-border/40 focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all rounded-xl shadow-sm"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="country" className="text-xs font-bold uppercase text-muted-foreground/70 ml-1">Current Country</Label>
                  <div className="relative group transition-all">
                    <Globe className="absolute left-3.5 z-10 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                    <Select 
                      value={formData.country} 
                      onValueChange={(val) => setFormData({ ...formData, country: val })}
                    >
                      <SelectTrigger id="country" className="pl-11 h-12 bg-muted/20 border-border/40 focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all rounded-xl shadow-sm">
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-xl border-border/50">
                        <SelectItem value="United States">United States</SelectItem>
                        <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                        <SelectItem value="Canada">Canada</SelectItem>
                        <SelectItem value="Australia">Australia</SelectItem>
                        <SelectItem value="India">India</SelectItem>
                        <SelectItem value="Germany">Germany</SelectItem>
                        <SelectItem value="France">France</SelectItem>
                        <SelectItem value="Pakistan">Pakistan</SelectItem>
                        <SelectItem value="UAE">UAE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Info Group */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-primary/80">Strategic Information</h3>
              </div>
              <div className="space-y-6">
                <div className="space-y-2.5">
                  <Label htmlFor="leadSource" className="text-xs font-bold uppercase text-muted-foreground/70 ml-1">Acquisition Source</Label>
                  <div className="relative group transition-all">
                    <Navigation className="absolute left-3.5 z-10 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                    <Select 
                      value={formData.leadSource} 
                      onValueChange={(val: any) => setFormData({ ...formData, leadSource: val })}
                    >
                      <SelectTrigger id="leadSource" className="pl-11 h-12 bg-muted/20 border-border/40 focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all rounded-xl shadow-sm">
                        <SelectValue placeholder="Select Channel" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-xl border-border/50">
                        <SelectItem value="website" className="focus:bg-primary/5">Website Inquiry</SelectItem>
                        <SelectItem value="referral" className="focus:bg-success/5">Business Referral</SelectItem>
                        <SelectItem value="facebook" className="focus:bg-blue-500/5">Facebook Ads</SelectItem>
                        <SelectItem value="tiktok" className="focus:bg-pink-500/5">TikTok Marketing</SelectItem>
                        <SelectItem value="other" className="focus:bg-muted/10">Other Channels</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2.5">
                  <Label htmlFor="message" className="text-xs font-bold uppercase text-muted-foreground/70 ml-1">Detailed Message / Notes</Label>
                  <div className="relative group transition-all">
                    <MessageSquare className="absolute left-3.5 top-4 h-4 w-4 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
                    <Textarea
                      id="message"
                      placeholder="Start typing client specific requirements, historical data or initial notes..."
                      className="pl-11 min-h-[140px] bg-muted/20 border-border/40 focus:bg-background focus:ring-4 focus:ring-primary/10 transition-all rounded-xl shadow-sm resize-none py-3.5"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Persistent Footer */}
          <div className="sticky bottom-0 left-0 right-0 p-8 pt-6 bg-background/95 backdrop-blur-xl border-t border-border/60 flex items-center gap-4 z-50">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-12 font-bold tracking-tight text-muted-foreground hover:bg-muted transition-colors rounded-xl border-border/60"
              onClick={() => onOpenChange(false)}
            >
              Discard
            </Button>
            <Button
              type="submit"
              variant="accent"
              className="flex-[2.5] h-12 font-bold text-white tracking-tight shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] rounded-xl"
            >
              {initialData ? 'Save Changes' : 'Verify & Add Client'}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
