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
  onGenerateReport?: () => void;
  onContactSecretary?: () => void;
}

const StudentSnapshot: React.FC<StudentSnapshotProps> = ({
  fullName,
  registrationCode,
  className,
  tenantName,
  avatarUrl,
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
              <div className="font-medium">{registrationCode || "N/A"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Turma</div>
              <div className="font-medium">{className || "N/A"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Ações</div>
              <div className="flex gap-2 mt-1">
                <Button size="sm" variant="outline" onClick={onGenerateReport}>
                  <FileText className="mr-2 h-4 w-4" />
                  Gerar Boletim
                </Button>
                <Button size="sm" variant="ghost" onClick={onContactSecretary}>
                  Secretaria
                </Button>
              </div>
            </div>
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="hidden sm:block"></CardContent>
    </Card>
  );
};

export default StudentSnapshot;