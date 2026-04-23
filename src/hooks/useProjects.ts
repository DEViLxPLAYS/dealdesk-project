import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ProjectRow {
  id: string;
  client_id: string | null;
  client_name: string;
  name: string;
  description?: string;
  status: 'active' | 'on-hold' | 'completed';
  progress: number;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectInput {
  client_id: string;
  client_name: string;
  name: string;
  description?: string;
  status: 'active' | 'on-hold' | 'completed';
  progress: number;
  due_date?: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProjects((data as ProjectRow[]) || []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const createProject = async (input: CreateProjectInput): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', session?.user?.id).single();
      const { data, error } = await supabase
        .from('projects')
        .insert([{ ...input, company_id: profile?.company_id, updated_at: new Date().toISOString() }])
        .select()
        .single();
      if (error) throw error;
      setProjects(prev => [data as ProjectRow, ...prev]);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to create project' };
    }
  };

  const updateProject = async (id: string, updates: Partial<ProjectRow>): Promise<{ success: boolean }> => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      return { success: true };
    } catch {
      return { success: false };
    }
  };

  const deleteProject = async (id: string): Promise<void> => {
    try { await supabase.from('projects').delete().eq('id', id); } catch { /* ignore */ }
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  // ── Derived stats ─────────────────────────────────────────────────────────────
  const activeCount    = projects.filter(p => p.status === 'active').length;
  const onHoldCount    = projects.filter(p => p.status === 'on-hold').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;

  return {
    projects,
    loading,
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    activeCount,
    onHoldCount,
    completedCount,
  };
}
