import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { UserPlus, Pencil } from "lucide-react";
import type { Participant } from "@shared/schema";

const participantFormSchema = z.object({
  fullName: z.string().min(2, "ФИО должно содержать минимум 2 символа"),
  phone: z.string().min(10, "Введите корректный номер телефона"),
  position: z.string().optional(),
});

type ParticipantFormData = z.infer<typeof participantFormSchema>;

interface ParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffGroupId: string;
  participant?: Participant | null;
  mode: "create" | "edit";
}

export function ParticipantDialog({
  open,
  onOpenChange,
  staffGroupId,
  participant,
  mode,
}: ParticipantDialogProps) {
  const { toast } = useToast();

  const form = useForm<ParticipantFormData>({
    resolver: zodResolver(participantFormSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      position: "",
    },
  });

  useEffect(() => {
    if (open) {
      if (mode === "edit" && participant) {
        form.reset({
          fullName: participant.fullName,
          phone: participant.phone,
          position: participant.position || "",
        });
      } else {
        form.reset({
          fullName: "",
          phone: "",
          position: "",
        });
      }
    }
  }, [open, mode, participant, form]);

  const createMutation = useMutation({
    mutationFn: async (data: ParticipantFormData) => {
      return await apiRequest("POST", "/api/participants", {
        ...data,
        staffGroupId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/staff-groups", staffGroupId, "participants"],
      });
      queryClient.invalidateQueries({ queryKey: ["/api/staff-groups"] });
      onOpenChange(false);
      toast({
        title: "Участник добавлен",
        description: "Новый участник успешно добавлен в штаб",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось добавить участника",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ParticipantFormData) => {
      return await apiRequest("PATCH", `/api/participants/${participant?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/staff-groups", staffGroupId, "participants"],
      });
      onOpenChange(false);
      toast({
        title: "Участник обновлён",
        description: "Данные участника успешно обновлены",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить данные участника",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ParticipantFormData) => {
    if (mode === "create") {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "create" ? (
              <>
                <UserPlus className="w-5 h-5" />
                Добавить участника
              </>
            ) : (
              <>
                <Pencil className="w-5 h-5" />
                Редактировать участника
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Заполните данные нового участника штаба"
              : "Измените данные участника"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ФИО *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Иванов Иван Иванович"
                      {...field}
                      data-testid="input-participant-name"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Номер телефона *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+7 (999) 123-45-67"
                      {...field}
                      data-testid="input-participant-phone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="position"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Должность</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Начальник отдела"
                      {...field}
                      data-testid="input-participant-position"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={isPending} data-testid="button-save-participant">
                {isPending
                  ? "Сохранение..."
                  : mode === "create"
                  ? "Добавить"
                  : "Сохранить"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
