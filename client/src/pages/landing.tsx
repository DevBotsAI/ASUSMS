import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, Clock, Shield, LogIn, Loader2 } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";

export default function Landing() {
  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Ошибка входа");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      window.location.reload();
    },
  });

  const handleLogin = () => {
    loginMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">АСУ-Оповещение</h1>
              <p className="text-xs text-muted-foreground">Министерство энергетики</p>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-6">
            <div className="max-w-md mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">Вход в систему</CardTitle>
                  <CardDescription>
                    Нажмите кнопку для входа в систему управления оповещениями
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleLogin}
                    className="w-full"
                    size="lg"
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4 mr-2" />
                    )}
                    Войти
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Управление штабами</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Создание групп, добавление участников, импорт из Excel
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">SMS-уведомления</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Индивидуальные и массовые рассылки с отслеживанием доставки
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Планирование</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Отложенная отправка по дате и времени для групп и участников
                  </CardDescription>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <CardTitle className="text-lg">Журнал событий</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Полная история операций с фильтрацией и поиском
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          АСУ-Оповещение — Министерство энергетики
        </div>
      </footer>
    </div>
  );
}
