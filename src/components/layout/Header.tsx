import { Bell, Search, Plus, UserPlus, Briefcase, FileText, FileSignature, FolderKanban } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onAddClientClick?: () => void;
  onAddDealClick?: () => void;
}

export function Header({ title, subtitle, onAddClientClick, onAddDealClick }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="w-64 pl-9 bg-secondary/50 border-transparent focus:border-primary"
          />
        </div>

        {/* Quick Add */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="accent" size="sm" className="gap-2 shadow-sm hover:scale-105 transition-transform">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline font-semibold tracking-wide">Quick Add</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-border/50 shadow-xl bg-background/95 backdrop-blur-xl">
            <DropdownMenuItem 
              className="gap-3 py-2.5 px-3 cursor-pointer rounded-lg hover:bg-primary/5 focus:bg-primary/10 transition-colors"
              onClick={() => {
                if (onAddClientClick) onAddClientClick();
                navigate('/clients', { state: { openNewClient: true } });
              }}
            >
              <div className="p-1.5 bg-primary/10 rounded-md">
                <UserPlus className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">New Client</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Add to Roster</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem 
              className="gap-3 py-2.5 px-3 cursor-pointer rounded-lg hover:bg-success/5 focus:bg-success/10 transition-colors"
              onClick={() => {
                if (onAddDealClick) onAddDealClick();
                navigate('/pipeline', { state: { openNewDeal: true } });
              }}
            >
              <div className="p-1.5 bg-success/10 rounded-md">
                <Briefcase className="h-4 w-4 text-success" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">New Deal</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Add to Pipeline</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem 
              className="gap-3 py-2.5 px-3 cursor-pointer rounded-lg hover:bg-amber-500/5 focus:bg-amber-500/10 transition-colors"
              onClick={() => navigate('/invoices', { state: { openCreateInvoice: true } })}
            >
              <div className="p-1.5 bg-amber-500/10 rounded-md">
                <FileText className="h-4 w-4 text-amber-500" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">New Invoice</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Bill a Client</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem 
              className="gap-3 py-2.5 px-3 cursor-pointer rounded-lg hover:bg-violet-500/5 focus:bg-violet-500/10 transition-colors"
              onClick={() => navigate('/contracts', { state: { openCreateContract: true } })}
            >
              <div className="p-1.5 bg-violet-500/10 rounded-md">
                <FileSignature className="h-4 w-4 text-violet-500" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">New Contract</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Sign Agreement</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuItem 
              className="gap-3 py-2.5 px-3 cursor-pointer rounded-lg hover:bg-pink-500/5 focus:bg-pink-500/10 transition-colors"
              onClick={() => navigate('/projects', { state: { openCreateProject: true } })}
            >
              <div className="p-1.5 bg-pink-500/10 rounded-md">
                <FolderKanban className="h-4 w-4 text-pink-500" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm">New Project</span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Manage Work</span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-accent text-[10px] font-bold text-accent-foreground flex items-center justify-center">
                3
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">Invoice Paid</span>
              <span className="text-sm text-muted-foreground">TechStartup Inc paid $4,400</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">New Lead</span>
              <span className="text-sm text-muted-foreground">Marcus Chen from InnovateCo</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">Contract Signed</span>
              <span className="text-sm text-muted-foreground">GlobalTech signed the agreement</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=admin" />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>Admin User</span>
                <span className="text-xs font-normal text-muted-foreground">admin@dealdesk.com</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
