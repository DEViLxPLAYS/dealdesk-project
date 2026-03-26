import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { mockInvoices } from '@/data/mockData';
import { Search, Plus, MoreHorizontal, Download, Send, Eye, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const statusStyles: Record<string, { bg: string; text: string }> = {
  paid: { bg: 'bg-success/10', text: 'text-success' },
  pending: { bg: 'bg-warning/10', text: 'text-warning' },
  overdue: { bg: 'bg-destructive/10', text: 'text-destructive' },
  draft: { bg: 'bg-muted', text: 'text-muted-foreground' },
};

export default function Invoices() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredInvoices = mockInvoices.filter(
    (invoice) =>
      invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.client.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPaid = mockInvoices
    .filter((i) => i.status === 'paid')
    .reduce((acc, i) => acc + i.total, 0);
  const totalPending = mockInvoices
    .filter((i) => i.status === 'pending')
    .reduce((acc, i) => acc + i.total, 0);
  const totalOverdue = mockInvoices
    .filter((i) => i.status === 'overdue')
    .reduce((acc, i) => acc + i.total, 0);

  return (
    <div className="min-h-screen">
      <Header title="Invoices" subtitle="Create and manage invoices" />

      <div className="p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-success/10 p-4 rounded-xl border border-success/20 animate-fade-in">
            <p className="text-sm font-medium text-success">Paid</p>
            <p className="text-2xl font-bold text-success">${totalPaid.toLocaleString()}</p>
          </div>
          <div className="bg-warning/10 p-4 rounded-xl border border-warning/20 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <p className="text-sm font-medium text-warning">Pending</p>
            <p className="text-2xl font-bold text-warning">${totalPending.toLocaleString()}</p>
          </div>
          <div className="bg-destructive/10 p-4 rounded-xl border border-destructive/20 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <p className="text-sm font-medium text-destructive">Overdue</p>
            <p className="text-2xl font-bold text-destructive">${totalOverdue.toLocaleString()}</p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search invoices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>
          <Button variant="accent" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Invoice
          </Button>
        </div>

        {/* Invoices Table */}
        <div className="bg-card rounded-xl shadow-soft border border-border/50 overflow-hidden animate-fade-in">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Invoice</TableHead>
                <TableHead className="font-semibold">Client</TableHead>
                <TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Due Date</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInvoices.map((invoice, index) => (
                <TableRow
                  key={invoice.id}
                  className="hover:bg-muted/30 transition-colors animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell>
                    <p className="font-medium text-foreground">{invoice.invoiceNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(invoice.createdAt, 'MMM d, yyyy')}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground">{invoice.client.name}</p>
                    <p className="text-sm text-muted-foreground">{invoice.client.company}</p>
                  </TableCell>
                  <TableCell>
                    <p className="font-semibold text-foreground">${invoice.total.toLocaleString()}</p>
                    {invoice.discount > 0 && (
                      <p className="text-xs text-success">-${invoice.discount} discount</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn(
                        'capitalize',
                        statusStyles[invoice.status].bg,
                        statusStyles[invoice.status].text
                      )}
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className={cn(
                      'text-sm',
                      invoice.status === 'overdue' ? 'text-destructive font-medium' : 'text-muted-foreground'
                    )}>
                      {format(invoice.dueDate, 'MMM d, yyyy')}
                    </p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Send className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Download className="h-4 w-4" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit Invoice</DropdownMenuItem>
                          <DropdownMenuItem>Mark as Paid</DropdownMenuItem>
                          <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
