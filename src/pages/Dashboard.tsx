import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/dashboard/StatCard';
import { RevenueChart } from '@/components/dashboard/RevenueChart';
import { LeadSourceChart } from '@/components/dashboard/LeadSourceChart';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { PipelineOverview } from '@/components/dashboard/PipelineOverview';
import { useClients } from '@/hooks/useClients';
import { useInvoices } from '@/hooks/useInvoices';
import { useProjects } from '@/hooks/useProjects';
import { Users, FileText, FolderKanban, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const { clients, loading: clientsLoading } = useClients();
  const { outstandingCount, thisMonthRevenue, revenueChange, loading: invLoading } = useInvoices();
  const { activeCount, loading: projLoading } = useProjects();

  const loading = clientsLoading || invLoading || projLoading;

  return (
    <div className="min-h-screen">
      <Header title="Dashboard" subtitle="Welcome back! Here's your live business overview." />

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Clients"
            value={clientsLoading ? '…' : clients.length}
            change={8.2}
            icon={Users}
            variant="primary"
          />
          <StatCard
            title="Outstanding Invoices"
            value={invLoading ? '…' : outstandingCount}
            icon={FileText}
          />
          <StatCard
            title="Active Projects"
            value={projLoading ? '…' : activeCount}
            change={5.1}
            icon={FolderKanban}
          />
          <StatCard
            title="Monthly Revenue"
            value={invLoading ? '…' : `$${thisMonthRevenue.toLocaleString()}`}
            change={revenueChange}
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
