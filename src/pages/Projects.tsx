import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Plus, FolderKanban, MoreHorizontal, Calendar, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const projects = [
  {
    id: '1',
    name: 'TechStartup Website Redesign',
    client: 'TechStartup Inc',
    status: 'active',
    progress: 65,
    dueDate: new Date('2024-04-15'),
    assignedTo: ['John D.', 'Sarah M.'],
    phases: [
      { name: 'Discovery', status: 'completed' },
      { name: 'Design', status: 'completed' },
      { name: 'Development', status: 'in-progress' },
      { name: 'Testing', status: 'pending' },
    ],
  },
  {
    id: '2',
    name: 'Social Media Campaign Q1',
    client: 'InnovateCo',
    status: 'active',
    progress: 40,
    dueDate: new Date('2024-03-31'),
    assignedTo: ['Emma L.'],
    phases: [
      { name: 'Strategy', status: 'completed' },
      { name: 'Content Creation', status: 'in-progress' },
      { name: 'Publishing', status: 'pending' },
      { name: 'Analytics', status: 'pending' },
    ],
  },
  {
    id: '3',
    name: 'Brand Identity Package',
    client: 'Creative Media',
    status: 'on-hold',
    progress: 25,
    dueDate: new Date('2024-05-01'),
    assignedTo: ['John D.'],
    phases: [
      { name: 'Research', status: 'completed' },
      { name: 'Concepts', status: 'in-progress' },
      { name: 'Refinement', status: 'pending' },
      { name: 'Delivery', status: 'pending' },
    ],
  },
  {
    id: '4',
    name: 'E-commerce Integration',
    client: 'GlobalTech Solutions',
    status: 'completed',
    progress: 100,
    dueDate: new Date('2024-02-28'),
    assignedTo: ['Sarah M.', 'Mike R.'],
    phases: [
      { name: 'Setup', status: 'completed' },
      { name: 'Integration', status: 'completed' },
      { name: 'Testing', status: 'completed' },
      { name: 'Launch', status: 'completed' },
    ],
  },
];

const statusStyles: Record<string, { bg: string; text: string }> = {
  active: { bg: 'bg-success/10', text: 'text-success' },
  'on-hold': { bg: 'bg-warning/10', text: 'text-warning' },
  completed: { bg: 'bg-primary/10', text: 'text-primary' },
};

const phaseStatusColors: Record<string, string> = {
  completed: 'bg-success',
  'in-progress': 'bg-primary',
  pending: 'bg-muted',
};

export default function Projects() {
  return (
    <div className="min-h-screen">
      <Header title="Projects" subtitle="Track project progress and deliverables" />

      <div className="p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="animate-fade-in">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <FolderKanban className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">12</p>
                  <p className="text-sm text-muted-foreground">Active Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <FolderKanban className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">3</p>
                  <p className="text-sm text-muted-foreground">On Hold</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderKanban className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">45</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <CardContent className="p-4 flex items-center justify-center">
              <Button variant="accent" className="gap-2 w-full">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {projects.map((project, index) => (
            <Card
              key={project.id}
              className="animate-slide-up hover:shadow-medium transition-all duration-200"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{project.client}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'capitalize',
                        statusStyles[project.status].bg,
                        statusStyles[project.status].text
                      )}
                    >
                      {project.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Edit Project</DropdownMenuItem>
                        <DropdownMenuItem>Add Phase</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium text-foreground">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>

                {/* Phases */}
                <div className="flex gap-1">
                  {project.phases.map((phase) => (
                    <div
                      key={phase.name}
                      className={cn(
                        'flex-1 h-1.5 rounded-full',
                        phaseStatusColors[phase.status]
                      )}
                      title={`${phase.name}: ${phase.status}`}
                    />
                  ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Due {project.dueDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground mr-1" />
                    <div className="flex -space-x-2">
                      {project.assignedTo.slice(0, 3).map((person, i) => (
                        <Avatar key={i} className="h-6 w-6 border-2 border-card">
                          <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                            {person.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
