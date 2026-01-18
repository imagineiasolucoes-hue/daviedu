"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SuperAdminTask, TaskStatus } from "@/hooks/useSuperAdminTasks";
import { toast } from "sonner";

interface TaskFormProps {
  initial?: Partial<SuperAdminTask>;
  onSubmit: (data: { title: string; description?: string; scheduled_for?: string | null; status?: TaskStatus }) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
}

const toLocalDatetimeInput = (iso?: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  // local ISO without seconds for input[type=datetime-local]
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const TaskForm: React.FC<TaskFormProps> = ({ initial, onSubmit, onCancel, submitLabel = "Salvar" }) => {
  const [title, setTitle] = React.useState(initial?.title ?? "");
  const [description, setDescription] = React.useState(initial?.description ?? "");
  const [scheduledFor, setScheduledFor] = React.useState<string>(toLocalDatetimeInput(initial?.scheduled_for));
  const [status, setStatus] = React.useState<TaskStatus>(initial?.status ?? "open");
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      toast.error("Título é obrigatório");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        scheduled_for: scheduledFor ? new Date(scheduledFor).toISOString() : null,
        status,
      };
      await onSubmit(payload);
      setTitle("");
      setDescription("");
      setScheduledFor("");
      setStatus("open");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-2">
      <div>
        <Label className="text-sm">Título</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Atualizar mecanismo de backup" />
      </div>

      <div>
        <Label className="text-sm">Descrição</Label>
        <Textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva a atualização..." />
      </div>

      <div>
        <Label className="text-sm">Agendar para</Label>
        <Input
          type="datetime-local"
          value={scheduledFor}
          onChange={(e) => setScheduledFor(e.target.value)}
        />
      </div>

      <div className="flex gap-2 mt-2">
        <Button type="submit" disabled={loading}>{submitLabel}</Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={loading}>Cancelar</Button>
        )}
      </div>
    </form>
  );
};

export default TaskForm;