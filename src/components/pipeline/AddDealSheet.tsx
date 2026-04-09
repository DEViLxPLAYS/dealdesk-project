import { useState } from 'react';
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
import { Briefcase, DollarSign, UserCheck, Calendar, MessageSquare, LayoutList, Target } from 'lucide-react';
import { Client, Lead, LeadStage } from '@/types';

interface AddDealSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddDeal: (deal: Partial<Lead>) => void;
  clients: Client[];
}

export function AddDealSheet({ open, onOpenChange, onAddDeal, clients }: AddDealSheetProps) {
  const [formData, setFormData] = useState({
    clientId: '',
    stage: 'new-lead' as LeadStage,
    value: '',
    assignedTo: '',
    followUpDate: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert value to number
    const numericValue = parseFloat(formData.value.replace(/[^0-9.]/g, '')) || 0;
    
    // Find the client object to attach
    const selectedClient = clients.find(c => c.id === formData.clientId);
    
    onAddDeal({
      clientId: formData.clientId,
      client: selectedClient,
      stage: formData.stage,
      value: numericValue,
      assignedTo: formData.assignedTo,
      followUpDate: formData.followUpDate ? new Date(formData.followUpDate) : undefined,
      notes: formData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    setFormData({
      clientId: '',
      stage: 'new-lead',
      value: '',
      assignedTo: '',
      followUpDate: '',
      notes: '',
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto bg-background/95 backdrop-blur-md border-l border-border/50 shadow-2xl p-0">
        <form onSubmit={handleSubmit} className="flex flex-col min-h-screen">
          {/* Header Section */}
          <div className="p-8 space-y-2 bg-gradient-to-br from-success/5 via-transparent to-transparent border-b border-border/50">
            <SheetHeader className="text-left">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 bg-success/10 rounded-xl">
                  <Briefcase className="h-6 w-6 text-success" />
                </div>
                <div>
                  <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">
                    Add New Deal
                  </SheetTitle>
                  <SheetDescription className="text-muted-foreground font-medium">
                    Create a new opportunity in your sales pipeline.
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>
          </div>

          <div className="flex-1 p-8 space-y-10 pb-32">
            {/* Lead & Customer Core Group */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-success rounded-full" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-success/80">Entity Details</h3>
              </div>
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="clientId" className="text-xs font-bold uppercase text-muted-foreground/70 ml-1">
                    Associated Client <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative group transition-all">
                    <Target className="absolute left-3.5 z-10 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                    <Select 
                      required
                      value={formData.clientId} 
                      onValueChange={(val) => setFormData({ ...formData, clientId: val })}
                    >
                      <SelectTrigger id="clientId" className="pl-11 h-12 bg-muted/20 border-border/40 focus:bg-background focus:ring-4 focus:ring-success/10 transition-all rounded-xl shadow-sm">
                        <SelectValue placeholder="Select existing client..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-xl border-border/50 max-h-[300px]">
                        {clients.map(client => (
                          <SelectItem key={client.id} value={client.id} className="focus:bg-success/5">
                            <div className="flex flex-col">
                              <span className="font-semibold">{client.name}</span>
                              {client.company && <span className="text-[10px] text-muted-foreground">{client.company}</span>}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Strategic Pipeline Group */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-success rounded-full" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-success/80">Pipeline Position</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="stage" className="text-xs font-bold uppercase text-muted-foreground/70 ml-1">Pipeline Stage</Label>
                  <div className="relative group transition-all">
                    <LayoutList className="absolute left-3.5 z-10 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 pointer-events-none" />
                    <Select 
                      value={formData.stage} 
                      onValueChange={(val: LeadStage) => setFormData({ ...formData, stage: val })}
                    >
                      <SelectTrigger id="stage" className="pl-11 h-12 bg-muted/20 border-border/40 focus:bg-background focus:ring-4 focus:ring-success/10 transition-all rounded-xl shadow-sm">
                        <SelectValue placeholder="New Lead" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl shadow-xl border-border/50">
                        <SelectItem value="new-lead">New Lead</SelectItem>
                        <SelectItem value="qualified">Qualified</SelectItem>
                        <SelectItem value="proposal-sent">Proposal Sent</SelectItem>
                        <SelectItem value="negotiation">Negotiation</SelectItem>
                        <SelectItem value="closed-won" className="text-success focus:bg-success/10">Closed Won</SelectItem>
                        <SelectItem value="closed-lost" className="text-destructive focus:bg-destructive/10">Closed Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="value" className="text-xs font-bold uppercase text-muted-foreground/70 ml-1">
                    Deal Value ($) <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative group transition-all">
                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-success transition-colors" />
                    <Input
                      id="value"
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="5000.00"
                      className="pl-11 h-12 bg-muted/20 border-border/40 focus:bg-background focus:ring-4 focus:ring-success/10 transition-all rounded-xl shadow-sm"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Operational Group */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-success rounded-full" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-success/80">Operations</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2.5">
                  <Label htmlFor="assignedTo" className="text-xs font-bold uppercase text-muted-foreground/70 ml-1">Assigned Agent</Label>
                  <div className="relative group transition-all">
                    <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-success transition-colors" />
                    <Input
                      id="assignedTo"
                      placeholder="Agent Name..."
                      className="pl-11 h-12 bg-muted/20 border-border/40 focus:bg-background focus:ring-4 focus:ring-success/10 transition-all rounded-xl shadow-sm"
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2.5">
                  <Label htmlFor="followUpDate" className="text-xs font-bold uppercase text-muted-foreground/70 ml-1">Expected Follow-up</Label>
                  <div className="relative group transition-all">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50 group-focus-within:text-success transition-colors" />
                    <Input
                      id="followUpDate"
                      type="date"
                      className="pl-11 h-12 bg-muted/20 border-border/40 focus:bg-background focus:ring-4 focus:ring-success/10 transition-all rounded-xl shadow-sm"
                      value={formData.followUpDate}
                      onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* General Notes Group */}
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-8 w-1 bg-success rounded-full" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-success/80">Notes</h3>
              </div>
              <div className="space-y-2.5">
                <div className="relative group transition-all">
                  <MessageSquare className="absolute left-3.5 top-4 h-4 w-4 text-muted-foreground/50 group-focus-within:text-success transition-colors" />
                  <Textarea
                    id="notes"
                    placeholder="Enter any initial negotiation points or specific requirements relevant to this deal..."
                    className="pl-11 min-h-[140px] bg-muted/20 border-border/40 focus:bg-background focus:ring-4 focus:ring-success/10 transition-all rounded-xl shadow-sm resize-none py-3.5"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
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
              className="flex-[2.5] h-12 font-bold text-white tracking-tight shadow-lg shadow-success/30 transition-all hover:scale-[1.02] active:scale-[0.98] rounded-xl bg-success hover:bg-success/90"
            >
              Confirm Deal
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
