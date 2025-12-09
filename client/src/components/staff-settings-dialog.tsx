import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Settings, FileText, Plus, Trash2, Pencil } from "lucide-react";
import type { StaffGroup, MessageTemplate } from "@shared/schema";

const staffGroupFormSchema = z.object({
  name: z.string().min(1, "Введите название штаба"),
  description: z.string().optional(),
});

type StaffGroupFormData = z.infer<typeof staffGroupFormSchema>;

const templateFormSchema = z.object({
  name: z.string().min(1, "Введите название шаблона"),
  content: z.string().min(1, "Введите текст шаблона"),
});

type TemplateFormData = z.infer<typeof templateFormSchema>;

interface StaffSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffGroup: StaffGroup;
}

export function StaffSettingsDialog({
  open,
  onOpenChange,
  staffGroup,
}: StaffSettingsDialogProps) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("general");
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);

  const form = useForm<StaffGroupFormData>({
    resolver: zodResolver(staffGroupFormSchema),
    defaultValues: {
      name: staffGroup.name,
      description: staffGroup.description || "",
    },
  });

  const templateForm = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      name: "",
      content: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: staffGroup.name,
        description: staffGroup.description || "",
      });
    }
  }, [open, staffGroup, form]);

  const { data: templates = [] } = useQuery<MessageTemplate[]>({
    queryKey: ["/api/message-templates", staffGroup.id],
    enabled: open,
  });

  const updateMutation = useMutation({
    mutationFn: async (data: StaffGroupFormData) => {
      return await apiRequest("PATCH", `/api/staff-groups/${staffGroup.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff-groups"] });
      toast({
        title: "Штаб обновлён",
        description: "Настройки штаба успешно сохранены",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить штаб",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/staff-groups/${staffGroup.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff-groups"] });
      onOpenChange(false);
      navigate("/");
      toast({
        title: "Штаб удалён",
        description: "Штаб и все его участники удалены",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить штаб",
        variant: "destructive",
      });
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData) => {
      return await apiRequest("POST", "/api/message-templates", {
        ...data,
        staffGroupId: staffGroup.id,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/message-templates", staffGroup.id] });
      setIsAddingTemplate(false);
      templateForm.reset();
      toast({ title: "Шаблон создан" });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать шаблон",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async (data: TemplateFormData & { id: string }) => {
      return await apiRequest("PATCH", `/api/message-templates/${data.id}`, {
        name: data.name,
        content: data.content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/message-templates", staffGroup.id] });
      setEditingTemplate(null);
      templateForm.reset();
      toast({ title: "Шаблон обновлён" });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось обновить шаблон",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/message-templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/message-templates", staffGroup.id] });
      toast({ title: "Шаблон удалён" });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить шаблон",
        variant: "destructive",
      });
    },
  });

  const onSubmitGroup = (data: StaffGroupFormData) => {
    updateMutation.mutate(data);
  };

  const onSubmitTemplate = (data: TemplateFormData) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ ...data, id: editingTemplate.id });
    } else {
      createTemplateMutation.mutate(data);
    }
  };

  const startEditingTemplate = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setIsAddingTemplate(false);
    templateForm.reset({
      name: template.name,
      content: template.content,
    });
  };

  const startAddingTemplate = () => {
    setEditingTemplate(null);
    setIsAddingTemplate(true);
    templateForm.reset({
      name: "",
      content: "",
    });
  };

  const cancelTemplateEdit = () => {
    setEditingTemplate(null);
    setIsAddingTemplate(false);
    templateForm.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Настройки штаба
          </DialogTitle>
          <DialogDescription>{staffGroup.name}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">Основные</TabsTrigger>
            <TabsTrigger value="templates">Шаблоны</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4 space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitGroup)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название штаба *</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-group-name-edit" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-group-description-edit" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  data-testid="button-save-group"
                >
                  {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
                </Button>
              </form>
            </Form>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-destructive mb-2">Опасная зона</h4>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" data-testid="button-delete-group">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Удалить штаб
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Удалить штаб?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Это действие нельзя отменить. Будут удалены все участники и
                      история уведомлений этого штаба.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Отмена</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => deleteMutation.mutate()}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Удалить
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Шаблоны сообщений</h4>
              <Button
                size="sm"
                variant="outline"
                onClick={startAddingTemplate}
                disabled={isAddingTemplate}
                data-testid="button-add-template"
              >
                <Plus className="w-4 h-4 mr-1" />
                Добавить
              </Button>
            </div>

            {(isAddingTemplate || editingTemplate) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {editingTemplate ? "Редактировать шаблон" : "Новый шаблон"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...templateForm}>
                    <form
                      onSubmit={templateForm.handleSubmit(onSubmitTemplate)}
                      className="space-y-3"
                    >
                      <FormField
                        control={templateForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Название</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Приглашение на заседание"
                                {...field}
                                data-testid="input-template-name"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={templateForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Текст сообщения</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Текст SMS шаблона..."
                                className="min-h-20"
                                {...field}
                                data-testid="input-template-content"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex gap-2">
                        <Button
                          type="submit"
                          size="sm"
                          disabled={
                            createTemplateMutation.isPending ||
                            updateTemplateMutation.isPending
                          }
                          data-testid="button-save-template"
                        >
                          Сохранить
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={cancelTemplateEdit}
                        >
                          Отмена
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            <div className="space-y-2">
              {templates.length === 0 && !isAddingTemplate ? (
                <div className="text-sm text-muted-foreground py-4 text-center">
                  Нет шаблонов
                </div>
              ) : (
                templates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-start gap-3 p-3 rounded-lg border"
                  >
                    <FileText className="w-4 h-4 mt-0.5 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{template.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {template.content}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => startEditingTemplate(template)}
                        data-testid={`button-edit-template-${template.id}`}
                      >
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => deleteTemplateMutation.mutate(template.id)}
                        data-testid={`button-delete-template-${template.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Закрыть
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
