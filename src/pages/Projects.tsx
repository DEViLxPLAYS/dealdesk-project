import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus, Minus, FolderKanban, MoreHorizontal, Calendar,
  Loader2, CheckCircle2, PauseCircle, TrendingUp,
  Search, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjects, CreateProjectInput } from '@/hooks/useProjects';
import { useClients } from '@/hooks/useClients';
import { toast } from 'sonner';
import { format } from 'date-fns';

// ─── Status config ──────────────────────────────────────────────────────────────
const statusConfig = {
  active:    { bg: 'bg-emerald-500/10', text: 'text-emerald-600', border: 'border-emerald-500/20', dot: 'bg-emerald-500', icon: TrendingUp },
  'on-hold': { bg: 'bg-amber-500/10',   text: 'text-amber-600',   border: 'border-amber-500/20',   dot: 'bg-amber-500',   icon: PauseCircle },
  completed: { bg: 'bg-primary/10',     text: 'text-primary',     border: 'border-primary/20',     dot: 'bg-primary',     icon: CheckCircle2 },
} as const;

const progressColor = (status: string) =>
  status === 'active' ? 'bg-emerald-500' :
  status === 'on-hold' ? 'bg-amber-500' : 'bg-primary';

// ─── New Project modal ──────────────────────────────────────────────────────────
interface NewProjectForm {
  client_id: string;
  name: string;
  description: string;
  status: 'active' | 'on-hold' | 'completed';
  progress: number;
  due_date: string;
}

const defaultForm = (): NewProjectForm => ({
  client_id: '',
  name: '',
  description: '',
  status: 'active',
  progress: 0,
  due_date: format(new Date(Date.now() + 30 * 86400000), 'yyyy-MM-dd'),
});

// ══════════════════════════════════════════════════════════════════════════════
export default function Projects() {
  const { profile } = useAuth();
  const { projects, loading, activeCount, onHoldCount, completedCount, createProject, updateProject, deleteProject } = useProjects();
  const { clients, loading: clientsLoading } = useClients();

  const [search, setSearch]           = useState('');
  const [showNew, setShowNew]         = useState(false);
  const [form, setForm]               = useState<NewProjectForm>(defaultForm());
  const [saving, setSaving]           = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const location = useLocation();

  useEffect(() => {
    if (location.state?.openCreateProject && !loading && !clientsLoading) {
      if (clients.length > 0) {
        setForm(p => ({ ...p, client_id: clients[0].id }));
      }
      setShowNew(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, loading, clientsLoading, clients]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client_name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = async () => {
    if (!form.client_id) { toast.error('Please select a client'); return; }
    if (!form.name.trim()) { toast.error('Project name is required'); return; }
    if (!profile?.company_id) {
      toast.error('Company not linked', { description: 'Please refresh the page and try again.' });
      return;
    }

    setSaving(true);
    const client = clients.find(c => c.id === form.client_id);
    const input: CreateProjectInput = {
      company_id:  profile.company_id,
      client_id:   form.client_id,
      client_name: client?.name || '',
      name:        form.name.trim(),
      description: form.description || undefined,
      status:      form.status,
      progress:    form.progress,
      due_date:    form.due_date || undefined,
    };

    const result = await createProject(input);
    setSaving(false);

    if (result.success) {
      toast.success('Project created!', { description: `"${input.name}" for ${input.client_name}` });
      setShowNew(false);
      setForm(defaultForm());
    } else {
      toast.error('Failed to create project', { description: result.error });
    }
  };

  const handleProgressChange = async (id: string, current: number, delta: number) => {
    const next = Math.min(100, Math.max(0, current + delta));
    const result = await updateProject(id, { progress: next });
    if (!result.success) toast.error('Failed to update progress');
  };

  const handleStatusChange = async (id: string, status: 'active' | 'on-hold' | 'completed') => {
    const result = await updateProject(id, { status });
    if (result.success) toast.success(`Project marked as ${status}`);
    else toast.error('Failed to update status');
  };

  const handleDelete = async (id: string, name: string) => {
    await deleteProject(id);
    toast.success('Project archived', { description: name });
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <Header title="Projects" subtitle="Track project progress and deliverables" />

      <div className="p-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Active */}
          <Card className="animate-fade-in border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {loading ? '–' : activeCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* On Hold */}
          <Card className="animate-fade-in border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <PauseCircle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {loading ? '–' : onHoldCount}
                  </p>
                  <p className="text-sm text-muted-foreground">On Hold</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed */}
          <Card className="animate-fade-in border-primary/20 bg-gradient-to-br from-primary/5 to-transparent" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {loading ? '–' : completedCount}
                  </p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New Project Button */}
          <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <CardContent className="p-5 flex items-center justify-center h-full">
              <Button
                variant="accent"
                className="gap-2 w-full h-11 text-sm font-semibold shadow-lg shadow-primary/20"
                onClick={() => setShowNew(true)}
              >
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects or clients..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'on-hold', 'completed'] as const).map(s => (
              <Button
                key={s}
                variant={statusFilter === s ? 'default' : 'outline'}
                size="sm"
                className="capitalize"
                onClick={() => setStatusFilter(s)}
              >
                {s === 'all' ? 'All' : s}
              </Button>
            ))}
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground gap-3">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading projects…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center">
              <FolderKanban className="h-8 w-8 opacity-40" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">No projects yet</p>
              <p className="text-sm mt-1">Click "New Project" to create your first project.</p>
            </div>
            <Button variant="accent" size="sm" className="gap-2 mt-2" onClick={() => setShowNew(true)}>
              <Plus className="h-4 w-4" /> New Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((project, index) => {
              const cfg = statusConfig[project.status];
              const StatusIcon = cfg.icon;
              const isOverdue = project.due_date && new Date(project.due_date) < new Date() && project.status !== 'completed';

              return (
                <Card
                  key={project.id}
                  className="animate-slide-up hover:shadow-medium transition-all duration-200 group border border-border/60"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base leading-tight truncate">{project.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/50 inline-block" />
                          {project.client_name}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="secondary"
                          className={cn('capitalize gap-1 text-xs font-medium', cfg.bg, cfg.text, cfg.border, 'border')}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {project.status}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStatusChange(project.id, 'active')}>Mark Active</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(project.id, 'on-hold')}>Put On Hold</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange(project.id, 'completed')}>Mark Completed</DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(project.id, project.name)}
                            >
                              Archive Project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Description */}
                    {project.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                    )}

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Progress</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleProgressChange(project.id, project.progress, -5)}
                            disabled={project.progress === 0}
                            className="h-5 w-5 rounded-full border border-border/60 flex items-center justify-center hover:bg-muted hover:border-primary/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Minus className="h-2.5 w-2.5 text-muted-foreground" />
                          </button>
                          <span className={cn(
                            'text-xs font-bold tabular-nums min-w-[2.5rem] text-center',
                            project.progress === 100 ? 'text-emerald-600' :
                            project.progress >= 60  ? 'text-primary' : 'text-foreground'
                          )}>
                            {project.progress}%
                          </span>
                          <button
                            onClick={() => handleProgressChange(project.id, project.progress, 5)}
                            disabled={project.progress === 100}
                            className="h-5 w-5 rounded-full border border-border/60 flex items-center justify-center hover:bg-muted hover:border-primary/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Plus className="h-2.5 w-2.5 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={cn('h-full rounded-full transition-all duration-500', progressColor(project.status))}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-1">
                      <div className={cn('flex items-center gap-1.5 text-xs', isOverdue ? 'text-destructive' : 'text-muted-foreground')}>
                        {isOverdue ? <AlertCircle className="h-3.5 w-3.5" /> : <Calendar className="h-3.5 w-3.5" />}
                        {project.due_date ? (
                          <span>{isOverdue ? 'Overdue · ' : 'Due '}{format(new Date(project.due_date), 'MMM d, yyyy')}</span>
                        ) : (
                          <span>No due date</span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground/60">
                        {format(new Date(project.created_at), 'MMM yyyy')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* ── New Project Modal ──────────────────────────────────────────────────── */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <FolderKanban className="h-5 w-5 text-primary" />
              Create New Project
            </DialogTitle>
            <DialogDescription>
              Link a project to a client and track its progress.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-1">
            {/* Client */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Client *</label>
              {clientsLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading clients…
                </div>
              ) : clients.length === 0 ? (
                <p className="text-sm text-destructive">No clients found. Add a client first.</p>
              ) : (
                <Select value={form.client_id} onValueChange={v => setForm(p => ({ ...p, client_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select a client…" /></SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}{c.company ? ` — ${c.company}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Project Name */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-1.5 block">Project Name *</label>
              <Input
                placeholder="e.g. Website Redesign, Social Media Campaign…"
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              />
            </div>

            {/* Description */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Description</label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm min-h-[72px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Brief description of the project scope…"
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              />
            </div>

            {/* Status + Due Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Status</label>
                <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Due Date</label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                />
              </div>
            </div>

            {/* Progress */}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block flex justify-between">
                <span>Initial Progress</span>
                <span className="text-foreground font-semibold">{form.progress}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={form.progress}
                onChange={e => setForm(p => ({ ...p, progress: Number(e.target.value) }))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="outline" onClick={() => { setShowNew(false); setForm(defaultForm()); }}>Cancel</Button>
              <Button variant="accent" onClick={handleCreate} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Create Project
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
