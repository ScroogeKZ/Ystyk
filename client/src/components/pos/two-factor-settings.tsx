import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, QrCode, CheckCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TwoFactorSettings() {
  const [step, setStep] = useState<"initial" | "setup" | "verify">("initial");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const { toast } = useToast();

  const { data: session } = useQuery<{ user?: { id: string; username: string; role: string; twoFactorEnabled?: boolean } }>({
    queryKey: ["/api/auth/session"],
  });

  const setupMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/2fa/setup", {});
      return res.json();
    },
    onSuccess: (data) => {
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep("setup");
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось настроить 2FA",
        variant: "destructive",
      });
    },
  });

  const enableMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await apiRequest("POST", "/api/auth/2fa/enable", { token });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "2FA успешно включен",
      });
      setStep("initial");
      setToken("");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Неверный код",
        variant: "destructive",
      });
    },
  });

  const disableMutation = useMutation({
    mutationFn: async (token: string) => {
      const res = await apiRequest("POST", "/api/auth/2fa/disable", { token });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "2FA отключен",
      });
      setToken("");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось отключить 2FA",
        variant: "destructive",
      });
    },
  });

  const handleEnable = () => {
    if (!token) {
      toast({
        title: "Ошибка",
        description: "Введите код из приложения",
        variant: "destructive",
      });
      return;
    }
    enableMutation.mutate(token);
  };

  const handleDisable = () => {
    if (!token) {
      toast({
        title: "Ошибка",
        description: "Введите код из приложения",
        variant: "destructive",
      });
      return;
    }
    disableMutation.mutate(token);
  };

  const isTwoFactorEnabled = session?.user?.twoFactorEnabled;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Двухфакторная аутентификация (2FA)
        </CardTitle>
        <CardDescription>
          Добавьте дополнительный уровень безопасности к вашему аккаунту
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === "initial" && (
          <>
            {isTwoFactorEnabled ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  2FA включен. Используйте код из вашего приложения при входе.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  2FA не включен. Рекомендуем включить для повышения безопасности.
                </AlertDescription>
              </Alert>
            )}

            {!isTwoFactorEnabled ? (
              <Button
                onClick={() => setupMutation.mutate()}
                disabled={setupMutation.isPending}
                data-testid="button-setup-2fa"
              >
                Настроить 2FA
              </Button>
            ) : (
              <div className="space-y-4">
                <Label htmlFor="disable-token">Код для отключения</Label>
                <Input
                  id="disable-token"
                  placeholder="000000"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  maxLength={6}
                  data-testid="input-disable-token"
                />
                <Button
                  onClick={handleDisable}
                  disabled={disableMutation.isPending}
                  variant="destructive"
                  data-testid="button-disable-2fa"
                >
                  Отключить 2FA
                </Button>
              </div>
            )}
          </>
        )}

        {step === "setup" && (
          <div className="space-y-4">
            <Alert>
              <QrCode className="h-4 w-4" />
              <AlertDescription>
                Отсканируйте QR-код в Google Authenticator, Microsoft Authenticator или другом приложении для 2FA
              </AlertDescription>
            </Alert>

            {qrCode && (
              <div className="flex justify-center p-4 bg-white rounded-lg">
                <img src={qrCode} alt="QR Code" className="w-64 h-64" />
              </div>
            )}

            <div className="space-y-2">
              <Label>Секретный ключ (резервная копия)</Label>
              <code className="block p-2 bg-muted rounded text-sm">
                {secret}
              </code>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verify-token">Код из приложения</Label>
              <Input
                id="verify-token"
                placeholder="000000"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                maxLength={6}
                data-testid="input-verify-token"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleEnable}
                disabled={enableMutation.isPending}
                data-testid="button-enable-2fa"
              >
                Подтвердить и включить
              </Button>
              <Button
                onClick={() => {
                  setStep("initial");
                  setToken("");
                  setQrCode("");
                  setSecret("");
                }}
                variant="outline"
                data-testid="button-cancel-2fa"
              >
                Отмена
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
