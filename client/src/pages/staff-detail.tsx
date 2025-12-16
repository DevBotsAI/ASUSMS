import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { ParticipantTable } from "@/components/participant-table";
import { ParticipantDialog } from "@/components/participant-dialog";
import { SmsDialog } from "@/components/sms-dialog";
import { ExcelImportDialog } from "@/components/excel-import-dialog";
import { StaffSettingsDialog } from "@/components/staff-settings-dialog";
import { SystemStatus, StatsCard } from "@/components/system-status";
import { RecentActivity } from "@/components/recent-activity";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  UserPlus,
  Send,
  Calendar,
  FileSpreadsheet,
  Settings,
  Users,
} from "lucide-react";
import type { StaffGroup, Participant, Notification } from "@shared/schema";

interface ParticipantWithNotification extends Participant {
  lastNotification?: Notification | null;
}

interface StaffStats {
  total: number;
  delivered: number;
  error: number;
  scheduled: number;
}

export default function StaffDetail() {
  const params = useParams<{ id: string }>();
  const staffGroupId = params.id!;
  const { toast } = useToast();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [participantDialogOpen, setParticipantDialogOpen] = useState(false);
  const [participantDialogMode, setParticipantDialogMode] = useState<"create" | "edit">("create");
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null);
  const [smsDialogOpen, setSmsDialogOpen] = useState(false);
  const [smsDialogMode, setSmsDialogMode] = useState<"single" | "mass">("single");
  const [smsParticipant, setSmsParticipant] = useState<Participant | null>(null);
  const [smsScheduled, setSmsScheduled] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);

  const { data: staffGroup, isLoading: isLoadingGroup } = useQuery<StaffGroup>({
    queryKey: ["/api/staff-groups", staffGroupId],
  });

  const { data: participants = [], isLoading: isLoadingParticipants } = useQuery<
    ParticipantWithNotification[]
  >({
    queryKey: ["/api/staff-groups", staffGroupId, "participants"],
    refetchInterval: 10000,
  });

  const { data: stats, refetch: refetchStats } = useQuery<StaffStats>({
    queryKey: ["/api/staff-groups", staffGroupId, "stats"],
    refetchInterval: 10000,
  });

  const resetMutation = useMutation({
    mutationFn: async (status: string) => {
      return apiRequest("DELETE", `/api/notifications/reset/${status}?staffGroupId=${staffGroupId}`);
    },
    onSuccess: () => {
      refetchStats();
      queryClient.invalidateQueries({ queryKey: ["/api/event-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff-groups", staffGroupId, "participants"] });
      toast({
        title: "Счётчик сброшен",
        description: "Статистика штаба обновлена",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось сбросить счётчик",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    setSelectedIds(new Set());
  }, [staffGroupId]);

  const handleAddParticipant = () => {
    setParticipantDialogMode("create");
    setEditingParticipant(null);
    setParticipantDialogOpen(true);
  };

  const handleEditParticipant = (participant: Participant) => {
    setParticipantDialogMode("edit");
    setEditingParticipant(participant);
    setParticipantDialogOpen(true);
  };

  const handleSendSms = (participant: Participant) => {
    setSmsDialogMode("single");
    setSmsParticipant(participant);
    setSmsScheduled(false);
    setSmsDialogOpen(true);
  };

  const handleScheduleSms = (participant: Participant) => {
    setSmsDialogMode("single");
    setSmsParticipant(participant);
    setSmsScheduled(true);
    setSmsDialogOpen(true);
  };

  const handleMassSend = () => {
    setSmsDialogMode("mass");
    setSmsParticipant(null);
    setSmsScheduled(false);
    setSmsDialogOpen(true);
  };

  const handleMassSchedule = () => {
    setSmsDialogMode("mass");
    setSmsParticipant(null);
    setSmsScheduled(true);
    setSmsDialogOpen(true);
  };

  const selectedParticipants = participants.filter((p) => selectedIds.has(p.id));

  if (isLoadingGroup) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (!staffGroup) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <Users className="w-12 h-12 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-medium mb-1">Штаб не найден</h3>
        <p className="text-sm text-muted-foreground">
          Выберите штаб из списка слева
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="border-b p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-semibold">{staffGroup.name}</h1>
              {staffGroup.description && (
                <p className="text-sm text-muted-foreground">
                  {staffGroup.description}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={handleAddParticipant}
                data-testid="button-add-participant"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Добавить
              </Button>
              <Button
                variant="outline"
                onClick={() => setImportDialogOpen(true)}
                data-testid="button-import-excel"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Импорт
              </Button>
              <Button
                onClick={handleMassSend}
                disabled={selectedIds.size === 0 && participants.length === 0}
                data-testid="button-mass-send"
              >
                <Send className="w-4 h-4 mr-2" />
                Рассылка {selectedIds.size > 0 && `(${selectedIds.size})`}
              </Button>
              <Button
                variant="outline"
                onClick={handleMassSchedule}
                disabled={selectedIds.size === 0 && participants.length === 0}
                data-testid="button-mass-schedule"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Планировать
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSettingsDialogOpen(true)}
                data-testid="button-staff-settings"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatsCard
              title="Всего участников"
              value={stats?.total ?? participants.length}
              icon="total"
            />
            <StatsCard
              title="Доставлено сегодня"
              value={stats?.delivered ?? 0}
              icon="delivered"
              onReset={() => resetMutation.mutate("delivered")}
              isResetting={resetMutation.isPending}
            />
            <StatsCard
              title="Запланировано"
              value={stats?.scheduled ?? 0}
              icon="scheduled"
            />
            <StatsCard
              title="Ошибки"
              value={stats?.error ?? 0}
              icon="error"
              onReset={() => resetMutation.mutate("error")}
              isResetting={resetMutation.isPending}
            />
          </div>

          <ParticipantTable
            participants={participants}
            isLoading={isLoadingParticipants}
            staffGroupId={staffGroupId}
            onSendSms={handleSendSms}
            onScheduleSms={handleScheduleSms}
            onEdit={handleEditParticipant}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </div>
      </div>

      <div className="hidden xl:block w-80 border-l p-4 space-y-4 overflow-auto">
        <SystemStatus />
        <RecentActivity staffGroupId={staffGroupId} limit={10} />
      </div>

      <ParticipantDialog
        open={participantDialogOpen}
        onOpenChange={setParticipantDialogOpen}
        staffGroupId={staffGroupId}
        participant={editingParticipant}
        mode={participantDialogMode}
      />

      <SmsDialog
        open={smsDialogOpen}
        onOpenChange={setSmsDialogOpen}
        participant={smsParticipant}
        participants={
          smsDialogMode === "mass"
            ? selectedIds.size > 0
              ? selectedParticipants
              : participants
            : []
        }
        staffGroupId={staffGroupId}
        mode={smsDialogMode}
        initialScheduled={smsScheduled}
      />

      <ExcelImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        staffGroupId={staffGroupId}
      />

      {staffGroup && (
        <StaffSettingsDialog
          open={settingsDialogOpen}
          onOpenChange={setSettingsDialogOpen}
          staffGroup={staffGroup}
        />
      )}
    </div>
  );
}
