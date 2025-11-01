import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TopSchool {
  tenant_id: string;
  tenant_name: string;
  student_count: number;
}

interface TopSchoolsByUsageProps {
  topSchools: TopSchool[];
}

const TopSchoolsByUsage: React.FC<TopSchoolsByUsageProps> = ({ topSchools }) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Top 5 Escolas por Alunos
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topSchools.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">Nenhuma escola com alunos ativos ainda.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Rank</TableHead>
                <TableHead>Escola</TableHead>
                <TableHead className="text-right">Alunos</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topSchools.map((school, index) => (
                <TableRow key={school.tenant_id}>
                  <TableCell className="font-medium">{index + 1}</TableCell>
                  <TableCell>{school.tenant_name}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant="secondary" className="flex items-center justify-end gap-1">
                      <Users className="h-3 w-3" /> {school.student_count}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default TopSchoolsByUsage;