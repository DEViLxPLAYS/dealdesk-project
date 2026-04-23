import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { mockLeads } from '@/data/mockData';
import { Client, Lead, LeadStage } from '@/types';
import { Plus, DollarSign, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { AddDealSheet } from '@/components/pipeline/AddDealSheet';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';


const stages: { id: LeadStage; name: string; color: string }[] = [
  { id: 'new-lead', name: 'New Lead', color: 'bg-muted-foreground' },
  { id: 'qualified', name: 'Qualified', color: 'bg-primary' },
  { id: 'proposal-sent', name: 'Proposal Sent', color: 'bg-accent' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-warning' },
  { id: 'closed-won', name: 'Closed Won', color: 'bg-success' },
  { id: 'closed-lost', name: 'Closed Lost', color: 'bg-destructive' },
];

export default function Pipeline() {
  const { profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isAddDealOpen, setIsAddDealOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (location.state?.openNewDeal) {
      setIsAddDealOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchData = async () => {
    try {
      // Fetch both clients and deals
      const [clientsRes, dealsRes] = await Promise.all([
        supabase.from('clients').select('*').order('created_at', { ascending: false }),
        supabase.from('deals').select('*, clients(*)').order('created_at', { ascending: false })
      ]);

      if (clientsRes.error) throw clientsRes.error;
      if (dealsRes.error) throw dealsRes.error;

      if (clientsRes.data) {
        const mappedClients: Client[] = clientsRes.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email || '',
          phone: c.phone || '',
          whatsapp: c.whatsapp || '',
          country: c.country || '',
          company: c.company || '',
          leadSource: c.lead_source || 'website',
          message: c.message || '',
          notes: c.notes || '',
          createdAt: new Date(c.created_at),
          updatedAt: new Date(c.updated_at || c.created_at),
        }));
        setClients(mappedClients);
      }

      if (dealsRes.data) {
        const mappedDeals: Lead[] = dealsRes.data.map((d: any) => ({
          id: d.id,
          clientId: d.client_id,
          client: d.clients ? {
            id: d.clients.id,
            name: d.clients.name,
            email: d.clients.email || '',
            phone: d.clients.phone || '',
            country: d.clients.country || '',
            leadSource: d.clients.lead_source || 'website',
            createdAt: new Date(d.clients.created_at),
            updatedAt: new Date(d.clients.updated_at || d.clients.created_at),
            company: d.clients.company,
          } : { id: '', name: 'Unknown Client', email: '', phone: '', country: '', leadSource: 'website', createdAt: new Date(), updatedAt: new Date() },
          stage: d.stage as LeadStage,
          value: d.value || 0,
          assignedTo: d.assigned_to || '',
          followUpDate: d.follow_up_date ? new Date(d.follow_up_date) : undefined,
          notes: d.notes || '',
          createdAt: new Date(d.created_at),
          updatedAt: new Date(d.updated_at || d.created_at),
        }));
        setLeads(mappedDeals);
      }
    } catch (error) {
      console.error('Error fetching pipeline data:', error);
      toast.error('Failed to load pipeline data');
      setLeads(mockLeads); // Fallback
    }
  };

  const handleAddDeal = async (newDealData: Partial<Lead>) => {
    if (!newDealData.client) {
      toast.error('Deal creation failed', { description: 'A valid client must be selected.' });
      return;
    }
    if (!profile?.company_id) {
      toast.error('Company setup required'); return;
    }
    try {
      const dbDealData = {
        company_id: profile.company_id,
        client_id: newDealData.clientId || '',
        title: `${newDealData.client.name} Deal`,
        stage: newDealData.stage || 'new-lead',
        value: newDealData.value || 0,
        assigned_to: newDealData.assignedTo || '',
        follow_up_date: newDealData.followUpDate ? newDealData.followUpDate.toISOString() : null,
        notes: newDealData.notes || ''
      };

      const { data, error } = await supabase
        .from('deals')
        .insert([dbDealData])
        .select('*, clients(*)')
        .single();

      if (error) throw error;

      if (data) {
        const newDeal: Lead = {
          id: data.id,
          clientId: data.client_id,
          client: data.clients ? {
            id: data.clients.id,
            name: data.clients.name,
            email: data.clients.email || '',
            phone: data.clients.phone || '',
            country: data.clients.country || '',
            leadSource: data.clients.lead_source || 'website',
            createdAt: new Date(data.clients.created_at),
            updatedAt: new Date(data.clients.updated_at || data.clients.created_at),
            company: data.clients.company,
          } : newDealData.client,
          stage: data.stage as LeadStage,
          value: data.value,
          assignedTo: data.assigned_to || '',
          followUpDate: data.follow_up_date ? new Date(data.follow_up_date) : undefined,
          notes: data.notes || '',
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at || data.created_at),
        };

        setLeads([newDeal, ...leads]);
        toast.success('Deal added successfully!', {
          description: `A new $${newDeal.value.toLocaleString()} deal has been placed in Pipeline.`,
        });
      }
    } catch (error) {
      console.error('Error adding deal:', error);
      toast.error('Failed to add deal');
    }
  };

  const getLeadsByStage = (stage: LeadStage) => leads.filter((lead) => lead.stage === stage);

  const getTotalValue = (stage: LeadStage) =>
    getLeadsByStage(stage).reduce((acc, lead) => acc + lead.value, 0);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    const newStage = destination.droppableId as LeadStage;

    // Optimistic UI update
    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === draggableId
          ? { ...lead, stage: newStage }
          : lead
      )
    );

    try {
      const { error } = await supabase
        .from('deals')
        .update({ stage: newStage, updated_at: new Date().toISOString() })
        .eq('id', draggableId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating deal stage:', error);
      toast.error('Failed to update stage in database');
      // Revert optimism if failed
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === draggableId
            ? { ...lead, stage: source.droppableId as LeadStage }
            : lead
        )
      );
    }
  };

  return (
    <div className="min-h-screen">
      <Header 
        title="Pipeline" 
        subtitle="Track and manage your deals" 
        onAddDealClick={() => setIsAddDealOpen(true)}
      />

      <div className="p-6">
        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            {stages.slice(0, -1).map((stage) => (
              <Badge
                key={stage.id}
                variant="secondary"
                className="gap-2 px-3 py-1.5"
              >
                <span className={cn('h-2 w-2 rounded-full', stage.color)} />
                {stage.name}: ${getTotalValue(stage.id).toLocaleString()}
              </Badge>
            ))}
          </div>
          <Button 
            variant="accent" 
            className="gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            onClick={() => setIsAddDealOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Deal
          </Button>
        </div>

        <AddDealSheet 
          open={isAddDealOpen} 
          onOpenChange={setIsAddDealOpen} 
          onAddDeal={handleAddDeal} 
          clients={clients}
        />

        {/* Kanban Board */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-6 gap-4 overflow-x-auto pb-4">
            {stages.map((stage) => (
              <Droppable key={stage.id} droppableId={stage.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'bg-muted/30 rounded-xl p-3 min-h-[600px] transition-colors',
                      snapshot.isDraggingOver && 'bg-muted/50 ring-2 ring-primary/20'
                    )}
                  >
                    {/* Column Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className={cn('h-3 w-3 rounded-full', stage.color)} />
                        <h3 className="font-semibold text-sm text-foreground">{stage.name}</h3>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {getLeadsByStage(stage.id).length}
                      </Badge>
                    </div>

                    {/* Cards */}
                    <div className="space-y-3">
                      {getLeadsByStage(stage.id).map((lead, index) => (
                        <Draggable key={lead.id} draggableId={lead.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                'bg-card p-4 rounded-lg shadow-soft border border-border/50 cursor-grab active:cursor-grabbing transition-all',
                                snapshot.isDragging && 'shadow-elevated rotate-2 scale-105'
                              )}
                            >
                              <div className="flex items-start gap-3 mb-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                                    {lead.client.name
                                      .split(' ')
                                      .map((n) => n[0])
                                      .join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-sm text-foreground truncate">
                                    {lead.client.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {lead.client.company}
                                  </p>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <DollarSign className="h-4 w-4 text-success" />
                                  <span className="font-semibold text-foreground">
                                    ${lead.value.toLocaleString()}
                                  </span>
                                </div>
                                {lead.assignedTo && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <User className="h-3 w-3" />
                                    <span>{lead.assignedTo}</span>
                                  </div>
                                )}
                                {lead.followUpDate && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    <span>{new Date(lead.followUpDate).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
}
