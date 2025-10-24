import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndicatorCardProps } from "@/types/indicator";
import { cn } from "@/lib/utils";

const IndicatorCard: React.FC<IndicatorCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  color = "text-primary",
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-4 w-4 text-muted-foreground", color)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="text-xs text-muted-foreground pt-1">
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default IndicatorCard;