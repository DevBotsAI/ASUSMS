import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface SystemStatusProps {
  currentAction?: string;
  isProcessing?: boolean;
}

export function SystemStatus({ currentAction, isProcessing = false }: SystemStatusProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Статус системы
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {isProcessing ? (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-sm text-muted-foreground">
                {currentAction || "Обработка..."}
              </span>
            </>
          ) : (
            <>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
              <span className="text-sm text-muted-foreground">
                Система готова к работе
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: "total" | "delivered" | "error" | "scheduled";
}

const iconMap = {
  total: { Icon: Activity, color: "text-blue-500" },
  delivered: { Icon: CheckCircle, color: "text-green-500" },
  error: { Icon: AlertCircle, color: "text-red-500" },
  scheduled: { Icon: Clock, color: "text-gray-500" },
};

export function StatsCard({ title, value, icon }: StatsCardProps) {
  const { Icon, color } = iconMap[icon];
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <Icon className={`w-8 h-8 ${color} opacity-80`} />
        </div>
      </CardContent>
    </Card>
  );
}
