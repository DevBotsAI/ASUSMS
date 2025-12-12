import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/status-badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileText,
  Search,
  Calendar as CalendarIcon,
  Filter,
  Download,
  RefreshCw,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { EventLogWithDetails, StaffGroup } from "@shared/schema";

const actionLabels: Record<string, string> = {
  sms_sent: "Отправка SMS",
  sms_send_failed: "Ошибка отправки",
  sms_scheduled: "Планирование SMS",
  sms_delivered: "Доставлено",
  sms_error: "Ошибка доставки",
  sms_status_updated: "Статус обновлён",
  participant_added: "Добавление участника",
  participant_created: "Добавление участника",
  participant_deleted: "Удаление участника",
  participant_updated: "Изменение участника",
  participants_imported: "Импорт участников",
  staff_group_created: "Создание штаба",
  staff_group_updated: "Изменение штаба",
  staff_group_deleted: "Удаление штаба",
  group_created: "Создание штаба",
  group_deleted: "Удаление штаба",
  import_completed: "Импорт завершён",
};

export default function EventLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);

  const { data: logs = [], isLoading, refetch } = useQuery<EventLogWithDetails[]>({
    queryKey: ["/api/event-logs"],
    refetchInterval: 10000,
  });

  const { data: staffGroups = [] } = useQuery<StaffGroup[]>({
    queryKey: ["/api/staff-groups"],
  });

  const filteredLogs = logs.filter((log) => {
    if (selectedAction !== "all" && log.action !== selectedAction) return false;
    if (selectedGroup !== "all" && log.staffGroupId !== selectedGroup) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const matchesParticipant = log.participant?.fullName
        ?.toLowerCase()
        .includes(query);
      const matchesDetails = log.details?.toLowerCase().includes(query);
      const matchesAction = actionLabels[log.action]?.toLowerCase().includes(query);
      if (!matchesParticipant && !matchesDetails && !matchesAction) return false;
    }
    if (dateFrom && log.createdAt) {
      if (new Date(log.createdAt) < dateFrom) return false;
    }
    if (dateTo && log.createdAt) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      if (new Date(log.createdAt) > endOfDay) return false;
    }
    return true;
  });

  const uniqueActions = Array.from(new Set(logs.map((log) => log.action)));

  const handleExport = () => {
    const csvContent = [
      ["Дата", "Действие", "Участник", "Штаб", "Детали", "Результат", "Ошибка"].join(","),
      ...filteredLogs.map((log) =>
        [
          log.createdAt ? format(new Date(log.createdAt), "dd.MM.yyyy HH:mm") : "",
          actionLabels[log.action] || log.action,
          log.participant?.fullName || "",
          log.staffGroup?.name || "",
          (log.details || "").replace(/,/g, ";"),
          log.result || "",
          (log.errorMessage || "").replace(/,/g, ";"),
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `event-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedAction("all");
    setSelectedGroup("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <FileText className="w-6 h-6" />
            Журнал событий
          </h1>
          <p className="text-muted-foreground">
            История всех операций в системе
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            data-testid="button-refresh-logs"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={filteredLogs.length === 0}
            data-testid="button-export-logs"
          >
            <Download className="w-4 h-4 mr-2" />
            Экспорт CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-48">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-logs"
                />
              </div>
            </div>

            <Select value={selectedAction} onValueChange={setSelectedAction}>
              <SelectTrigger className="w-44" data-testid="select-action-filter">
                <SelectValue placeholder="Действие" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все действия</SelectItem>
                {uniqueActions.map((action) => (
                  <SelectItem key={action} value={action}>
                    {actionLabels[action] || action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-44" data-testid="select-group-filter">
                <SelectValue placeholder="Штаб" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все штабы</SelectItem>
                {staffGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-36" data-testid="button-date-from">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {dateFrom ? format(dateFrom, "dd.MM.yy") : "С даты"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-36" data-testid="button-date-to">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {dateTo ? format(dateTo, "dd.MM.yy") : "По дату"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button variant="ghost" onClick={clearFilters}>
              Сбросить
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Загрузка...</div>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-1">Нет событий</h3>
              <p className="text-sm text-muted-foreground">
                {logs.length === 0
                  ? "Журнал пуст"
                  : "Не найдено событий по заданным фильтрам"}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-40">Дата и время</TableHead>
                    <TableHead className="w-40">Действие</TableHead>
                    <TableHead>Участник</TableHead>
                    <TableHead>Штаб</TableHead>
                    <TableHead>Детали</TableHead>
                    <TableHead className="w-32">Результат</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                      <TableCell className="font-mono text-sm">
                        {log.createdAt &&
                          format(new Date(log.createdAt), "dd.MM.yy HH:mm", {
                            locale: ru,
                          })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {actionLabels[log.action] || log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.participant?.fullName || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.staffGroup?.name || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="truncate">
                            {log.details || log.errorMessage || (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </span>
                          {(log.apiRequest || log.apiResponse) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="shrink-0 cursor-help p-1" data-testid={`button-api-details-${log.id}`}>
                                  <Info className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-md">
                                <div className="text-xs space-y-2">
                                  {log.apiRequest && (
                                    <div>
                                      <div className="font-semibold">Запрос:</div>
                                      <pre className="whitespace-pre-wrap break-all bg-muted/50 p-1 rounded text-xs">
                                        {log.apiRequest}
                                      </pre>
                                    </div>
                                  )}
                                  {log.apiResponse && (
                                    <div>
                                      <div className="font-semibold">Ответ:</div>
                                      <pre className="whitespace-pre-wrap break-all bg-muted/50 p-1 rounded text-xs">
                                        {log.apiResponse}
                                      </pre>
                                    </div>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.result ? (
                          <StatusBadge status={log.result} />
                        ) : log.errorMessage ? (
                          <StatusBadge status="error" />
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
