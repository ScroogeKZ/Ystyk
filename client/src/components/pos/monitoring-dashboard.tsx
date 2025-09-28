import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Server, 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Users,
  CreditCard,
  Printer,
  RefreshCw
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useFormatters } from "@/i18n/utils";

interface SystemStatus {
  server: 'online' | 'offline' | 'maintenance';
  database: 'connected' | 'disconnected' | 'slow';
  fiscalPrinter: 'ready' | 'error' | 'offline';
  ofdConnection: 'connected' | 'disconnected' | 'synchronizing';
  internetConnection: 'stable' | 'unstable' | 'offline';
  lastSync: Date;
  uptime: number; // in hours
}

interface LiveMetrics {
  activeUsers: number;
  currentShiftSales: number;
  transactionsToday: number;
  averageResponseTime: number;
  errorRate: number;
  diskUsage: number;
  memoryUsage: number;
  cpuUsage: number;
}

interface RecentActivity {
  id: string;
  type: 'sale' | 'return' | 'sync' | 'error' | 'login';
  message: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'success';
}

export default function MonitoringDashboard() {
  const [refreshCount, setRefreshCount] = useState(0);
  const { t } = useLanguage();
  const { formatCurrency, formatDate } = useFormatters();

  // Mock real-time data - would be from WebSocket/SSE in production
  const systemStatus: SystemStatus = {
    server: 'online',
    database: 'connected',
    fiscalPrinter: 'ready',
    ofdConnection: 'connected',
    internetConnection: 'stable',
    lastSync: new Date(),
    uptime: 72.5
  };

  const liveMetrics: LiveMetrics = {
    activeUsers: 3,
    currentShiftSales: 45600 + Math.random() * 1000,
    transactionsToday: 124,
    averageResponseTime: 95 + Math.random() * 20,
    errorRate: 0.02,
    diskUsage: 67,
    memoryUsage: 45,
    cpuUsage: 12 + Math.random() * 15
  };

  const recentActivity: RecentActivity[] = [
    {
      id: '1',
      type: 'sale',
      message: 'Продажа на сумму ₸2,450 (Чек #1247)',
      timestamp: new Date(Date.now() - 2 * 60000),
      severity: 'success'
    },
    {
      id: '2',
      type: 'sync',
      message: 'Синхронизация с ОФД выполнена успешно',
      timestamp: new Date(Date.now() - 5 * 60000),
      severity: 'info'
    },
    {
      id: '3',
      type: 'sale',
      message: 'Продажа на сумму ₸1,890 (Чек #1246)',
      timestamp: new Date(Date.now() - 8 * 60000),
      severity: 'success'
    },
    {
      id: '4',
      type: 'login',
      message: 'Пользователь "Анна Петрова" вошла в систему',
      timestamp: new Date(Date.now() - 12 * 60000),
      severity: 'info'
    },
    {
      id: '5',
      type: 'error',
      message: 'Временная проблема с подключением к принтеру (восстановлено)',
      timestamp: new Date(Date.now() - 18 * 60000),
      severity: 'warning'
    }
  ];

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCount(prev => prev + 1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected':
      case 'ready':
      case 'stable':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'offline':
      case 'disconnected':
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'maintenance':
      case 'synchronizing':
      case 'slow':
      case 'unstable':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
      case 'connected':
      case 'ready':
      case 'stable':
        return <Badge className="bg-green-100 text-green-800">Работает</Badge>;
      case 'offline':
      case 'disconnected':
      case 'error':
        return <Badge variant="destructive">Не работает</Badge>;
      case 'maintenance':
      case 'synchronizing':
      case 'slow':
      case 'unstable':
        return <Badge variant="secondary">Проблемы</Badge>;
      default:
        return <Badge variant="outline">Неизвестно</Badge>;
    }
  };

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'sale':
        return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'return':
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
      case 'sync':
        return <Database className="h-4 w-4 text-blue-600" />;
      case 'login':
        return <Users className="h-4 w-4 text-gray-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин назад`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ч назад`;
    return formatDate(date);
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Мониторинг системы</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            Обновлено: {formatDate(new Date())}
          </div>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Сервер</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemStatus.server)}
                {getStatusBadge(systemStatus.server)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Время работы: {systemStatus.uptime.toFixed(1)}ч
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">База данных</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemStatus.database)}
                {getStatusBadge(systemStatus.database)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Отклик: {liveMetrics.averageResponseTime.toFixed(0)}мс
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Фискальный принтер</CardTitle>
              <Printer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemStatus.fiscalPrinter)}
                {getStatusBadge(systemStatus.fiscalPrinter)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Очередь: 0 документов
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ОФД соединение</CardTitle>
              <Wifi className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemStatus.ofdConnection)}
                {getStatusBadge(systemStatus.ofdConnection)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Синхр: {formatTimeAgo(systemStatus.lastSync)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Интернет</CardTitle>
              {systemStatus.internetConnection === 'offline' ? 
                <WifiOff className="h-4 w-4 text-muted-foreground" /> : 
                <Wifi className="h-4 w-4 text-muted-foreground" />
              }
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemStatus.internetConnection)}
                {getStatusBadge(systemStatus.internetConnection)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Пинг: 23мс
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Live Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активные пользователи</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{liveMetrics.activeUsers}</div>
              <p className="text-xs text-muted-foreground">В системе сейчас</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Продажи за смену</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(liveMetrics.currentShiftSales)}</div>
              <p className="text-xs text-muted-foreground">{liveMetrics.transactionsToday} чеков</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Использование CPU</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{liveMetrics.cpuUsage.toFixed(0)}%</div>
              <Progress value={liveMetrics.cpuUsage} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Использование памяти</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{liveMetrics.memoryUsage}%</div>
              <Progress value={liveMetrics.memoryUsage} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* System Alerts */}
        {liveMetrics.diskUsage > 80 && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Внимание: Дисковое пространство заполнено на {liveMetrics.diskUsage}%. 
              Рекомендуется очистить старые файлы или архивировать данные.
            </AlertDescription>
          </Alert>
        )}

        {liveMetrics.errorRate > 0.05 && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Высокий уровень ошибок: {(liveMetrics.errorRate * 100).toFixed(2)}%. 
              Проверьте журналы системы и работу компонентов.
            </AlertDescription>
          </Alert>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Последняя активность</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground">
                      {activity.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}