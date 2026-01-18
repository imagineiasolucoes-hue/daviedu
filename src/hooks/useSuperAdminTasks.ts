import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type TaskStatus = "open" | "scheduled" | "completed" | "cancelled";

export interface SuperAdminTask {
  id: string;
  title: string;
  description?: string | null;
  status: TaskStatus;
  scheduled_for?: string | null;
  created_by?: string | null;
  created_at: string;
}

const fetchTasks = async (): Promise<SuperAdminTask[]> => {
  const { data, error } = await supabase
    .from("super_admin_tasks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as SuperAdminTask[];
};

export const useSuperAdminTasks = () => {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<SuperAdminTask[], Error>({
    queryKey: ["superAdminTasks"],
    queryFn: fetchTasks,
    staleTime: 1000 * 60, // 1 minute
  });

  const createTask = useMutation<SuperAdminTask, Error, Partial<SuperAdminTask>>({
    mutationFn: async (payload) => {
      const { data, error } = await supabase
        .from("super_admin_tasks")
        .insert([{ ...payload }])
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as SuperAdminTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superAdminTasks"] });
      toast.success("Tarefa criada com sucesso");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar tarefa");
    },
  });

  const updateTask = useMutation<
    SuperAdminTask,
    Error,
    { id: string; updates: Partial<SuperAdminTask> }
  >({
    mutationFn: async ({ id, updates }) => {
      const { data, error } = await supabase
        .from("super_admin_tasks")
        .update({ ...updates })
        .eq("id", id)
        .select()
        .maybeSingle();
      if (error) throw new Error(error.message);
      return data as SuperAdminTask;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superAdminTasks"] });
      toast.success("Tarefa atualizada");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao atualizar tarefa");
    },
  });

  const deleteTask = useMutation<string, Error, string>({
    mutationFn: async (id) => {
      const { error } = await supabase.from("super_admin_tasks").delete().eq("id", id);
      if (error) throw new Error(error.message);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["superAdminTasks"] });
      toast.success("Tarefa removida");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao remover tarefa");
    },
  });

  return {
    tasks: data ?? [],
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
  };
};