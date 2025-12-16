import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, CheckCircle, AlertCircle, Clock, Wallet, RefreshCw } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

interface SystemStatusProps {
  currentAction?: string;
  isProcessing?: boolean;
}

export function SystemStatus({ currentAction, isProcessing = false }: SystemStatusProps) {
  const { data: balanceData, isLoading, isError, refetch } = useQuery<{ balance: number }>({
    queryKey: ["/api/balance"],
    queryFn: async () => {
      const res = await fetch("/api/balance", { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to fetch balance");
      }
      return res.json();
    },
    refetchInterval: 60000,
    retry: 1,
  });

  const handleRefreshBalance = () => {
    refetch();
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Статус системы
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
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
        
        <div className="flex items-center justify-between gap-2 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Баланс:</span>
            {isLoading ? (
              <span className="text-sm font-medium">Загрузка...</span>
            ) : isError ? (
              <span className="text-sm font-medium text-destructive">Ошибка</span>
            ) : (
              <span className="text-sm font-semibold" data-testid="text-balance">
                {balanceData?.balance?.toFixed(2) ?? "—"} руб.
              </span>
            )}
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleRefreshBalance}
            disabled={isLoading}
            data-testid="button-refresh-balance"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: "total" | "delivered" | "error" | "scheduled";
  onReset?: () => void;
  resetLabel?: string;
  isResetting?: boolean;
}

const iconMap = {
  total: { Icon: Activity, color: "text-blue-500" },
  delivered: { Icon: CheckCircle, color: "text-green-500" },
  error: { Icon: AlertCircle, color: "text-red-500" },
  scheduled: { Icon: Clock, color: "text-gray-500" },
};

export function StatsCard({ title, value, icon, onReset, resetLabel = "Сбросить", isResetting }: StatsCardProps) {
  const { Icon, color } = iconMap[icon];
  
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {onReset && value > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                disabled={isResetting}
                className="mt-1 h-6 px-2 text-xs text-muted-foreground"
                data-testid={`button-reset-${icon}`}
              >
                {isResetting ? "..." : resetLabel}
              </Button>
            )}
          </div>
          <Icon className={`w-8 h-8 ${color} opacity-80 flex-shrink-0`} />
        </div>
      </CardContent>
    </Card>
  );
}

export function refreshBalanceAfterSms() {
  queryClient.invalidateQueries({ queryKey: ["/api/balance"] });
}
