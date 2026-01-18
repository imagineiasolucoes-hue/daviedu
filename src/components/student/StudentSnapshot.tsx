"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentSnapshotProps {
  fullName: string;
  registrationCode?: string | null;
  className?: string | null;
  tenantName?: string | null;
  avatarUrl?: string | null;
  birthDate?: string | null;
  courseName?: string | null;
  onGenerateReport?: () => void;
  onContactSecretary?: () => void;
}

const StudentSnapshot: React.FC<StudentSnapshotProps> = ({
  fullName,
  registrationCode,
  className,
  tenantName,
  avatarUrl,
  birthDate,
  courseName,
  onGenerateReport,
  onContactSecretary,
}) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt={fullName} />
            ) : (
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-base">{fullName}</span>
            <span className="text-sm text-muted-foreground">
              {tenantName ? tenantName : "Instituição"}
            </span>
          </div>
        </CardTitle>
        <CardDescription className="mt-2 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <div className="text-xs text-muted-foreground">Matrícula</div>
              <div className="font-medium break-words">{registrationCode || "N/A"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Turma / Curso</div>
              <div className="font-medium">{className || "N/A"}{courseName ? ` — ${courseName}` : ''}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Nascimento</div>
              <div className="font-medium">{birthDate || 'N/A'}</div>
            </div>
          </div>

          <div className="mt-3 flex flex-col sm:flex-row gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onGenerateReport}
              className="w-full sm:w-auto"
            >
              <FileText className="mr-2 h-4 w-4" />
              Gerar Boletim
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onContactSecretary}
              className="w-full sm:w-auto"
            >
              Secretaria
            </Button>
          </div>
        </CardDescription>
      </CardHeader>
      {/* Compact footer visible on very small screens to give quick glance info */}
      <CardContent className="block sm:hidden pt-0">
        <div className="flex justify-between text-xs text-muted-foreground">
          <div>
            <div className="text-[10px]">Último acesso</div>
            <div className="font-medium text-[12px]">—</div>
          </div>
          <div>
            <div className="text-[10px]">Notificações</div>
            <div className="font-medium text-[12px]">—</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentSnapshot;