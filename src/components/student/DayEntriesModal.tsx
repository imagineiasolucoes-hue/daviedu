"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO } from "date-fns";

interface Entry {
  id: string;
  entry_date: string;
  content: string;
  homework?: string | null;
  general_observations?: string | null;
  attendance?: { student_id: string; status: "present" | "absent" | "late" }[];
  employees?: { full_name: string } | null;
}

interface DayEntriesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date?: Date | null;
  entries?: Entry[] | null;
}

const DayEntriesModal: React.FC<DayEntriesModalProps> = ({ open, onOpenChange, date, entries }) => {
  const formattedDate = date ? format(date, "dd 'de' MMMM yyyy") : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Entradas do Diário — {formattedDate}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {(!entries || entries.length === 0) && (
            <Card>
              <CardContent className="p-4 text-sm text-muted-foreground">
                Nenhuma entrada registrada para este dia.
              </CardContent>
            </Card>
          )}

          {entries?.map((entry) => (
            <Card key={entry.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{entry.employees?.full_name || "Professor"}</span>
                  <span className="text-xs text-muted-foreground">
                    {entry.entry_date ? format(parseISO(entry.entry_date), "HH:mm") : ""}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                {entry.content && (
                  <div>
                    <div className="text-xs text-muted-foreground">Conteúdo</div>
                    <div>{entry.content}</div>
                  </div>
                )}

                {entry.homework && (
                  <div>
                    <div className="text-xs text-muted-foreground">Tarefa</div>
                    <div>{entry.homework}</div>
                  </div>
                )}

                {entry.attendance && entry.attendance.length > 0 && (
                  <div>
                    <div className="text-xs text-muted-foreground">Frequência</div>
                    <ul className="list-disc list-inside">
                      {entry.attendance.map((a, idx) => (
                        <li key={idx} className="text-sm">
                          Aluno {a.student_id} — {a.status}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {entry.general_observations && (
                  <div>
                    <div className="text-xs text-muted-foreground">Observações</div>
                    <div>{entry.general_observations}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter className="mt-4">
          <div className="w-full flex justify-end">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DayEntriesModal;