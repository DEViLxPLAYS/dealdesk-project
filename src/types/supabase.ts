export type UserRole = 'owner' | 'admin' | 'manager' | 'employee' | 'super_admin';

export interface Profile {
  id: string;
  company_id: string | null;
  full_name: string | null;
  role: UserRole;
  username: string | null;
  onboarded: boolean;
  avatar_url: string | null;
  created_at: string;
}
