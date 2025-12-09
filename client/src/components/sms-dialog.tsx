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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Send, Calendar as CalendarIcon, Clock, User, FileText } from "lucide-react";
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

  const { data: templates = [] } = useQuery<MessageTemplate[]>({
    queryKey: ["/api/message-templates", staffGroupId],
    enabled: !!staffGroupId,
  });

  useEffect(() => {
    if (open) {
      setMessage("");
      setIsScheduled(initialScheduled);
      setScheduledDate(undefined);
      setScheduledTime("12:00");
      setSelectedTemplate("");
    }
  }, [open, initialScheduled]);

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

    const participantIds =
      mode === "single" && participant
        ? [participant.id]
        : participants.map((p) => p.id);

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

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setMessage(template.content);
    }
  };

  const recipientCount = mode === "single" ? 1 : participants.length;
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

          {mode === "mass" && participants.length > 0 && (
            <div className="p-3 rounded-lg bg-muted/50 max-h-32 overflow-y-auto">
              <div className="text-sm font-medium mb-2">
                Получатели ({participants.length}):
              </div>
              <div className="flex flex-wrap gap-1">
                {participants.slice(0, 10).map((p) => (
                  <span
                    key={p.id}
                    className="text-xs bg-background px-2 py-1 rounded"
                  >
                    {p.fullName}
                  </span>
                ))}
                {participants.length > 10 && (
                  <span className="text-xs text-muted-foreground">
                    и ещё {participants.length - 10}...
                  </span>
                )}
              </div>
            </div>
          )}

          {templates.length > 0 && (
            <div className="space-y-2">
              <Label>Шаблон сообщения</Label>
              <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                <SelectTrigger data-testid="select-template">
                  <SelectValue placeholder="Выберите шаблон" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {template.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              (isScheduled && !scheduledDate)
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
