export type UserRole = 'user' | 'super_admin';
export type SubscriptionTier = 'free' | 'pro' | 'max' | 'business';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  tier: SubscriptionTier;
  trial_end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseClient {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: string;
  value: number;
  created_at: string;
}

export interface SupabaseDeal {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  value: number;
  stage: string;
  created_at: string;
}
