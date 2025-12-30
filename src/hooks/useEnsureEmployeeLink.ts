import { useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Profile } from './useProfile';

const ATTEMPT_KEY_PREFIX = 'employeeLinkAttempted';

async function findEmployeeId(userId: string, tenantId: string) {
  const { data, error } = await supabase
    .from('employees')
    .select('id')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) throw error;
  return data?.id ?? null;
}

async function updateProfileEmployeeId(userId: string, employeeId: string) {
  const { error } = await supabase
    .from('profiles')
    .update({ employee_id: employeeId })
    .eq('id', userId);

  if (error) throw error;
  return true;
}

/**
 * useEnsureEmployeeLink(profile)
 * - Runs once per user session (tracked in sessionStorage) to link employee_id to profiles if missing.
 * - Uses react-query mutation and invalidates ['profile', userId] on success so profile is refreshed in a controlled way.
 */
export default function useEnsureEmployeeLink(profile: Profile | null | undefined) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({ userId, employeeId }: { userId: string; employeeId: string }) => {
      return updateProfileEmployeeId(userId, employeeId);
    },
    onSuccess: (_data, variables) => {
      // mark attempted so we don't loop
      if (variables?.userId) {
        sessionStorage.setItem(`${ATTEMPT_KEY_PREFIX}:${variables.userId}`, '1');
        // Invalidate profile query to reflect the updated employee_id
        queryClient.invalidateQueries({ queryKey: ['profile', variables.userId] });
      }
    },
    onError: (err) => {
      console.error("useEnsureEmployeeLink mutation error:", err);
      // mark attempted to avoid retry storm; admin can re-run if needed
    },
  });

  useEffect(() => {
    if (!profile) return;

    const userId = profile.id;
    const tenantId = profile.tenant_id;
    const role = profile.role;

    // Only run for teacher/admin/secretary with tenant context and missing employee_id
    if (!tenantId) return;
    if (!(role === 'teacher' || role === 'admin' || role === 'secretary')) return;
    if (profile.employee_id) return;

    // Avoid repeating attempts within same session
    const attempted = sessionStorage.getItem(`${ATTEMPT_KEY_PREFIX}:${userId}`);
    if (attempted) return;

    let mounted = true;

    (async () => {
      try {
        const empId = await findEmployeeId(userId, tenantId);
        if (!mounted) return;
        // mark attempted even if not found to avoid repeated tries (can be changed later)
        sessionStorage.setItem(`${ATTEMPT_KEY_PREFIX}:${userId}`, '1');

        if (empId) {
          // perform mutation to update profile
          mutation.mutate({ userId, employeeId: empId });
        } else {
          // No employee found; nothing to update (already marked attempted)
          console.warn(`useEnsureEmployeeLink: no employee found for user ${userId} and tenant ${tenantId}`);
        }
      } catch (err) {
        console.error("useEnsureEmployeeLink error:", err);
        // mark attempted to avoid loops
        sessionStorage.setItem(`${ATTEMPT_KEY_PREFIX}:${userId}`, '1');
      }
    })();

    return () => { mounted = false; };
  }, [profile, mutation, queryClient]);
}