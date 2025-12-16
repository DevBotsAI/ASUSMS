import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Users, Clock, Shield, ChevronRight } from "lucide-react";

export default function Landing() {
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
          <Button asChild data-testid="button-login">
            <a href="/api/login">
              Войти в систему
              <ChevronRight className="w-4 h-4 ml-1" />
            </a>
          </Button>
        </div>
      </header>

      <main>
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Автоматизированная система уведомлений
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Оперативное управление SMS-уведомлениями участников штабов. 
                Массовые и индивидуальные рассылки, планирование, отслеживание статусов доставки.
              </p>
              <Button size="lg" asChild data-testid="button-start">
                <a href="/api/login">
                  Начать работу
                  <ChevronRight className="w-5 h-5 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 bg-muted/30">
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

        <section className="py-16">
          <div className="container mx-auto px-6 text-center">
            <h3 className="text-2xl font-semibold mb-4">Статусы доставки в реальном времени</h3>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Автоматическое обновление статусов каждые 10 секунд. 
              Цветовая индикация для быстрого контроля доставки сообщений.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">Доставлено</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-100 dark:bg-orange-900/30">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">В процессе</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 dark:bg-red-900/30">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">Ошибка</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800">
                <div className="w-3 h-3 rounded-full bg-gray-400" />
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Запланировано</span>
              </div>
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
