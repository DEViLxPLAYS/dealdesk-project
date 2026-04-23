import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { mockClients as initialMockClients } from '@/data/mockData';
import { Search, Plus, MoreHorizontal, Mail, Phone, MessageCircle, Filter, FileDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddClientSheet } from '@/components/clients/AddClientSheet';
import { Client } from '@/types';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { generateClientPDF } from '@/lib/generateClientPDF';

const leadSourceColors: Record<string, string> = {
  website: 'bg-primary/10 text-primary',
  referral: 'bg-success/10 text-success',
  facebook: 'bg-blue-500/10 text-blue-600',
  tiktok: 'bg-pink-500/10 text-pink-600',
  other: 'bg-muted text-muted-foreground',
};

export default function Clients() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);

  const handleDownloadPDF = async (client: Client) => {
    setPdfLoadingId(client.id);
    try {
      await generateClientPDF(client);
      toast.success(`Report downloaded for ${client.name}`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate PDF');
    } finally {
      setPdfLoadingId(null);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (location.state?.openNewClient) {
      setIsAddSheetOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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
    if (!profile?.company_id) {
      toast.error('Company setup required', { description: 'Please complete onboarding first.' });
      navigate('/onboarding');
      return;
    }
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([{
          company_id: profile.company_id,
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

  const handleEditClient = async (updatedClient: Partial<Client>) => {
    if (!editingClient) return;
    try {
      // Map UI names to DB names
      const dbPayload = {
        name: updatedClient.name,
        email: updatedClient.email,
        phone: updatedClient.phone,
        whatsapp: updatedClient.whatsapp,
        country: updatedClient.country,
        company: updatedClient.company,
        lead_source: updatedClient.leadSource,
        message: updatedClient.message,
        notes: updatedClient.notes,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.from('clients').update(dbPayload).eq('id', editingClient.id);
      if (error) throw error;

      setClients(clients.map(c => c.id === editingClient.id ? { ...c, ...updatedClient, updatedAt: new Date() } as Client : c));
      toast.success('Client updated successfully');
      setEditingClient(null);
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Failed to update client');
    }
  };

  const handleDeleteClient = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) return;
    try {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
      setClients(clients.filter(c => c.id !== id));
      toast.success('Client deleted');
    } catch {
      toast.error('Failed to delete client');
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
                        <DropdownMenuItem onClick={() => setViewingClient(client)}>View Details</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingClient(client)}>Edit Client</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/invoices', { state: { createInvoiceForClient: client.id } })}>Create Invoice</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/contracts', { state: { createContractForClient: client.id } })}>Create Contract</DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDownloadPDF(client)}
                          disabled={pdfLoadingId === client.id}
                          className="gap-2 text-violet-600 focus:text-violet-600"
                        >
                          {pdfLoadingId === client.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <FileDown className="h-3.5 w-3.5" />}
                          Download PDF Report
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteClient(client.id, client.name)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* View Client Details Dialog */}
      {viewingClient && (
        <Dialog open={!!viewingClient} onOpenChange={() => setViewingClient(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {viewingClient.name.split(' ').map((n) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-xl flex items-center gap-2">
                    {viewingClient.name}
                  </DialogTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {viewingClient.company || 'Independent'}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-6 py-4">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Contact Info</h4>
                  <div className="space-y-2 text-sm bg-muted/30 p-3 rounded-lg border border-border/50">
                    <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 opacity-70" /> {viewingClient.email}</p>
                    <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 opacity-70" /> {viewingClient.phone || '-'}</p>
                    <p className="flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5 opacity-70" /> {viewingClient.whatsapp || '-'}</p>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Acquisition</h4>
                  <div className="bg-muted/30 p-3 rounded-lg border border-border/50">
                    <Badge variant="secondary" className={cn('capitalize text-xs', leadSourceColors[viewingClient.leadSource])}>
                      {viewingClient.leadSource}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2">Added on {viewingClient.createdAt.toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Location</h4>
                  <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-sm">
                    {viewingClient.country || 'Not specified'}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">Notes / Message</h4>
                  <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-sm whitespace-pre-wrap min-h-[100px]">
                    {viewingClient.message || viewingClient.notes || 'No notes available.'}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
      {/* Edit Client Sheet */}
      <AddClientSheet
        open={!!editingClient}
        onOpenChange={(op) => !op && setEditingClient(null)}
        onAddClient={handleEditClient}
        initialData={editingClient}
      />
    </div>
  );
}
