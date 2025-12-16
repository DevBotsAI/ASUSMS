import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StatusDot } from "@/components/status-badge";
import { Activity, Send, UserPlus, Users, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { EventLogWithDetails } from "@shared/schema";

interface RecentActivityProps {
  staffGroupId?: string;
  limit?: number;
}

const actionIcons: Record<string, typeof Send> = {
  sms_sent: Send,
  sms_scheduled: Send,
  sms_delivered: Send,
  sms_error: AlertCircle,
  participant_added: UserPlus,
  participant_created: UserPlus,
  participant_deleted: Users,
  participant_updated: UserPlus,
  participants_imported: Users,
  group_created: Users,
  staff_group_created: Users,
  error: AlertCircle,
};

const actionLabels: Record<string, string> = {
  sms_sent: "SMS отправлено",
  sms_scheduled: "SMS запланировано",
  sms_delivered: "SMS доставлено",
  sms_error: "Ошибка отправки",
  participant_added: "Участник добавлен",
  participant_created: "Участник добавлен",
  participant_deleted: "Участник удалён",
  participant_updated: "Участник обновлён",
  participants_imported: "Импорт участников",
  group_created: "Штаб создан",
  staff_group_created: "Штаб создан",
  group_deleted: "Штаб удалён",
  import_completed: "Импорт завершён",
};

export function RecentActivity({ staffGroupId, limit = 10 }: RecentActivityProps) {
  const url = staffGroupId
    ? `/api/event-logs?staffGroupId=${staffGroupId}&limit=${limit}`
    : `/api/event-logs?limit=${limit}`;

  const { data: logs = [], isLoading } = useQuery<EventLogWithDetails[]>({
    queryKey: ["/api/event-logs", { staffGroupId, limit }],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch event logs");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const displayLogs = logs.slice(0, limit);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Последние события
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Загрузка...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Последние события
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {displayLogs.length === 0 ? (
          <div className="px-4 pb-4 text-sm text-muted-foreground">
            Нет событий
          </div>
        ) : (
          <ScrollArea className="h-72">
            <div className="space-y-1 px-4 pb-4">
              {displayLogs.map((log) => {
                const Icon = actionIcons[log.action] || Activity;
                const isError = log.action.includes("error") || !!log.errorMessage;

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 py-2 border-b last:border-0"
                    data-testid={`log-entry-${log.id}`}
                  >
                    <div
                      className={`mt-0.5 p-1.5 rounded ${
                        isError
                          ? "bg-red-100 dark:bg-red-900/30"
                          : "bg-muted"
                      }`}
                    >
                      <Icon
                        className={`w-3 h-3 ${
                          isError ? "text-red-500" : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm">
                        {actionLabels[log.action] || log.action}
                      </div>
                      {log.participant && (
                        <div className="text-xs text-muted-foreground truncate">
                          {log.participant.fullName}
                        </div>
                      )}
                      {log.details && (
                        <div className="text-xs text-muted-foreground truncate">
                          {log.details}
                        </div>
                      )}
                      {log.errorMessage && (
                        <div className="text-xs text-red-500 truncate">
                          {log.errorMessage}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {log.createdAt &&
                        format(new Date(log.createdAt), "HH:mm", {
                          locale: ru,
                        })}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
