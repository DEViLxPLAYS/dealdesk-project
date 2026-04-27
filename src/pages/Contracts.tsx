import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus, FileSignature, Download, Send, MoreHorizontal, FileText,
  Check, Clock, Eye, Sparkles, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useClients } from '@/hooks/useClients';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ContractRow {
  id: string;
  client_id: string;
  client_name: string;
  client_company?: string;
  title: string;
  template: string;
  status: 'signed' | 'sent' | 'draft' | 'expired';
  value: string;
  notes?: string;
  signed_at?: string;
  created_at: string;
}

interface ProposalRow {
  id: string;
  client_id: string;
  client_name: string;
  client_company?: string;
  title: string;
  service: string;
  status: 'accepted' | 'sent' | 'draft' | 'declined';
  value: string;
  created_at: string;
}

// ─── Template catalogue ────────────────────────────────────────────────────────
const TEMPLATES = [
  { id: 'social-media',      name: 'Social Media Marketing', desc: 'Complete social media management & growth agreement',   icon: '📱', color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30' },
  { id: 'digital-marketing', name: 'Digital Marketing',      desc: 'Full-service digital marketing campaign contract',       icon: '📈', color: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30' },
  { id: 'web-development',   name: 'Web Development',        desc: 'Website design and development service agreement',       icon: '💻', color: 'from-violet-500/20 to-purple-500/20 border-violet-500/30' },
  { id: 'influencer',        name: 'Influencer Marketing',   desc: 'Influencer partnership & brand deal agreement',         icon: '⭐', color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30' },
];

const SERVICE_OPTIONS = [
  'Social Media Marketing', 'Digital Marketing', 'Web Development',
  'Influencer Marketing', 'SEO Services', 'Brand Strategy',
  'Content Marketing', 'Email Marketing',
];

// ─── Status configs ───────────────────────────────────────────────────────────
const contractStatus: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  signed:  { bg: 'bg-success/10',     text: 'text-success',          icon: <Check     className="h-3 w-3" /> },
  sent:    { bg: 'bg-primary/10',     text: 'text-primary',          icon: <Send      className="h-3 w-3" /> },
  draft:   { bg: 'bg-muted',          text: 'text-muted-foreground', icon: <FileText  className="h-3 w-3" /> },
  expired: { bg: 'bg-destructive/10', text: 'text-destructive',      icon: <Clock     className="h-3 w-3" /> },
};
const proposalStatus: Record<string, { bg: string; text: string }> = {
  accepted: { bg: 'bg-success/10',     text: 'text-success' },
  sent:     { bg: 'bg-primary/10',     text: 'text-primary' },
  draft:    { bg: 'bg-muted',          text: 'text-muted-foreground' },
  declined: { bg: 'bg-destructive/10', text: 'text-destructive' },
};

// ─── Contract PDF ─────────────────────────────────────────────────────────────
function openContractPDF(c: ContractRow) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${c.title}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',sans-serif;padding:50px;color:#1a1a2e;line-height:1.6}
.hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:40px;padding-bottom:28px;border-bottom:3px solid #6366f1}
.brand{font-size:26px;font-weight:800;color:#6366f1}
.title{text-align:right;font-size:18px;font-weight:700} .title span{display:block;font-size:12px;color:#888;font-weight:400;margin-top:3px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:28px;background:#f8f7ff;border-radius:10px;padding:20px;margin:22px 0}
.block .lbl{font-size:10px;text-transform:uppercase;color:#6366f1;font-weight:600;letter-spacing:.5px;display:block;margin-bottom:5px}
.block .val{font-size:14px;color:#1a1a2e;font-weight:700} .block .sub{font-size:12px;color:#666}
h2{font-size:13px;text-transform:uppercase;letter-spacing:1px;color:#6366f1;margin:26px 0 10px}
.clause{background:#f8f7ff;border-left:3px solid #6366f1;padding:14px 18px;border-radius:0 8px 8px 0;margin:10px 0}
.clause h3{font-size:13px;font-weight:700;color:#6366f1;margin-bottom:5px}
.clause p,.body-p{font-size:13px;color:#444;line-height:1.7;margin-bottom:8px}
.sigs{display:grid;grid-template-columns:1fr 1fr;gap:40px;margin-top:50px;padding-top:28px;border-top:2px solid #f0eeff}
.sig .lbl{font-size:10px;text-transform:uppercase;color:#6366f1;font-weight:600;margin-bottom:36px}
.sig-line{border-top:1px solid #333;margin-bottom:7px}
.sig .name{font-size:13px;font-weight:700}.sig .role{font-size:12px;color:#888}
.footer{text-align:center;margin-top:36px;padding-top:18px;border-top:1px solid #f0eeff;font-size:11px;color:#aaa}
</style></head><body>
<div class="hdr">
  <div class="brand">DealDesk</div>
  <div class="title">SERVICE AGREEMENT<span>Contract ID: CONT-${String(c.id).substring(0,8).toUpperCase()}</span></div>
</div>
<div class="grid2">
  <div class="block"><span class="lbl">Service Provider</span><div class="val">DealDesk Agency</div><div class="sub">Digital Marketing Solutions</div><div class="sub">contracts@dealdesk.com</div></div>
  <div class="block"><span class="lbl">Client</span><div class="val">${c.client_name}</div><div class="sub">${c.client_company||''}</div></div>
</div>
<div class="grid2">
  <div class="block"><span class="lbl">Service Package</span><div class="val">${c.template}</div></div>
  <div class="block"><span class="lbl">Contract Value</span><div class="val">${c.value||'TBD'}</div></div>
  <div class="block"><span class="lbl">Date Created</span><div class="val">${format(new Date(c.created_at),'MMMM d, yyyy')}</div></div>
  <div class="block"><span class="lbl">Status</span><div class="val">${c.status.toUpperCase()}</div></div>
</div>
<h2>1. Scope of Services</h2>
<div class="clause"><h3>${c.template}</h3><p>The Service Provider agrees to deliver professional ${c.template.toLowerCase()} services as outlined in the attached Service Brief. All deliverables, timelines, and milestones are defined therein and form an integral part of this agreement.</p></div>
<h2>2. Payment Terms</h2>
<div class="clause"><h3>Agreed Compensation: ${c.value||'TBD'}</h3><p>Client agrees to pay the agreed amount as specified. Invoices are due within 30 days of receipt. Late payments may incur a 2% monthly fee.</p></div>
<h2>3. Confidentiality</h2>
<p class="body-p">Both parties agree to keep all proprietary information, business strategies, and campaign data confidential during and after the term of this agreement.</p>
<h2>4. Intellectual Property</h2>
<p class="body-p">Upon full payment, all deliverables created specifically for the Client shall become the Client's property. The Service Provider retains portfolio rights unless otherwise agreed.</p>
<h2>5. Term & Termination</h2>
<p class="body-p">Either party may terminate with 30 days written notice. Client shall pay for all services rendered up to the termination date.</p>
<h2>6. Governing Law</h2>
<p class="body-p">This agreement shall be governed by applicable law. Disputes shall be resolved through good-faith negotiation before legal remedies.</p>
${c.notes ? `<h2>7. Additional Notes</h2><div class="clause"><p>${c.notes}</p></div>` : ''}
<div class="sigs">
  <div class="sig"><div class="lbl">Service Provider</div><div class="sig-line"></div><div class="name">DealDesk Agency</div><div class="role">Authorized Signatory · Date: ___________</div></div>
  <div class="sig"><div class="lbl">Client</div><div class="sig-line"></div><div class="name">${c.client_name}</div><div class="role">${c.client_company||''} · Date: ___________</div></div>
</div>
<div class="footer">DealDesk Agency · Professional Services Contract · contracts@dealdesk.com<br/>This document is legally binding once signed by both parties.</div>
</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const win = window.open(URL.createObjectURL(blob), '_blank');
  if (win) win.onload = () => win.print();
}

// ─── Proposal PDF ─────────────────────────────────────────────────────────────
function openProposalPDF(p: ProposalRow) {
  const svcMap: Record<string, { desc: string; items: string[] }> = {
    'Social Media Marketing':  { desc: 'A comprehensive social media management package designed to grow your brand, increase engagement, and drive real results.', items: ['Account management across Instagram, Facebook, TikTok & LinkedIn','Weekly content calendar (15–20 posts/month)','Story & Reel creation','Community management & DM handling','Monthly performance analytics report','Paid ad campaign management (budget separate)'] },
    'Digital Marketing':       { desc: 'A data-driven digital marketing strategy to maximize online visibility, attract qualified leads, and convert them into loyal customers.', items: ['Google & Meta Ads setup and management','SEO audit & on-page optimization','Email marketing campaigns','Landing page optimization','Bi-weekly performance reviews','Competitor analysis'] },
    'Web Development':         { desc: 'Custom website development tailored to your brand identity and business goals.', items: ['Custom responsive design (mobile-first)','CMS integration (WordPress or custom)','E-commerce functionality (if required)','Speed optimization & SEO structure','3 rounds of design revisions','30-day post-launch support'] },
    'Influencer Marketing':    { desc: 'Strategic influencer partnership program to amplify brand awareness through authentic, trusted voices.', items: ['Influencer research & vetting (10–20 profiles)','Campaign strategy & brief creation','Contract negotiations & management','Content review & approval process','Campaign performance tracking','End-of-campaign detailed report'] },
  };
  const svc = svcMap[p.service] || { desc: `Professional ${p.service} services tailored to your business goals.`, items: ['Custom strategy development','Implementation & management','Regular reporting','Dedicated account manager','Monthly reviews','Ongoing optimization'] };

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${p.title}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',sans-serif;color:#1a1a2e}
.hero{background:linear-gradient(135deg,#6366f1,#8b5cf6,#a855f7);padding:56px 50px;color:#fff}
.hero .brand{font-size:17px;font-weight:600;opacity:.9;margin-bottom:36px}
.hero h1{font-size:36px;font-weight:800;margin-bottom:10px;line-height:1.2}
.hero .sub{font-size:15px;opacity:.85;margin-bottom:26px}
.hero .meta{display:flex;gap:26px;font-size:12px;opacity:.8;flex-wrap:wrap}
.hero .meta span{background:rgba(255,255,255,.15);padding:5px 13px;border-radius:20px}
.body{padding:48px}
h2{font-size:21px;font-weight:700;margin-bottom:13px}
h2 span{display:block;width:38px;height:3px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:2px;margin-top:7px}
.intro{font-size:14px;color:#555;line-height:1.8;margin-bottom:36px;padding:18px;background:#f8f7ff;border-radius:10px;border-left:4px solid #6366f1}
.item{display:flex;align-items:flex-start;gap:12px;padding:11px 0;border-bottom:1px solid #f0eeff}
.bullet{width:20px;height:20px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;font-size:10px;color:#fff;font-weight:700}
.item span{font-size:13px;color:#333;line-height:1.5}
.pricing{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-radius:14px;padding:32px;text-align:center;margin:36px 0}
.pricing .lbl{font-size:12px;opacity:.85;text-transform:uppercase;letter-spacing:1px;margin-bottom:9px}
.pricing .price{font-size:48px;font-weight:800;margin-bottom:7px}
.pricing .note{font-size:12px;opacity:.75}
.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin:36px 0}
.card{background:#f8f7ff;border:1px solid #e8e6ff;border-radius:12px;padding:18px;text-align:center}
.card .icon{font-size:26px;margin-bottom:9px}
.card h3{font-size:12px;font-weight:700;margin-bottom:5px}
.card p{font-size:11px;color:#666;line-height:1.5}
.cta{background:#f8f7ff;border-radius:12px;padding:28px;text-align:center;border:1px solid #e8e6ff}
.cta h2{font-size:19px;margin-bottom:9px}
.cta p{font-size:13px;color:#666;margin-bottom:17px}
.cta .contact{font-size:14px;font-weight:600;color:#6366f1}
.footer{padding:26px 50px;background:#f8f7ff;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#888;border-top:1px solid #e8e6ff}
.footer strong{color:#6366f1}
</style></head><body>
<div class="hero">
  <div class="brand">🚀 DealDesk Agency</div>
  <h1>${p.title}</h1>
  <div class="sub">Prepared exclusively for ${p.client_name} · ${p.client_company||''}</div>
  <div class="meta">
    <span>📅 ${format(new Date(p.created_at),'MMMM d, yyyy')}</span>
    <span>💼 ${p.service}</span>
    ${p.value ? `<span>💰 ${p.value}</span>` : ''}
  </div>
</div>
<div class="body">
  <h2>About This Proposal <span></span></h2>
  <div class="intro">${svc.desc}</div>
  <div style="margin-bottom:36px">
    <h2>What's Included <span></span></h2>
    <div style="margin-top:18px">
      ${svc.items.map(i => `<div class="item"><div class="bullet">✓</div><span>${i}</span></div>`).join('')}
    </div>
  </div>
  ${p.value ? `<div class="pricing"><div class="lbl">Investment</div><div class="price">${p.value}</div><div class="note">This proposal is valid for 30 days from the date issued</div></div>` : ''}
  <div class="cards">
    <div class="card"><div class="icon">🏆</div><h3>Proven Results</h3><p>Track record of delivering measurable ROI for 100+ clients globally</p></div>
    <div class="card"><div class="icon">👥</div><h3>Expert Team</h3><p>Dedicated specialists assigned to your account with weekly check-ins</p></div>
    <div class="card"><div class="icon">📊</div><h3>Full Transparency</h3><p>Real-time dashboard access and detailed monthly performance reports</p></div>
  </div>
  <div class="cta">
    <h2>Ready to Get Started?</h2>
    <p>We're excited to partner with ${p.client_company||p.client_name} and help achieve exceptional results.</p>
    <div class="contact">📧 hello@dealdesk.com · 📱 +1 (555) 000-0000</div>
  </div>
</div>
<div class="footer">
  <div><strong>DealDesk Agency</strong> · Professional Digital Services</div>
  <div>Valid until ${format(new Date(new Date(p.created_at).getTime()+30*86400000),'MMMM d, yyyy')}</div>
</div>
</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const win = window.open(URL.createObjectURL(blob), '_blank');
  if (win) win.onload = () => win.print();
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function Contracts() {
  const { profile } = useAuth();
  const { clients, loading: clientsLoading } = useClients();

  const [contracts,  setContracts]  = useState<ContractRow[]>([]);
  const [proposals,  setProposals]  = useState<ProposalRow[]>([]);
  const [loadingC,   setLoadingC]   = useState(true);
  const [loadingP,   setLoadingP]   = useState(true);
  const [activeTab,  setActiveTab]  = useState<'contracts' | 'proposals'>('contracts');
  const [saving,     setSaving]     = useState(false);

  const [showContractModal, setShowContractModal] = useState(false);
  const [showProposalModal, setShowProposalModal] = useState(false);

  const location = useLocation();

  // ── Forms ──────────────────────────────────────────────────────────────────
  const [cForm, setCForm] = useState({ clientId: '', title: '', template: '', value: '', status: 'draft' as ContractRow['status'], notes: '' });
  const [pForm, setPForm] = useState({ clientId: '', service: 'Social Media Marketing', title: '', value: '' });

  // ── Fetch contracts ────────────────────────────────────────────────────────
  const fetchContracts = useCallback(async () => {
    try {
      setLoadingC(true);
      const { data, error } = await supabase.from('contracts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setContracts((data as ContractRow[]) || []);
    } catch { setContracts([]); }
    finally { setLoadingC(false); }
  }, []);

  const fetchProposals = useCallback(async () => {
    try {
      setLoadingP(true);
      const { data, error } = await supabase.from('proposals').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProposals((data as ProposalRow[]) || []);
    } catch { setProposals([]); }
    finally { setLoadingP(false); }
  }, []);

  useEffect(() => { fetchContracts(); fetchProposals(); }, [fetchContracts, fetchProposals]);

  // Pre-select first client when clients load
  useEffect(() => {
    if (clients.length > 0 && !cForm.clientId) {
      setCForm(p => ({ ...p, clientId: clients[0].id }));
      setPForm(p => ({ ...p, clientId: clients[0].id }));
    }
  }, [clients]);

  // Open Create Contract automatically if navigated from Clients page or Header
  useEffect(() => {
    if ((location.state?.createContractForClient || location.state?.openCreateContract) && !loadingC && !clientsLoading) {
      if (location.state?.createContractForClient) {
        setCForm(p => ({ ...p, clientId: location.state.createContractForClient, template: 'Digital Marketing', title: 'Digital Marketing Agreement' }));
      }
      setShowContractModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, clientsLoading, loadingC]);

  // ── Select client helper ────────────────────────────────────────────────────
  const getClient = (id: string) => clients.find(c => c.id === id);

  // ── Create Contract ─────────────────────────────────────────────────────────
  const handleCreateContract = async () => {
    if (!cForm.clientId) { toast.error('Select a client'); return; }
    if (!cForm.template) { toast.error('Select a service type'); return; }
    if (!profile?.company_id) {
      toast.error('Company not linked', { description: 'Please refresh the page and try again.' });
      return;
    }
    setSaving(true);
    const cl = getClient(cForm.clientId)!;
    const payload = {
      company_id:     profile.company_id,
      client_id:      cForm.clientId,
      client_name:    cl.name,
      client_company: cl.company || '',
      title:          cForm.title || `${cForm.template} Agreement`,
      template:       cForm.template,
      status:         cForm.status,
      value:          cForm.value,
      notes:          cForm.notes,
    };
    try {
      const { data, error } = await supabase.from('contracts').insert([payload]).select().single();
      if (error) throw error;
      setContracts(prev => [data as ContractRow, ...prev]);
      toast.success('Contract created!', { description: `${payload.title} for ${cl.name}` });
      setShowContractModal(false);
      setCForm({ clientId: clients[0]?.id || '', title: '', template: '', value: '', status: 'draft', notes: '' });
    } catch (err: any) {
      console.error('[Contracts] Save error:', err);
      toast.error('Failed to save contract', { description: err?.message || 'Database error — check console for details.' });
    } finally {
      setSaving(false);
    }
  };

  // ── Send Proposal ───────────────────────────────────────────────────────────
  const handleSendProposal = async () => {
    if (!pForm.clientId) { toast.error('Select a client'); return; }
    if (!profile?.company_id) {
      toast.error('Company not linked', { description: 'Please refresh the page and try again.' });
      return;
    }
    setSaving(true);
    const cl = getClient(pForm.clientId)!;
    const payload = {
      company_id:     profile.company_id,
      client_id:      pForm.clientId,
      client_name:    cl.name,
      client_company: cl.company || '',
      title:          pForm.title || `${pForm.service} Proposal`,
      service:        pForm.service,
      status:         'sent' as ProposalRow['status'],
      value:          pForm.value,
    };
    try {
      const { data, error } = await supabase.from('proposals').insert([payload]).select().single();
      if (error) throw error;
      setProposals(prev => [data as ProposalRow, ...prev]);
      toast.success('Proposal sent!', { description: `${payload.service} proposal for ${cl.name}` });
      setShowProposalModal(false);
      setPForm({ clientId: clients[0]?.id || '', service: 'Social Media Marketing', title: '', value: '' });
    } catch (err: any) {
      console.error('[Proposals] Save error:', err);
      toast.error('Failed to save proposal', { description: err?.message || 'Database error — check console for details.' });
    } finally {
      setSaving(false);
    }
  };

  // ── Status updaters ─────────────────────────────────────────────────────────
  const updateContractStatus = async (id: string, status: ContractRow['status']) => {
    try { await supabase.from('contracts').update({ status }).eq('id', id); } catch { /* local fallback */ }
    setContracts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
    toast.success(`Contract marked as ${status}`);
  };

  const updateProposalStatus = async (id: string, status: ProposalRow['status']) => {
    try { await supabase.from('proposals').update({ status }).eq('id', id); } catch { /* local fallback */ }
    setProposals(prev => prev.map(p => p.id === id ? { ...p, status } : p));
    toast.success(`Proposal marked as ${status}`);
  };

  const deleteContract = async (id: string) => {
    try { await supabase.from('contracts').delete().eq('id', id); } catch { /* ignore */ }
    setContracts(prev => prev.filter(c => c.id !== id));
    toast.success('Contract deleted');
  };

  const deleteProposal = async (id: string) => {
    try { await supabase.from('proposals').delete().eq('id', id); } catch { /* ignore */ }
    setProposals(prev => prev.filter(p => p.id !== id));
    toast.success('Proposal deleted');
  };

  // ── Template quick-use ──────────────────────────────────────────────────────
  const useTemplate = (name: string) => {
    setCForm(p => ({ ...p, template: name, title: `${name} Agreement` }));
    setShowContractModal(true);
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <Header title="Contracts" subtitle="Create and manage client contracts & proposals" />

      <div className="p-6 space-y-8">

        {/* ── Client spotlight cards ─────────────────────────────────────── */}
        {clientsLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading clients…
          </div>
        ) : clients.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
            <p className="text-sm">No clients found. Add clients first to create contracts.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {clients.map(cl => {
              const initials = cl.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
              const clientContracts = contracts.filter(c => c.client_id === cl.id);
              const clientProposals = proposals.filter(p => p.client_id === cl.id);
              return (
                <div key={cl.id} className="relative rounded-2xl overflow-hidden border border-primary/20 bg-gradient-to-r from-primary/5 via-violet-500/5 to-purple-500/5">
                  <div className="p-5">
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-12 w-12 border-2 border-primary/30">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-foreground">{cl.name}</h3>
                          <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">Active</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{cl.company} · {cl.email}</p>
                        <div className="flex gap-4 mt-1.5 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><FileSignature className="h-3 w-3 text-primary" /> {clientContracts.length} contracts</span>
                          <span className="flex items-center gap-1"><Sparkles className="h-3 w-3 text-violet-500" /> {clientProposals.length} proposals</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5 flex-1" onClick={() => { setPForm(p => ({ ...p, clientId: cl.id })); setShowProposalModal(true); }}>
                        <Sparkles className="h-3.5 w-3.5 text-violet-500" /> Send Proposal
                      </Button>
                      <Button variant="accent" size="sm" className="gap-1.5 flex-1" onClick={() => { setCForm(p => ({ ...p, clientId: cl.id })); setShowContractModal(true); }}>
                        <Plus className="h-3.5 w-3.5" /> New Contract
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Contract Templates ─────────────────────────────────────────── */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Contract Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {TEMPLATES.map((tmpl, i) => (
              <Card
                key={tmpl.id}
                className={cn('cursor-pointer hover:shadow-medium transition-all duration-200 animate-fade-in bg-gradient-to-br border', tmpl.color)}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="text-3xl mb-2">{tmpl.icon}</div>
                  <CardTitle className="text-base">{tmpl.name}</CardTitle>
                  <CardDescription className="text-sm">{tmpl.desc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => useTemplate(tmpl.name)}>
                    <Plus className="h-4 w-4" /> Use Template
                  </Button>
                  <Button variant="ghost" size="sm" className="w-full gap-2 text-xs text-muted-foreground" onClick={() => {
                    const fake: ProposalRow = { id: '0', client_id: '', client_name: 'Preview Client', client_company: '', title: `${tmpl.name} Proposal`, service: tmpl.name, status: 'draft', value: '', created_at: new Date().toISOString() };
                    openProposalPDF(fake);
                  }}>
                    <Eye className="h-3.5 w-3.5" /> Preview Proposal
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Tabs: Contracts / Proposals ────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1 bg-muted/50 rounded-lg p-1">
              {(['contracts', 'proposals'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize',
                    activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab} ({tab === 'contracts' ? contracts.length : proposals.length})
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              {activeTab === 'proposals' && (
                <Button variant="outline" className="gap-2" onClick={() => setShowProposalModal(true)}>
                  <Sparkles className="h-4 w-4" /> Send Proposal
                </Button>
              )}
              <Button variant="accent" className="gap-2" onClick={() => setShowContractModal(true)}>
                <Plus className="h-4 w-4" /> New Contract
              </Button>
            </div>
          </div>

          {/* Contracts tab */}
          {activeTab === 'contracts' && (
            loadingC ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading contracts…
              </div>
            ) : contracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3 border border-dashed border-border rounded-xl">
                <FileSignature className="h-10 w-10 opacity-30" />
                <p className="text-sm font-medium">No contracts yet</p>
                <p className="text-xs">Click "New Contract" to create your first contract.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {contracts.map((c, i) => (
                  <Card key={c.id} className="animate-slide-up hover:shadow-medium transition-all" style={{ animationDelay: `${i * 50}ms` }}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <FileSignature className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{c.title}</h3>
                            <p className="text-sm text-muted-foreground">{c.client_name} · {c.client_company}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {format(new Date(c.created_at), 'MMM d, yyyy')}
                              </span>
                              {c.value && <span className="text-xs font-semibold text-primary">{c.value}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className={cn('capitalize flex items-center gap-1', contractStatus[c.status]?.bg, contractStatus[c.status]?.text)}>
                            {contractStatus[c.status]?.icon} {c.status}
                          </Badge>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { openContractPDF(c); toast.success('Opening contract…'); }}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { updateContractStatus(c.id, 'sent'); toast.success(`Sent to ${c.client_name}`); }}>
                              <Send className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => { openContractPDF(c); }}>View / Download</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateContractStatus(c.id, 'signed')}>Mark as Signed</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateContractStatus(c.id, 'sent')}>Mark as Sent</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => deleteContract(c.id)}>Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          )}

          {/* Proposals tab */}
          {activeTab === 'proposals' && (
            loadingP ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading proposals…
              </div>
            ) : proposals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3 border border-dashed border-border rounded-xl">
                <Sparkles className="h-10 w-10 opacity-30" />
                <p className="text-sm font-medium">No proposals yet</p>
                <p className="text-xs">Click "Send Proposal" to create your first proposal.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {proposals.map((p, i) => (
                  <Card key={p.id} className="animate-slide-up hover:shadow-medium transition-all" style={{ animationDelay: `${i * 50}ms` }}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                            <Sparkles className="h-6 w-6 text-violet-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{p.title}</h3>
                            <p className="text-sm text-muted-foreground">{p.client_name} · {p.client_company}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" /> {format(new Date(p.created_at), 'MMM d, yyyy')}
                              </span>
                              {p.value && <span className="text-xs font-semibold text-violet-500">{p.value}</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className={cn('capitalize', proposalStatus[p.status]?.bg, proposalStatus[p.status]?.text)}>
                            {p.status}
                          </Badge>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { openProposalPDF(p); toast.success('Opening proposal…'); }}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { openProposalPDF(p); }}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateProposalStatus(p.id, 'sent')}>
                              <Send className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openProposalPDF(p)}>View Proposal</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateProposalStatus(p.id, 'accepted')}>Mark as Accepted</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => updateProposalStatus(p.id, 'declined')}>Mark as Declined</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setCForm(prev => ({ ...prev, clientId: p.client_id, template: p.service, title: `${p.service} Agreement`, value: p.value }));
                                  setShowContractModal(true);
                                }}>Convert to Contract</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => deleteProposal(p.id)}>Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* ── New Contract Modal ──────────────────────────────────────────────── */}
      <Dialog open={showContractModal} onOpenChange={setShowContractModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-primary" /> Create New Contract
            </DialogTitle>
            <DialogDescription>Generate a professional service agreement for your client.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Client</label>
              {clientsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading clients…</div>
              ) : (
                <Select value={cForm.clientId} onValueChange={v => setCForm(p => ({ ...p, clientId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Choose a client…" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Service Type</label>
              <Select value={cForm.template} onValueChange={v => setCForm(p => ({ ...p, template: v, title: `${v} Agreement` }))}>
                <SelectTrigger><SelectValue placeholder="Select service…" /></SelectTrigger>
                <SelectContent>
                  {SERVICE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Contract Title</label>
              <Input value={cForm.title} onChange={e => setCForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Social Media Management Agreement" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Contract Value</label>
                <Input value={cForm.value} onChange={e => setCForm(p => ({ ...p, value: e.target.value }))} placeholder="e.g. $2,500/mo" />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Status</label>
                <Select value={cForm.status} onValueChange={v => setCForm(p => ({ ...p, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Send to Client</SelectItem>
                    <SelectItem value="signed">Already Signed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Additional Notes (optional)</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[64px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                value={cForm.notes}
                onChange={e => setCForm(p => ({ ...p, notes: e.target.value }))}
                placeholder="Any specific terms or notes to include in the contract…"
              />
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => setShowContractModal(false)}>Cancel</Button>
              <Button variant="accent" onClick={handleCreateContract} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSignature className="h-4 w-4" />}
                Create Contract
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Send Proposal Modal ─────────────────────────────────────────────── */}
      <Dialog open={showProposalModal} onOpenChange={setShowProposalModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" /> Send Proposal
            </DialogTitle>
            <DialogDescription>Create a professional proposal to send to your client.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Client</label>
              {clientsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
              ) : (
                <Select value={pForm.clientId} onValueChange={v => setPForm(p => ({ ...p, clientId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Choose a client…" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}{c.company ? ` — ${c.company}` : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Service</label>
              <Select value={pForm.service} onValueChange={v => setPForm(p => ({ ...p, service: v, title: `${v} Proposal` }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SERVICE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Proposal Title</label>
              <Input value={pForm.title} onChange={e => setPForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Social Media Marketing Proposal" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Proposed Value</label>
              <Input value={pForm.value} onChange={e => setPForm(p => ({ ...p, value: e.target.value }))} placeholder="e.g. $2,800/mo" />
            </div>
            <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
              <p className="text-xs text-muted-foreground mb-2 font-medium">Proposal will include:</p>
              {['Professional proposal document','Service scope & deliverables','Pricing breakdown','Why Choose Us section','Call-to-action'].map(item => (
                <div key={item} className="flex items-center gap-2 text-xs text-muted-foreground py-0.5">
                  <Check className="h-3 w-3 text-success" /> {item}
                </div>
              ))}
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" className="gap-2" onClick={() => {
                if (!pForm.clientId) { toast.error('Select a client first'); return; }
                const cl = getClient(pForm.clientId)!;
                openProposalPDF({ id: '0', client_id: pForm.clientId, client_name: cl.name, client_company: cl.company||'', title: pForm.title||`${pForm.service} Proposal`, service: pForm.service, status: 'draft', value: pForm.value, created_at: new Date().toISOString() });
                toast.success('Opening preview…');
              }}>
                <Eye className="h-4 w-4" /> Preview
              </Button>
              <Button variant="accent" onClick={handleSendProposal} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send Proposal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
