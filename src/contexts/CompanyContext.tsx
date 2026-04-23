import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

export interface Company {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  logo_url: string | null;
  subscription_status: 'trial' | 'active' | 'inactive';
  trial_ends_at: string | null;
  paypal_subscription_id: string | null;
  plan: 'starter' | 'pro' | 'agency';
  created_at: string;
  updated_at: string;
}

interface CompanyContextType {
  company: Company | null;
  isLoading: boolean;
  updateCompany: (updates: Partial<Company>) => Promise<void>;
  uploadLogo: (file: File) => Promise<string | null>;
  refetch: () => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, isLoading: authLoading } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCompany = useCallback(async () => {
    if (!profile?.company_id) {
      setIsLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();
      if (error) throw error;
      setCompany(data as Company);
    } catch (err) {
      console.error('Failed to fetch company:', err);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.company_id]);

  useEffect(() => {
    if (!authLoading) {
      fetchCompany();
    }
  }, [authLoading, fetchCompany]);

  // Real-time subscription for company updates
  useEffect(() => {
    if (!profile?.company_id) return;

    const channel = supabase
      .channel(`company:${profile.company_id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'companies', filter: `id=eq.${profile.company_id}` },
        (payload) => {
          setCompany(payload.new as Company);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.company_id]);

  const updateCompany = async (updates: Partial<Company>) => {
    if (!profile?.company_id) return;
    try {
      const { data, error } = await supabase
        .from('companies')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', profile.company_id)
        .select()
        .single();
      if (error) throw error;
      setCompany(data as Company);
    } catch (err) {
      console.error('Failed to update company:', err);
      throw err;
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    if (!profile?.company_id) return null;
    try {
      const ext = file.name.split('.').pop();
      const path = `${profile.company_id}/logo.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('company-logos').getPublicUrl(path);
      // Add cache-busting timestamp
      const url = `${data.publicUrl}?t=${Date.now()}`;
      await updateCompany({ logo_url: url });
      return url;
    } catch (err) {
      console.error('Failed to upload logo:', err);
      throw err;
    }
  };

  return (
    <CompanyContext.Provider value={{ company, isLoading, updateCompany, uploadLogo, refetch: fetchCompany }}>
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) throw new Error('useCompany must be used within CompanyProvider');
  return context;
};
