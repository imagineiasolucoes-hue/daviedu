import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface ClassSelectorProps {
  selectedClassId: string | undefined;
  onSelectClass: (classId: string) => void;
  classes: { id: string; name: string }[];
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

const ClassSelector: React.FC<ClassSelectorProps> = ({
  selectedClassId,
  onSelectClass,
  classes,
  label = "Selecionar Turma",
  placeholder = "Selecione uma turma",
  disabled = false,
}) => {
  return (
    <div className="grid gap-2">
      <Label htmlFor="class-select">{label}</Label>
      <Select
        value={selectedClassId}
        onValueChange={onSelectClass}
        disabled={disabled}
      >
        <SelectTrigger id="class-select">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {classes.map((cls) => (
            <SelectItem key={cls.id} value={cls.id}>
              {cls.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ClassSelector;