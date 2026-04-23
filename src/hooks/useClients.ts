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
  const [error, setError] = useState<string | null>(null);

  const fetchClients = async () => {
    setLoading(true);
    setError(null);

    // 8-second timeout so the UI never hangs forever
    const timeout = setTimeout(() => {
      setLoading(false);
      setError('Request timed out');
      setClients([]);
    }, 8000);

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false }) as any;

      clearTimeout(timeout);

      if (error) throw error;
      setClients(data || []);
    } catch (e: any) {
      clearTimeout(timeout);
      console.error('useClients error:', e?.message || e);
      setClients([]);
      setError(e?.message || 'Failed to load clients');
    } finally {
      clearTimeout(timeout);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []); // eslint-disable-line

  return { clients, loading, error, refetch: fetchClients };
}
