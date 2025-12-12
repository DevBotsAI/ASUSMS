import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Send, Calendar as CalendarIcon, Clock, User, FileText, X } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import type { Participant, MessageTemplate } from "@shared/schema";

interface SmsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participant?: Participant | null;
  participants?: Participant[];
  staffGroupId?: string;
  mode: "single" | "mass";
  initialScheduled?: boolean;
}

export function SmsDialog({
  open,
  onOpenChange,
  participant,
  participants = [],
  staffGroupId,
  mode,
  initialScheduled = false,
}: SmsDialogProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [isScheduled, setIsScheduled] = useState(initialScheduled);
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(undefined);
  const [scheduledTime, setScheduledTime] = useState("12:00");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [localParticipants, setLocalParticipants] = useState<Participant[]>(participants);

  const { data: templates = [] } = useQuery<MessageTemplate[]>({
    queryKey: [`/api/message-templates?staffGroupId=${staffGroupId}`],
    enabled: !!staffGroupId && open,
  });

  useEffect(() => {
    if (open) {
      setMessage("");
      setIsScheduled(initialScheduled);
      setScheduledDate(undefined);
      setScheduledTime("12:00");
      setSelectedTemplate("");
      setLocalParticipants(participants);
    }
  }, [open, initialScheduled, participants]);

  const sendMutation = useMutation({
    mutationFn: async (data: {
      participantIds: string[];
      message: string;
      staffGroupId?: string;
      scheduledAt?: string;
    }) => {
      return await apiRequest("POST", "/api/notifications/send", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/event-logs"] });
      if (staffGroupId) {
        queryClient.invalidateQueries({
          queryKey: ["/api/staff-groups", staffGroupId, "participants"],
        });
      }
      onOpenChange(false);
      toast({
        title: isScheduled ? "SMS запланировано" : "SMS отправлено",
        description: isScheduled
          ? "Уведомление будет отправлено в указанное время"
          : "Уведомление успешно отправлено",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить SMS",
        variant: "destructive",
      });
    },
  });

  const handleSend = () => {
    if (!message.trim()) return;
    if (mode === "mass" && localParticipants.length === 0) return;

    const participantIds =
      mode === "single" && participant
        ? [participant.id]
        : localParticipants.map((p) => p.id);

    let scheduledAt: string | undefined;
    if (isScheduled && scheduledDate) {
      const [hours, minutes] = scheduledTime.split(":").map(Number);
      const scheduled = new Date(scheduledDate);
      scheduled.setHours(hours, minutes, 0, 0);
      scheduledAt = scheduled.toISOString();
    }

    sendMutation.mutate({
      participantIds,
      message: message.trim(),
      staffGroupId,
      scheduledAt,
    });
  };

  const handleTemplateClick = (template: MessageTemplate) => {
    setMessage(template.content);
    setSelectedTemplate(template.id);
  };

  const handleRemoveParticipant = (participantId: string) => {
    setLocalParticipants((prev) => prev.filter((p) => p.id !== participantId));
  };

  const recipientCount = mode === "single" ? 1 : localParticipants.length;
  const charCount = message.length;
  const smsCount = Math.ceil(charCount / 70) || 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "single" ? "Отправить SMS" : "Массовая рассылка"}
          </DialogTitle>
          <DialogDescription>
            {mode === "single"
              ? `Отправка уведомления участнику`
              : `Отправка уведомления ${recipientCount} участникам`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {mode === "single" && participant && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-medium">{participant.fullName}</div>
                <div className="text-sm text-muted-foreground font-mono">
                  {participant.phone}
                </div>
              </div>
            </div>
          )}

          {mode === "mass" && localParticipants.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 max-h-40 overflow-y-auto">
              <div className="text-sm font-medium mb-2">
                Получатели ({localParticipants.length}):
              </div>
              <div className="flex flex-wrap gap-1">
                {localParticipants.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1 text-xs bg-background px-2 py-1 rounded group"
                    data-testid={`recipient-${p.id}`}
                  >
                    {p.fullName}
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(p.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      data-testid={`button-remove-recipient-${p.id}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {templates.length > 0 && (
            <div className="space-y-2">
              <Label>Шаблоны сообщений</Label>
              <div className="flex flex-wrap gap-2">
                {templates.map((template) => (
                  <Button
                    key={template.id}
                    type="button"
                    variant={selectedTemplate === template.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleTemplateClick(template)}
                    className="gap-1.5"
                    data-testid={`button-template-${template.id}`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {template.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message">Текст сообщения *</Label>
              <span className="text-xs text-muted-foreground">
                {charCount} симв. / ~{smsCount} SMS
              </span>
            </div>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Введите текст SMS-сообщения..."
              className="min-h-32 resize-none"
              data-testid="input-sms-message"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Запланировать отправку</span>
            </div>
            <Switch
              checked={isScheduled}
              onCheckedChange={setIsScheduled}
              data-testid="switch-schedule"
            />
          </div>

          {isScheduled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Дата</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      data-testid="button-select-date"
                    >
                      <CalendarIcon className="w-4 h-4 mr-2" />
                      {scheduledDate
                        ? format(scheduledDate, "dd MMMM yyyy", { locale: ru })
                        : "Выберите дату"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={scheduledDate}
                      onSelect={setScheduledDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Время</Label>
                <Input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  data-testid="input-schedule-time"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button
            onClick={handleSend}
            disabled={
              !message.trim() ||
              sendMutation.isPending ||
              (isScheduled && !scheduledDate) ||
              (mode === "mass" && localParticipants.length === 0)
            }
            data-testid="button-send-sms"
          >
            {sendMutation.isPending ? (
              "Отправка..."
            ) : isScheduled ? (
              <>
                <CalendarIcon className="w-4 h-4 mr-2" />
                Запланировать
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Отправить
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
