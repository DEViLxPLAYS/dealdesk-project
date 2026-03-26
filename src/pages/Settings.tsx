import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Building, Users, Mail, CreditCard, Bell, Shield, Plus, Trash2 } from 'lucide-react';

const teamMembers = [
  { id: '1', name: 'John Doe', email: 'john@dealdesk.com', role: 'Admin', avatar: 'john' },
  { id: '2', name: 'Jane Smith', email: 'jane@dealdesk.com', role: 'Sales Agent', avatar: 'jane' },
  { id: '3', name: 'Mike Johnson', email: 'mike@dealdesk.com', role: 'Viewer', avatar: 'mike' },
];

const roleColors: Record<string, string> = {
  Admin: 'bg-primary/10 text-primary',
  'Sales Agent': 'bg-accent/10 text-accent',
  Viewer: 'bg-muted text-muted-foreground',
};

export default function Settings() {
  return (
    <div className="min-h-screen">
      <Header title="Settings" subtitle="Manage your account and preferences" />

      <div className="p-6">
        <Tabs defaultValue="business" className="space-y-6">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="business" className="gap-2">
              <Building className="h-4 w-4" />
              Business
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
            <TabsTrigger value="billing" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Business Settings */}
          <TabsContent value="business" className="space-y-6">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Business Profile</CardTitle>
                <CardDescription>Update your business information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="https://api.dicebear.com/7.x/shapes/svg?seed=dealdesk" />
                    <AvatarFallback className="text-2xl">DD</AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline">Change Logo</Button>
                    <p className="text-sm text-muted-foreground mt-2">JPG, PNG. Max 2MB</p>
                  </div>
                </div>
                <Separator />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name</Label>
                    <Input id="businessName" defaultValue="Deal Desk Agency" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Business Email</Label>
                    <Input id="email" type="email" defaultValue="contact@dealdesk.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" defaultValue="+1 555-123-4567" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input id="website" defaultValue="https://dealdesk.com" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input id="address" defaultValue="123 Business St, New York, NY 10001" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button variant="gradient">Save Changes</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Settings */}
          <TabsContent value="team" className="space-y-6">
            <Card className="animate-fade-in">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage your team and their permissions</CardDescription>
                  </div>
                  <Button variant="accent" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Invite Member
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.map((member, index) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-muted/30 animate-slide-up"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.avatar}`} />
                          <AvatarFallback>{member.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{member.name}</p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary" className={roleColors[member.role]}>
                          {member.role}
                        </Badge>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Billing Settings */}
          <TabsContent value="billing" className="space-y-6">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>You're currently on the Pro plan</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-6 rounded-xl gradient-primary">
                  <div>
                    <h3 className="text-2xl font-bold text-primary-foreground">Pro Plan</h3>
                    <p className="text-primary-foreground/80">5 users, unlimited clients</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary-foreground">$49</p>
                    <p className="text-primary-foreground/80">/month</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-2 border-muted">
                    <CardHeader>
                      <CardTitle className="text-base">Starter</CardTitle>
                      <CardDescription>$19/month</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li>1 user</li>
                        <li>20 clients</li>
                        <li>Basic features</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-primary">
                    <CardHeader>
                      <Badge className="w-fit mb-2">Current</Badge>
                      <CardTitle className="text-base">Pro</CardTitle>
                      <CardDescription>$49/month</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li>5 users</li>
                        <li>Unlimited clients</li>
                        <li>All features</li>
                      </ul>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-muted">
                    <CardHeader>
                      <CardTitle className="text-base">Agency</CardTitle>
                      <CardDescription>$99/month</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-2 text-muted-foreground">
                        <li>Unlimited users</li>
                        <li>White-label option</li>
                        <li>Priority support</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notification Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Choose what updates you receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { id: 'invoices', title: 'Invoice Updates', description: 'Get notified when invoices are paid or overdue' },
                  { id: 'leads', title: 'New Leads', description: 'Get notified when new leads are added' },
                  { id: 'contracts', title: 'Contract Signatures', description: 'Get notified when contracts are signed' },
                  { id: 'projects', title: 'Project Updates', description: 'Get notified about project status changes' },
                ].map((item, index) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between animate-slide-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div>
                      <p className="font-medium text-foreground">{item.title}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
