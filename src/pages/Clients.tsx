import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { mockClients as initialMockClients } from '@/data/mockData';
import { Search, Plus, MoreHorizontal, Mail, Phone, MessageCircle, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddClientSheet } from '@/components/clients/AddClientSheet';
import { Client } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const leadSourceColors: Record<string, string> = {
  website: 'bg-primary/10 text-primary',
  referral: 'bg-success/10 text-success',
  facebook: 'bg-blue-500/10 text-blue-600',
  tiktok: 'bg-pink-500/10 text-pink-600',
  other: 'bg-muted text-muted-foreground',
};

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        const mappedClients: Client[] = data.map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email || '',
          phone: c.phone || '',
          whatsapp: c.whatsapp || '',
          country: c.country || '',
          company: c.company || '',
          leadSource: c.lead_source || 'website',
          message: c.message || '',
          notes: c.notes || '',
          createdAt: new Date(c.created_at),
          updatedAt: new Date(c.updated_at || c.created_at),
        }));
        setClients(mappedClients);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients', { description: 'Using fallback data' });
      setClients(initialMockClients);
    }
  };

  const handleAddClient = async (newClientData: Partial<Client>) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          name: newClientData.name || '',
          email: newClientData.email || '',
          phone: newClientData.phone || '',
          whatsapp: newClientData.whatsapp || '',
          country: newClientData.country || '',
          company: newClientData.company || '',
          lead_source: newClientData.leadSource || 'website',
          message: newClientData.message || ''
        }])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        const addedClient: Client = {
          id: data.id,
          name: data.name,
          email: data.email || '',
          phone: data.phone || '',
          whatsapp: data.whatsapp || '',
          country: data.country || '',
          company: data.company || '',
          leadSource: data.lead_source || 'website',
          message: data.message || '',
          notes: data.notes || '',
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at || data.created_at),
        };
        setClients([addedClient, ...clients]);
        toast.success('Client added successfully!', {
          description: `${addedClient.name} has been added to your client list.`,
        });
      }
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Failed to add client');
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen">
      <Header 
        title="Clients" 
        subtitle="Manage your client relationships" 
        onAddClientClick={() => setIsAddSheetOpen(true)}
      />

      <div className="p-6 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search clients..."
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
          <Button 
            variant="accent" 
            className="gap-2 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            onClick={() => setIsAddSheetOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        </div>

        <AddClientSheet 
          open={isAddSheetOpen} 
          onOpenChange={setIsAddSheetOpen} 
          onAddClient={handleAddClient} 
        />

        {/* Clients Table */}
        <div className="bg-card rounded-xl shadow-soft border border-border/50 overflow-hidden animate-fade-in">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Client</TableHead>
                <TableHead className="font-semibold">Company</TableHead>
                <TableHead className="font-semibold">Contact</TableHead>
                <TableHead className="font-semibold">Lead Source</TableHead>
                <TableHead className="font-semibold">Country</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client, index) => (
                <TableRow
                  key={client.id}
                  className="hover:bg-muted/30 transition-colors animate-slide-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {client.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">{client.name}</p>
                        <p className="text-sm text-muted-foreground">{client.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-foreground">{client.company || '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MessageCircle className="h-4 w-4 text-success" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn('capitalize', leadSourceColors[client.leadSource])}
                    >
                      {client.leadSource}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{client.country}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Client</DropdownMenuItem>
                        <DropdownMenuItem>Create Invoice</DropdownMenuItem>
                        <DropdownMenuItem>Create Contract</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
