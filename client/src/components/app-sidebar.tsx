import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  MessageSquare,
  Users,
  Plus,
  FileText,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { StaffGroupWithParticipants } from "@shared/schema";

export function AppSidebar() {
  const [location] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.href = "/";
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось выйти из системы",
        variant: "destructive",
      });
    },
  });

  const { data: staffGroups = [], isLoading } = useQuery<StaffGroupWithParticipants[]>({
    queryKey: ["/api/staff-groups"],
  });

  const createGroupMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      return await apiRequest("POST", "/api/staff-groups", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff-groups"] });
      setIsCreateOpen(false);
      setNewGroupName("");
      setNewGroupDescription("");
      toast({
        title: "Штаб создан",
        description: "Новый штаб успешно добавлен",
      });
    },
    onError: () => {
      toast({
        title: "Ошибка",
        description: "Не удалось создать штаб",
        variant: "destructive",
      });
    },
  });

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    createGroupMutation.mutate({
      name: newGroupName.trim(),
      description: newGroupDescription.trim() || undefined,
    });
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">АСУ-Оповещение</span>
            <span className="text-xs text-muted-foreground">Минэнерго</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/"}>
                  <Link href="/" data-testid="link-dashboard">
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Панель управления</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location === "/logs"}>
                  <Link href="/logs" data-testid="link-logs">
                    <FileText className="w-4 h-4" />
                    <span>Журнал событий</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between gap-2 pr-2">
            <span>Штабы</span>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-6 w-6" data-testid="button-add-group">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Создать штаб</DialogTitle>
                  <DialogDescription>
                    Добавьте новый штаб для группировки участников
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Название штаба *</Label>
                    <Input
                      id="groupName"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="Например: Оперативный штаб"
                      data-testid="input-group-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="groupDescription">Описание</Label>
                    <Textarea
                      id="groupDescription"
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                      placeholder="Краткое описание штаба"
                      data-testid="input-group-description"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Отмена
                  </Button>
                  <Button
                    onClick={handleCreateGroup}
                    disabled={!newGroupName.trim() || createGroupMutation.isPending}
                    data-testid="button-create-group"
                  >
                    {createGroupMutation.isPending ? "Создание..." : "Создать"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Загрузка...
                </div>
              ) : staffGroups.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  Нет штабов
                </div>
              ) : (
                staffGroups.map((group) => (
                  <SidebarMenuItem key={group.id}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === `/staff/${group.id}`}
                    >
                      <Link
                        href={`/staff/${group.id}`}
                        data-testid={`link-staff-${group.id}`}
                      >
                        <Users className="w-4 h-4" />
                        <span className="flex-1 truncate">{group.name}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {group.participantCount ?? group.participants?.length ?? 0}
                        </Badge>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium truncate">
              {(user as any)?.username || (user as any)?.firstName || "Пользователь"}
            </span>
            <span className="text-xs text-muted-foreground">Минэнерго</span>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
