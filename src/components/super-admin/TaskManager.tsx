"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useSuperAdminTasks, SuperAdminTask } from "@/hooks/useSuperAdminTasks";
import TaskForm from "./TaskForm";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, Check, Trash2, Edit } from "lucide-react";
import { useAuth } from "@/components/auth/SessionContextProvider";
import { toast } from "sonner";

const TaskCard: React.FC<{
  task: SuperAdminTask;
  onEdit: (t: SuperAdminTask) => void;
  onComplete: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}> = ({ task, onEdit, onComplete, onDelete }) => {
  const scheduled = task.scheduled_for ? new Date(task.scheduled_for).toLocaleString() : null;

  return (
    <Card className="mb-2">
      <CardHeader className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{task.title}</h3>
            {task.status === "scheduled" && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" /> Agendada
              </span>
            )}
            {task.status === "completed" && <span className="text-xs text-green-600">Concluída</span>}
          </div>
          <p className="text-sm text-muted-foreground">{task.description}</p>
          {scheduled && <p className="text-xs text-muted-foreground mt-1">Programada para: {scheduled}</p>}
        </div>
        <div className="flex gap-2">
          {task.status !== "completed" && (
            <Button size="sm" onClick={() => onComplete(task.id)}>
              <Check className="h-4 w-4 mr-2" /> Concluir
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onEdit(task)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(task.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};

const TaskManager: React.FC = () => {
  const { tasks, isLoading, createTask, updateTask, deleteTask } = useSuperAdminTasks();
  const [editing, setEditing] = React.useState<SuperAdminTask | null>(null);
  const { user } = useAuth();

  const handleCreate = async (payload: Partial<SuperAdminTask>) => {
    if (!user?.id) {
      toast.error("Você precisa estar logado para criar uma atualização.");
      return;
    }

    await createTask.mutateAsync({
      ...payload,
      created_by: user.id,
    });
  };

  const handleUpdate = async (payload: Partial<SuperAdminTask>) => {
    if (!editing) return;
    await updateTask.mutateAsync({ id: editing.id, updates: payload });
    setEditing(null);
  };

  const handleComplete = async (id: string) => {
    await updateTask.mutateAsync({ id, updates: { status: "completed" } });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover esta tarefa?")) return;
    await deleteTask.mutateAsync(id);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Editar Atualização" : "Nova Atualização"}</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskForm
              initial={editing ?? undefined}
              onSubmit={editing ? handleUpdate : handleCreate}
              onCancel={() => setEditing(null)}
              submitLabel={editing ? "Atualizar" : "Criar"}
            />
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Atualizações</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : tasks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma atualização registrada.</p>
            ) : (
              <div>
                {tasks.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    onEdit={(task) => setEditing(task)}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaskManager;