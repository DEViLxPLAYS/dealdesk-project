export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  company?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
  leadSource: 'website' | 'tiktok' | 'facebook' | 'referral' | 'other';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Lead {
  id: string;
  clientId: string;
  client: Client;
  stage: LeadStage;
  value: number;
  assignedTo?: string;
  followUpDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type LeadStage = 
  | 'new-lead'
  | 'qualified'
  | 'proposal-sent'
  | 'negotiation'
  | 'closed-won'
  | 'closed-lost';

export interface Invoice {
  id: string;
  clientId: string;
  client: Client;
  invoiceNumber: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue';
  dueDate: Date;
  paidAt?: Date;
  createdAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Contract {
  id: string;
  clientId: string;
  client: Client;
  title: string;
  template: ContractTemplate;
  content: string;
  status: 'draft' | 'sent' | 'signed' | 'expired';
  signedAt?: Date;
  createdAt: Date;
}

export type ContractTemplate = 
  | 'social-media-management'
  | 'digital-marketing'
  | 'web-development'
  | 'influencer-marketing';

export interface Project {
  id: string;
  clientId: string;
  client: Client;
  name: string;
  description?: string;
  status: 'active' | 'on-hold' | 'completed';
  phases: ProjectPhase[];
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectPhase {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed';
  dueDate?: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'sales-agent' | 'viewer';
}

export interface DashboardStats {
  totalClients: number;
  outstandingInvoices: number;
  activeProjects: number;
  monthlyRevenue: number;
  revenueChange: number;
  conversionRate: number;
}
