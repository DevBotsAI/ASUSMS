import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Bell, User, Lock } from "lucide-react";

const loginSchema = z.object({
  username: z.string().min(1, "Введите логин"),
  password: z.string().min(1, "Введите пароль"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Логин должен быть не менее 3 символов"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
  confirmPassword: z.string().min(1, "Подтвердите пароль"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("login");

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: "", password: "", confirmPassword: "" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      return apiRequest("POST", "/api/auth/login", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Успешный вход",
        description: "Добро пожаловать в систему",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка входа",
        description: error.message || "Неверный логин или пароль",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterForm) => {
      const { confirmPassword, ...registerData } = data;
      return apiRequest("POST", "/api/auth/register", registerData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Регистрация успешна",
        description: "Вы успешно зарегистрированы и вошли в систему",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка регистрации",
        description: error.message || "Не удалось зарегистрироваться",
        variant: "destructive",
      });
    },
  });

  const handleLogin = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const handleRegister = (data: RegisterForm) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
              <Bell className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">АСУ-Оповещение</h1>
          </div>
          <p className="text-muted-foreground text-center">
            Система управления SMS-уведомлениями
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-xl text-center">Вход в систему</CardTitle>
            <CardDescription className="text-center">
              Войдите или зарегистрируйтесь для продолжения
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" data-testid="tab-login">Вход</TabsTrigger>
                <TabsTrigger value="register" data-testid="tab-register">Регистрация</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-username">Логин</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-username"
                        placeholder="Введите логин"
                        className="pl-9"
                        {...loginForm.register("username")}
                        data-testid="input-login-username"
                      />
                    </div>
                    {loginForm.formState.errors.username && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.username.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Пароль</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="Введите пароль"
                        className="pl-9"
                        {...loginForm.register("password")}
                        data-testid="input-login-password"
                      />
                    </div>
                    {loginForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={loginMutation.isPending}
                    data-testid="button-login"
                  >
                    {loginMutation.isPending ? "Вход..." : "Войти"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-username">Логин</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-username"
                        placeholder="Придумайте логин"
                        className="pl-9"
                        {...registerForm.register("username")}
                        data-testid="input-register-username"
                      />
                    </div>
                    {registerForm.formState.errors.username && (
                      <p className="text-sm text-destructive">{registerForm.formState.errors.username.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Пароль</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="Придумайте пароль"
                        className="pl-9"
                        {...registerForm.register("password")}
                        data-testid="input-register-password"
                      />
                    </div>
                    {registerForm.formState.errors.password && (
                      <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm">Подтвердите пароль</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-confirm"
                        type="password"
                        placeholder="Повторите пароль"
                        className="pl-9"
                        {...registerForm.register("confirmPassword")}
                        data-testid="input-register-confirm"
                      />
                    </div>
                    {registerForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={registerMutation.isPending}
                    data-testid="button-register"
                  >
                    {registerMutation.isPending ? "Регистрация..." : "Зарегистрироваться"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
