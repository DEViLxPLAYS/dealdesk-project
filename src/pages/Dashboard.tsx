import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { LeadSourceChart } from '@/components/dashboard/LeadSourceChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { PipelineOverview } from '@/components/dashboard/PipelineOverview';
import { mockDashboardStats } from '@/data/mockData';
import { Users, FileText, FolderKanban, DollarSign } from 'lucide-react';

export default function Dashboard() {
  return (
    <div className="min-h-screen">
      <Header title="Dashboard" subtitle="Welcome back! Here's your business overview." />
      
      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Clients"
            value={mockDashboardStats.totalClients}
            change={8.2}
            icon={Users}
            variant="primary"
          />
          <StatCard
            title="Outstanding Invoices"
            value={mockDashboardStats.outstandingInvoices}
            icon={FileText}
          />
          <StatCard
            title="Active Projects"
            value={mockDashboardStats.activeProjects}
            change={5.1}
            icon={FolderKanban}
          />
          <StatCard
            title="Monthly Revenue"
            value={`$${mockDashboardStats.monthlyRevenue.toLocaleString()}`}
            change={mockDashboardStats.revenueChange}
            icon={DollarSign}
            variant="accent"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          <LeadSourceChart />
        </div>

        {/* Pipeline & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PipelineOverview />
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}
