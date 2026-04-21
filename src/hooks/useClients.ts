import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface SupabaseClient {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  country: string;
  company?: string;
  lead_source: string;
  message?: string;
  notes?: string;
  created_at: string;
}

export function useClients() {
  const [clients, setClients] = useState<SupabaseClient[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('useClients: failed to fetch', err);
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return { clients, loading, refetch: fetchClients };
}
