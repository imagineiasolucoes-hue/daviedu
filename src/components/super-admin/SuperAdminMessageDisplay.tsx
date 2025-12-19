import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProfile, UserRole } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, X, ShieldAlert, Link as LinkIcon, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SuperAdminMessage {
  id: string;
  title: string;
  content: string;
  tenant_id: string | null;
  target_role: UserRole[];
  link_url: string | null; // Adicionado
  image_url: string | null; // Adicionado
}

// Chave de armazenamento local para dispensar mensagens
const DISMISSED_MESSAGES_KEY = 'dismissed_sa_messages';

const fetchActiveMessages = async (tenantId: string | null, userRole: UserRole): Promise<SuperAdminMessage[]> => {
  // A RLS já filtra por tenant_id e target_role, então a query é simples.
  const { data, error } = await supabase
    .from('super_admin_messages')
    .select('id, title, content, tenant_id, target_role, link_url, image_url') // Incluindo novos campos
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching SA messages:", error);
    throw new Error(error.message);
  }
  
  // Filtro adicional no cliente para garantir que apenas mensagens relevantes sejam exibidas,
  // embora a RLS deva ser o principal mecanismo de segurança.
  const filteredData = data.filter(msg => {
    const isTargetedToTenant = msg.tenant_id === null || msg.tenant_id === tenantId;
    const isTargetedToRole = msg.target_role.includes(userRole);
    return isTargetedToTenant && isTargetedToRole;
  });

  return filteredData as SuperAdminMessage[];
};

const SuperAdminMessageDisplay: React.FC = () => {
  const { profile, isSchoolUser, isLoading: isProfileLoading } = useProfile();
  const tenantId = profile?.tenant_id;
  const userRole = profile?.role;
  const [dismissedMessages, setDismissedMessages] = useState<string[]>([]);

  // Carrega mensagens dispensadas do localStorage
  useEffect(() => {
    const storedDismissed = localStorage.getItem(DISMISSED_MESSAGES_KEY);
    if (storedDismissed) {
      setDismissedMessages(JSON.parse(storedDismissed));
    }
  }, []);

  const { data: messages, isLoading: isLoadingMessages } = useQuery<SuperAdminMessage[], Error>({
    queryKey: ['superAdminMessages', tenantId, userRole],
    queryFn: () => fetchActiveMessages(tenantId, userRole!),
    enabled: !!userRole && isSchoolUser && !isProfileLoading,
    refetchInterval: 60000, // Verifica novas mensagens a cada minuto
  });

  const handleDismiss = (messageId: string) => {
    const newDismissed = [...dismissedMessages, messageId];
    setDismissedMessages(newDismissed);
    localStorage.setItem(DISMISSED_MESSAGES_KEY, JSON.stringify(newDismissed));
  };

  if (isLoadingMessages || isProfileLoading || !isSchoolUser || !messages || messages.length === 0) {
    return null;
  }

  const activeMessages = messages.filter(msg => !dismissedMessages.includes(msg.id));

  if (activeMessages.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 space-y-3 max-w-sm print-hidden">
      {activeMessages.map((msg) => (
        <Alert 
          key={msg.id} 
          className={cn(
            "bg-primary/10 border-primary text-primary dark:bg-primary/20 dark:border-primary/50 shadow-lg relative pr-4 pb-4",
            msg.tenant_id === null ? "border-l-4" : "border-l-2"
          )}
        >
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:bg-primary/20 z-10"
            onClick={() => handleDismiss(msg.id)}
          >
            <X className="h-4 w-4" />
          </Button>
          
          {msg.image_url && (
            <div className="mb-3 -mx-4 -mt-4 h-32 overflow-hidden rounded-t-lg">
              <img src={msg.image_url} alt="Notificação" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="flex items-start gap-3">
            <ShieldAlert className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
            <div>
              <AlertTitle className="font-bold text-base">{msg.title}</AlertTitle>
              <AlertDescription className="text-sm mt-1">
                {msg.content}
              </AlertDescription>
            </div>
          </div>
          
          {msg.link_url && (
            <div className="mt-4">
              <Button asChild size="sm" className="w-full bg-accent hover:bg-accent/90">
                <a href={msg.link_url} target="_blank" rel="noopener noreferrer">
                  <LinkIcon className="mr-2 h-4 w-4" />
                  Acessar Link
                </a>
              </Button>
            </div>
          )}
        </Alert>
      ))}
    </div>
  );
};

export default SuperAdminMessageDisplay;