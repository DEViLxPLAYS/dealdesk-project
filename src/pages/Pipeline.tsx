import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { mockLeads } from '@/data/mockData';
import { Lead, LeadStage } from '@/types';
import { Plus, DollarSign, Calendar, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

const stages: { id: LeadStage; name: string; color: string }[] = [
  { id: 'new-lead', name: 'New Lead', color: 'bg-muted-foreground' },
  { id: 'qualified', name: 'Qualified', color: 'bg-primary' },
  { id: 'proposal-sent', name: 'Proposal Sent', color: 'bg-accent' },
  { id: 'negotiation', name: 'Negotiation', color: 'bg-warning' },
  { id: 'closed-won', name: 'Closed Won', color: 'bg-success' },
  { id: 'closed-lost', name: 'Closed Lost', color: 'bg-destructive' },
];

export default function Pipeline() {
  const [leads, setLeads] = useState<Lead[]>(mockLeads);

  const getLeadsByStage = (stage: LeadStage) => leads.filter((lead) => lead.stage === stage);

  const getTotalValue = (stage: LeadStage) =>
    getLeadsByStage(stage).reduce((acc, lead) => acc + lead.value, 0);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === destination.droppableId) return;

    setLeads((prev) =>
      prev.map((lead) =>
        lead.id === draggableId
          ? { ...lead, stage: destination.droppableId as LeadStage }
          : lead
      )
    );
  };

  return (
    <div className="min-h-screen">
      <Header title="Pipeline" subtitle="Track and manage your deals" />

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
          <Button variant="accent" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Deal
          </Button>
        </div>

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
