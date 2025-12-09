import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCard, SystemStatus } from "@/components/system-status";
import { RecentActivity } from "@/components/recent-activity";
import { Link } from "wouter";
import { Users, MessageSquare, CheckCircle, AlertCircle, Clock, ArrowRight } from "lucide-react";
import type { StaffGroupWithParticipants } from "@shared/schema";

interface DashboardStats {
  totalParticipants: number;
  totalGroups: number;
  deliveredToday: number;
  scheduledCount: number;
  errorCount: number;
}

export default function Dashboard() {
  const { data: staffGroups = [] } = useQuery<StaffGroupWithParticipants[]>({
    queryKey: ["/api/staff-groups"],
  });

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/stats"],
  });

  const totalParticipants = staffGroups.reduce(
    (sum, group) => sum + (group.participantCount ?? group.participants?.length ?? 0),
    0
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Панель управления</h1>
        <p className="text-muted-foreground">
          Обзор системы уведомлений
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Всего участников"
          value={stats?.totalParticipants ?? totalParticipants}
          icon="total"
        />
        <StatsCard
          title="Доставлено сегодня"
          value={stats?.deliveredToday ?? 0}
          icon="delivered"
        />
        <StatsCard
          title="Запланировано"
          value={stats?.scheduledCount ?? 0}
          icon="scheduled"
        />
        <StatsCard
          title="Ошибки"
          value={stats?.errorCount ?? 0}
          icon="error"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <div>
                <CardTitle className="text-lg">Штабы</CardTitle>
                <CardDescription>
                  Всего {staffGroups.length} штабов
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/logs">
                  Журнал событий
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {staffGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Users className="w-12 h-12 text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-medium mb-1">Нет штабов</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Создайте первый штаб для начала работы
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {staffGroups.slice(0, 5).map((group) => (
                    <Link
                      key={group.id}
                      href={`/staff/${group.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover-elevate active-elevate-2 cursor-pointer"
                      data-testid={`card-staff-${group.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{group.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {group.participantCount ?? group.participants?.length ?? 0} участников
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ))}
                  {staffGroups.length > 5 && (
                    <div className="text-center text-sm text-muted-foreground pt-2">
                      И ещё {staffGroups.length - 5} штабов
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Статусы доставки
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="text-sm font-medium">Доставлено</div>
                    <div className="text-xs text-muted-foreground">SMS успешно доставлены</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                  <MessageSquare className="w-5 h-5 text-orange-500" />
                  <div>
                    <div className="text-sm font-medium">В процессе</div>
                    <div className="text-xs text-muted-foreground">Отправляются сейчас</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <div>
                    <div className="text-sm font-medium">Ошибка</div>
                    <div className="text-xs text-muted-foreground">Не удалось отправить</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <Clock className="w-5 h-5 text-gray-500" />
                  <div>
                    <div className="text-sm font-medium">Запланировано</div>
                    <div className="text-xs text-muted-foreground">Ожидают отправки</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <SystemStatus />
          <RecentActivity limit={8} />
        </div>
      </div>
    </div>
  );
}
