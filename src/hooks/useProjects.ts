import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface ProjectRow {
  id: string;
  company_id: string;
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
  company_id: string;          // required — caller must pass profile.company_id
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
    } catch (err: any) {
      console.error('[useProjects] fetchProjects error:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  // ── Create project ─────────────────────────────────────────────────────────
  // company_id is supplied by the caller (from profile.company_id in AuthContext).
  // This avoids a secondary profile fetch and keeps RLS happy.
  const createProject = async (input: CreateProjectInput): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert([{
          company_id:   input.company_id,
          client_id:    input.client_id,
          client_name:  input.client_name,
          name:         input.name,
          description:  input.description ?? null,
          status:       input.status,
          progress:     input.progress,
          due_date:     input.due_date ?? null,
          updated_at:   new Date().toISOString(),
        }])
        .select()
        .single();
      if (error) throw error;
      setProjects(prev => [data as ProjectRow, ...prev]);
      return { success: true };
    } catch (err: any) {
      console.error('[useProjects] createProject error:', err);
      return { success: false, error: err?.message || 'Failed to create project' };
    }
  };

  // ── Update project ─────────────────────────────────────────────────────────
  const updateProject = async (id: string, updates: Partial<ProjectRow>): Promise<{ success: boolean }> => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      return { success: true };
    } catch (err: any) {
      console.error('[useProjects] updateProject error:', err);
      return { success: false };
    }
  };

  // ── Delete project ─────────────────────────────────────────────────────────
  const deleteProject = async (id: string): Promise<void> => {
    try {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    } catch (err: any) {
      console.error('[useProjects] deleteProject error:', err);
    }
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
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
