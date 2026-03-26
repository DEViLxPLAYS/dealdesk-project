import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Send, User } from 'lucide-react';

export default function Messages() {
  return (
    <div className="min-h-screen">
      <Header title="Messages" subtitle="Team communication and follow-ups" />

      <div className="p-6">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Messages & Follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Coming Soon</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Internal team messaging and WhatsApp follow-up automation will be available here. 
                Stay tuned for updates!
              </p>
              <Button variant="outline" className="gap-2">
                <Send className="h-4 w-4" />
                Notify Me When Ready
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
