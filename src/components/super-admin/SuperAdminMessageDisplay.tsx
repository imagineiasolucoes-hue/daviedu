import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  link_url: string | null;
  image_url: string | null;
}

// Removed DISMISSED_MESSAGES_KEY as dismissal is now handled via profile in DB

const fetchActiveMessages = async (tenantId: string | null, userRole: UserRole): Promise<SuperAdminMessage[]> => {
  const { data, error } = await supabase
    .from('super_admin_messages')
    .select('id, title, content, tenant_id, target_role, link_url, image_url')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching SA messages:", error);
    throw new Error(error.message);
  }
  
  const filteredData = data.filter(msg => {
    const isTargetedToTenant = msg.tenant_id === null || msg.tenant_id === tenantId;
    const isTargetedToRole = msg.target_role.includes(userRole);
    return isTargetedToTenant && isTargetedToRole;
  });

  return filteredData as SuperAdminMessage[];
};

const SuperAdminMessageDisplay: React.FC = () => {
  const { profile, isSchoolUser, isLoading: isProfileLoading, refetch: refetchProfile } = useProfile();
  const tenantId = profile?.tenant_id;
  const userRole = profile?.role;
  const userId = profile?.id;

  const queryClient = useQueryClient();

  const { data: messages, isLoading: isLoadingMessages } = useQuery<SuperAdminMessage[], Error>({
    queryKey: ['superAdminMessages', tenantId, userRole],
    queryFn: () => fetchActiveMessages(tenantId, userRole!),
    // Enable if user is authenticated and profile is loaded, regardless of isSchoolUser for global messages
    enabled: !!userRole && !isProfileLoading,
    refetchInterval: 60000,
  });

  const dismissMutation = useMutation({
    mutationFn: async (messageId: string) => {
      if (!userId) throw new Error("User not authenticated.");
      
      const currentDismissedIds = profile?.dismissed_sa_messages_ids || [];
      const newDismissedIds = [...new Set([...currentDismissedIds, messageId])]; // Add new ID, ensure uniqueness

      const { error } = await supabase
        .from('profiles')
        .update({ dismissed_sa_messages_ids: newDismissedIds })
        .eq('id', userId);

      if (error) throw new Error(error.message);
      return newDismissedIds;
    },
    onSuccess: (newDismissedIds) => {
      // Optimistically update the profile data in cache
      queryClient.setQueryData(['profile', userId], (oldProfile: any) => {
        if (oldProfile) {
          return { ...oldProfile, dismissed_sa_messages_ids: newDismissedIds };
        }
        return oldProfile;
      });
      // No need to refetch profile, as we updated cache. Invalidate messages to re-filter.
      queryClient.invalidateQueries({ queryKey: ['superAdminMessages', tenantId, userRole] });
    },
    onError: (error) => {
      toast.error("Erro ao dispensar mensagem", { description: error.message });
    },
  });

  const handleDismiss = (messageId: string) => {
    dismissMutation.mutate(messageId);
  };

  console.log("SuperAdminMessageDisplay - Profile:", profile);
  console.log("SuperAdminMessageDisplay - userRole:", userRole);
  console.log("SuperAdminMessageDisplay - isLoadingMessages:", isLoadingMessages);
  console.log("SuperAdminMessageDisplay - isProfileLoading:", isProfileLoading);
  console.log("SuperAdminMessageDisplay - messages:", messages);

  if (isLoadingMessages || isProfileLoading || !userRole || !messages || messages.length === 0) {
    console.log("SuperAdminMessageDisplay - Returning null due to initial conditions.");
    return null;
  }

  // Filter messages based on profile's dismissed_sa_messages_ids
  const dismissedByProfile = profile?.dismissed_sa_messages_ids || [];
  const activeMessages = messages.filter(msg => !dismissedByProfile.includes(msg.id));

  console.log("SuperAdminMessageDisplay - dismissedByProfile:", dismissedByProfile);
  console.log("SuperAdminMessageDisplay - activeMessages:", activeMessages);

  if (activeMessages.length === 0) {
    console.log("SuperAdminMessageDisplay - Returning null as no active messages.");
    return null;
  }

  // Display only the most recent active message
  const mostRecentMessage = activeMessages[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print-hidden">
      <Alert 
        key={mostRecentMessage.id} 
        className={cn(
          "w-full max-w-md mx-auto bg-white text-foreground border-border shadow-lg relative pr-4 pb-4 rounded-xl",
          mostRecentMessage.tenant_id === null ? "border-l-4 border-primary" : "border-l-2 border-primary"
        )}
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:bg-muted z-10"
          onClick={() => handleDismiss(mostRecentMessage.id)}
          disabled={dismissMutation.isPending}
        >
          <X className="h-4 w-4" />
        </Button>
        
        {mostRecentMessage.image_url && (
          <div className="mb-3 -mx-4 -mt-4 aspect-square overflow-hidden rounded-t-xl"> {/* Changed to aspect-square */}
            <img src={mostRecentMessage.image_url} alt="Notificação" className="w-full h-full object-cover" /> {/* Image fills the square */}
          </div>
        )}

        <div className="flex flex-col gap-2"> {/* Changed to flex-col for text below image */}
          <div className="flex items-start gap-3">
            <ShieldAlert className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
            <div>
              <AlertTitle className="font-bold text-base">{mostRecentMessage.title}</AlertTitle>
            </div>
          </div>
          <AlertDescription className="text-sm mt-1">
            {mostRecentMessage.content}
          </AlertDescription>
        </div>
        
        {mostRecentMessage.link_url && (
          <div className="mt-4">
            <Button asChild size="sm" className="w-full bg-accent hover:bg-accent/90">
              <a href={mostRecentMessage.link_url} target="_blank" rel="noopener noreferrer">
                <LinkIcon className="mr-2 h-4 w-4" />
                Acessar Link
              </a>
            </Button>
          </div>
        )}
      </Alert>
    </div>
  );
};

export default SuperAdminMessageDisplay;