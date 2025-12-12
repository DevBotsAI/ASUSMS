import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  MoreHorizontal,
  Send,
  Calendar,
  Pencil,
  Trash2,
  Phone,
} from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Participant, Notification } from "@shared/schema";

interface ParticipantWithNotification extends Participant {
  lastNotification?: Notification | null;
}

interface ParticipantTableProps {
  participants: ParticipantWithNotification[];
  isLoading?: boolean;
  staffGroupId: string;
  onSendSms: (participant: Participant) => void;
  onScheduleSms: (participant: Participant) => void;
  onEdit: (participant: Participant) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

export function ParticipantTable({
  participants,
  isLoading,
  staffGroupId,
  onSendSms,
  onScheduleSms,
  onEdit,
  selectedIds,
  onSelectionChange,
}: ParticipantTableProps) {
  const { toast } = useToast();

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/participants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff-groups", staffGroupId, "participants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff-groups"] });
      toast({
        title: "Участник удалён",
        description: "Участник успешно удалён из штаба",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить участника",
        variant: "destructive",
      });
    },
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(new Set(participants.map((p) => p.id)));
    } else {
      onSelectionChange(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSelection = new Set(selectedIds);
    if (checked) {
      newSelection.add(id);
    } else {
      newSelection.delete(id);
    }
    onSelectionChange(newSelection);
  };

  const allSelected = participants.length > 0 && selectedIds.size === participants.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < participants.length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Загрузка участников...</div>
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Phone className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-1">Нет участников</h3>
        <p className="text-sm text-muted-foreground">
          Добавьте участников в штаб для отправки уведомлений
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={handleSelectAll}
                aria-label="Выбрать всех"
                data-testid="checkbox-select-all"
                {...(someSelected ? { "data-state": "indeterminate" } : {})}
              />
            </TableHead>
            <TableHead>ФИО</TableHead>
            <TableHead className="w-40">Телефон</TableHead>
            <TableHead className="w-40">Статус отправки</TableHead>
            <TableHead className="w-48">Последнее уведомление</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.map((participant) => (
            <TableRow
              key={participant.id}
              className={selectedIds.has(participant.id) ? "bg-muted/30" : ""}
              data-testid={`row-participant-${participant.id}`}
            >
              <TableCell>
                <Checkbox
                  checked={selectedIds.has(participant.id)}
                  onCheckedChange={(checked) =>
                    handleSelectOne(participant.id, checked as boolean)
                  }
                  aria-label={`Выбрать ${participant.fullName}`}
                  data-testid={`checkbox-participant-${participant.id}`}
                />
              </TableCell>
              <TableCell>
                <div>
                  <div className="font-medium">{participant.fullName}</div>
                  {participant.position && (
                    <div className="text-xs text-muted-foreground">
                      {participant.position}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <span className="font-mono text-sm">{participant.phone}</span>
              </TableCell>
              <TableCell>
                {participant.lastNotification ? (
                  <StatusBadge status={participant.lastNotification.status} />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                    <span className="text-sm text-muted-foreground">Нет отправок</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                {participant.lastNotification?.sentAt ? (
                  <span className="text-sm text-muted-foreground">
                    {format(
                      new Date(participant.lastNotification.sentAt),
                      "dd MMM yyyy, HH:mm",
                      { locale: ru }
                    )}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      data-testid={`button-actions-${participant.id}`}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => onSendSms(participant)}
                      data-testid={`action-send-sms-${participant.id}`}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Отправить SMS
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onScheduleSms(participant)}
                      data-testid={`action-schedule-sms-${participant.id}`}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Запланировать SMS
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onEdit(participant)}
                      data-testid={`action-edit-${participant.id}`}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Редактировать
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deleteMutation.mutate(participant.id)}
                      className="text-destructive focus:text-destructive"
                      data-testid={`action-delete-${participant.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Удалить
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
