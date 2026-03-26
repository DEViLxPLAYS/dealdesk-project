import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus, FileSignature, Download, Send, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const templates = [
  {
    id: 'social-media',
    name: 'Social Media Management',
    description: 'Complete social media management agreement',
    icon: '📱',
  },
  {
    id: 'digital-marketing',
    name: 'Digital Marketing',
    description: 'Full-service digital marketing contract',
    icon: '📈',
  },
  {
    id: 'web-development',
    name: 'Web Development',
    description: 'Website design and development agreement',
    icon: '💻',
  },
  {
    id: 'influencer',
    name: 'Influencer Marketing',
    description: 'Influencer partnership agreement',
    icon: '⭐',
  },
];

const contracts = [
  {
    id: '1',
    title: 'Social Media Management Agreement',
    client: 'TechStartup Inc',
    template: 'Social Media',
    status: 'signed',
    signedAt: new Date('2024-02-10'),
    createdAt: new Date('2024-02-01'),
  },
  {
    id: '2',
    title: 'Web Development Contract',
    client: 'InnovateCo',
    template: 'Web Development',
    status: 'sent',
    createdAt: new Date('2024-02-15'),
  },
  {
    id: '3',
    title: 'Marketing Services Agreement',
    client: 'Creative Media',
    template: 'Digital Marketing',
    status: 'draft',
    createdAt: new Date('2024-02-18'),
  },
];

const statusStyles: Record<string, { bg: string; text: string }> = {
  signed: { bg: 'bg-success/10', text: 'text-success' },
  sent: { bg: 'bg-primary/10', text: 'text-primary' },
  draft: { bg: 'bg-muted', text: 'text-muted-foreground' },
  expired: { bg: 'bg-destructive/10', text: 'text-destructive' },
};

export default function Contracts() {
  return (
    <div className="min-h-screen">
      <Header title="Contracts" subtitle="Create and manage client contracts" />

      <div className="p-6 space-y-8">
        {/* Templates Section */}
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Contract Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((template, index) => (
              <Card
                key={template.id}
                className="cursor-pointer hover:shadow-medium hover:border-primary/50 transition-all duration-200 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="text-3xl mb-2">{template.icon}</div>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="text-sm">{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <Plus className="h-4 w-4" />
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Contracts */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Recent Contracts</h2>
            <Button variant="accent" className="gap-2">
              <Plus className="h-4 w-4" />
              New Contract
            </Button>
          </div>

          <div className="grid gap-4">
            {contracts.map((contract, index) => (
              <Card
                key={contract.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileSignature className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{contract.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {contract.client} • {contract.template}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'capitalize',
                          statusStyles[contract.status].bg,
                          statusStyles[contract.status].text
                        )}
                      >
                        {contract.status}
                      </Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Send className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Contract</DropdownMenuItem>
                            <DropdownMenuItem>Edit Contract</DropdownMenuItem>
                            <DropdownMenuItem>Duplicate</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
