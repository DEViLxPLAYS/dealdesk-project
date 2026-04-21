import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { LeadStage } from '@/types';

export interface DealRow {
  id: string;
  client_id: string;
  title: string;
  stage: LeadStage;
  value: number;
  assigned_to?: string;
  follow_up_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  clients?: {
    name: string;
    company?: string;
  };
}

export interface StageStats {
  id: LeadStage;
  name: string;
  shortName: string;
  color: string;
  count: number;
  value: number;
}

export function useDeals() {
  const [deals, setDeals] = useState<DealRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDeals = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('deals')
        .select('*, clients(name, company)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDeals((data as DealRow[]) || []);
    } catch {
      setDeals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDeals(); }, [fetchDeals]);

  // ── Stage breakdown ────────────────────────────────────────────────────────
  const STAGE_CONFIG: Omit<StageStats, 'count' | 'value'>[] = [
    { id: 'new-lead',       name: 'New Lead',      shortName: 'New',         color: 'bg-muted-foreground' },
    { id: 'qualified',      name: 'Qualified',     shortName: 'Qualified',   color: 'bg-primary' },
    { id: 'proposal-sent',  name: 'Proposal Sent', shortName: 'Proposal',    color: 'bg-accent' },
    { id: 'negotiation',    name: 'Negotiation',   shortName: 'Negotiation', color: 'bg-warning' },
    { id: 'closed-won',     name: 'Closed Won',    shortName: 'Won',         color: 'bg-success' },
    { id: 'closed-lost',    name: 'Closed Lost',   shortName: 'Lost',        color: 'bg-destructive' },
  ];

  const stageStats: StageStats[] = STAGE_CONFIG.map(cfg => {
    const stageDeals = deals.filter(d => d.stage === cfg.id);
    return {
      ...cfg,
      count: stageDeals.length,
      value: stageDeals.reduce((a, d) => a + (d.value || 0), 0),
    };
  });

  const totalDeals     = deals.length;
  const totalValue     = deals.reduce((a, d) => a + (d.value || 0), 0);
  const wonValue       = deals.filter(d => d.stage === 'closed-won').reduce((a, d) => a + (d.value || 0), 0);
  const activeDeals    = deals.filter(d => !['closed-won', 'closed-lost'].includes(d.stage)).length;

  return {
    deals,
    loading,
    refetch: fetchDeals,
    stageStats,
    totalDeals,
    totalValue,
    wonValue,
    activeDeals,
  };
}
