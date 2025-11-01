import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { School, CheckCircle, Clock, XCircle } from 'lucide-react';

interface TenantStatusOverviewProps {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  suspendedTenants: number;
}

const TenantStatusOverview: React.FC<TenantStatusOverviewProps> = ({
  totalTenants,
  activeTenants,
  trialTenants,
  suspendedTenants,
}) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center gap-2">
          <School className="h-5 w-5 text-primary" />
          Status das Escolas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Total:</span>
          <Badge variant="outline" className="text-base">{totalTenants}</Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-2 text-green-600"><CheckCircle className="h-4 w-4" /> Ativas:</span>
          <Badge className="bg-green-500 hover:bg-green-600 text-white text-base">{activeTenants}</Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-2 text-yellow-600"><Clock className="h-4 w-4" /> Em Teste:</span>
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white text-base">{trialTenants}</Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center gap-2 text-red-600"><XCircle className="h-4 w-4" /> Suspensas:</span>
          <Badge className="bg-red-600 hover:bg-red-700 text-white text-base">{suspendedTenants}</Badge>
        </div>
      </CardContent>
    </Card>
  );
};

export default TenantStatusOverview;