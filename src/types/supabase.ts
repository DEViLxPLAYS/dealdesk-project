export type UserRole = 'owner' | 'admin' | 'member' | 'super_admin';

export interface Profile {
  id: string;
  company_id: string | null;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}
