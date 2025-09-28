import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Settings, 
  Printer, 
  Scan, 
  CreditCard, 
  Wifi, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  RefreshCw,
  Cable,
  Usb
} from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useToast } from "@/hooks/use-toast";

interface HardwareDevice {
  id: string;
  name: string;
  type: 'fiscal_printer' | 'barcode_scanner' | 'payment_terminal' | 'cash_drawer' | 'display' | 'scale';
  brand: string;
  model: string;
  status: 'connected' | 'disconnected' | 'error' | 'configuring';
  connection: 'usb' | 'com' | 'tcp' | 'bluetooth' | 'wifi';
  port?: string;
  ip?: string;
  settings: Record<string, any>;
  lastSeen: Date;
  firmware?: string;
  serial?: string;
}

interface DeviceDriver {
  id: string;
  name: string;
  version: string;
  deviceTypes: string[];
  supportedModels: string[];
  status: 'installed' | 'not_installed' | 'update_available';
}

export default function HardwareConfig() {
  const [selectedDevice, setSelectedDevice] = useState<HardwareDevice | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data - would be from API in production
  const devices: HardwareDevice[] = [
    {
      id: '1',
      name: 'Фискальный принтер Штрих-М',
      type: 'fiscal_printer',
      brand: 'Штрих-М',
      model: 'Штрих-Лайт-01Ф',
      status: 'connected',
      connection: 'usb',
      port: 'COM3',
      settings: {
        baudRate: 115200,
        encoding: 'cp1251',
        paperWidth: 80,
        autocut: true,
        fiscalMode: true,
        ofdEnabled: true
      },
      lastSeen: new Date(),
      firmware: '2.1.45',
      serial: 'SLF123456789'
    },
    {
      id: '2',
      name: 'Сканер штрих-кодов Honeywell',
      type: 'barcode_scanner',
      brand: 'Honeywell',
      model: 'Voyager 1200g',
      status: 'connected',
      connection: 'usb',
      settings: {
        autoTrigger: true,
        beepEnabled: true,
        ledEnabled: true,
        scanFormats: ['ean13', 'ean8', 'code128', 'qr']
      },
      lastSeen: new Date(),
      firmware: '1.5.12',
      serial: 'HW987654321'
    },
    {
      id: '3',
      name: 'Эквайринговый терминал Казкоммерцбанк',
      type: 'payment_terminal',
      brand: 'VeriFone',
      model: 'VX520',
      status: 'connected',
      connection: 'tcp',
      ip: '192.168.1.100',
      settings: {
        acquirerBank: 'kazkommertsbank',
        terminalId: 'KKB12345',
        merchantId: 'M123456789',
        timeout: 60,
        receiptsEnabled: true
      },
      lastSeen: new Date(),
      firmware: '3.2.1',
      serial: 'VF520123456'
    },
    {
      id: '4',
      name: 'Денежный ящик',
      type: 'cash_drawer',
      brand: 'Generic',
      model: 'CD-410',
      status: 'error',
      connection: 'com',
      port: 'COM4',
      settings: {
        openSignal: 'rts',
        openDuration: 200
      },
      lastSeen: new Date(Date.now() - 5 * 60 * 1000),
      serial: 'CD410789123'
    }
  ];

  const drivers: DeviceDriver[] = [
    {
      id: '1',
      name: 'Штрих-М Driver Pack',
      version: '5.2.1',
      deviceTypes: ['fiscal_printer'],
      supportedModels: ['Штрих-Лайт-01Ф', 'Штрих-ФР-К', 'Элвес-ФР-К'],
      status: 'installed'
    },
    {
      id: '2',
      name: 'Honeywell Scanner Driver',
      version: '1.8.3',
      deviceTypes: ['barcode_scanner'],
      supportedModels: ['Voyager 1200g', 'Voyager 1400g', 'Genesis 7580g'],
      status: 'update_available'
    },
    {
      id: '3',
      name: 'VeriFone Payment Driver',
      version: '2.4.7',
      deviceTypes: ['payment_terminal'],
      supportedModels: ['VX520', 'VX675', 'VX680'],
      status: 'installed'
    }
  ];

  const testDevice = async (deviceId: string) => {
    const device = devices.find(d => d.id === deviceId);
    if (!device) return;

    toast({
      title: "Тестирование устройства",
      description: `Проверка связи с ${device.name}...`,
    });

    // Mock test
    setTimeout(() => {
      const success = Math.random() > 0.3;
      toast({
        title: success ? "Тест пройден" : "Ошибка теста",
        description: success 
          ? `${device.name} работает корректно`
          : `Ошибка связи с ${device.name}`,
        variant: success ? "default" : "destructive",
      });
    }, 2000);
  };

  const scanForDevices = () => {
    setIsScanning(true);
    toast({
      title: "Поиск устройств",
      description: "Сканирование подключенных устройств...",
    });

    setTimeout(() => {
      setIsScanning(false);
      toast({
        title: "Поиск завершен",
        description: "Найдено 4 устройства",
      });
    }, 3000);
  };

  const getStatusIcon = (status: HardwareDevice['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'disconnected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'configuring':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default:
        return <XCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: HardwareDevice['status']) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Подключено</Badge>;
      case 'disconnected':
        return <Badge variant="secondary">Отключено</Badge>;
      case 'error':
        return <Badge variant="destructive">Ошибка</Badge>;
      case 'configuring':
        return <Badge className="bg-blue-100 text-blue-800">Настройка</Badge>;
      default:
        return <Badge variant="outline">Неизвестно</Badge>;
    }
  };

  const getDeviceIcon = (type: HardwareDevice['type']) => {
    switch (type) {
      case 'fiscal_printer':
        return <Printer className="h-4 w-4" />;
      case 'barcode_scanner':
        return <Scan className="h-4 w-4" />;
      case 'payment_terminal':
        return <CreditCard className="h-4 w-4" />;
      case 'cash_drawer':
        return <Cable className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getConnectionIcon = (connection: HardwareDevice['connection']) => {
    switch (connection) {
      case 'usb':
        return <Usb className="h-4 w-4" />;
      case 'tcp':
      case 'wifi':
        return <Wifi className="h-4 w-4" />;
      case 'com':
      case 'bluetooth':
        return <Cable className="h-4 w-4" />;
      default:
        return <Cable className="h-4 w-4" />;
    }
  };

  const getDeviceTypeLabel = (type: HardwareDevice['type']) => {
    const labels = {
      'fiscal_printer': 'Фискальный принтер',
      'barcode_scanner': 'Сканер штрих-кодов',
      'payment_terminal': 'Платежный терминал',
      'cash_drawer': 'Денежный ящик',
      'display': 'Дисплей покупателя',
      'scale': 'Весы'
    };
    return labels[type] || type;
  };

  const kazakhstanDevices = devices.filter(device => 
    device.brand === 'Штрих-М' || 
    device.settings.acquirerBank === 'kazkommertsbank' ||
    device.settings.fiscalMode
  );

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Настройка оборудования</h1>
          <div className="flex gap-3">
            <Button variant="outline" onClick={scanForDevices} disabled={isScanning}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
              {isScanning ? 'Поиск...' : 'Найти устройства'}
            </Button>
          </div>
        </div>

        {/* Kazakhstan Compliance Alert */}
        {kazakhstanDevices.length > 0 && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Обнаружено {kazakhstanDevices.length} устройств с поддержкой требований РК: 
              фискальное оборудование Штрих-М и эквайринг Казкоммерцбанк.
            </AlertDescription>
          </Alert>
        )}

        {/* Device Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего устройств</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{devices.length}</div>
              <p className="text-xs text-muted-foreground">Подключено</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активные</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {devices.filter(d => d.status === 'connected').length}
              </div>
              <p className="text-xs text-muted-foreground">Работают</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">С ошибками</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {devices.filter(d => d.status === 'error' || d.status === 'disconnected').length}
              </div>
              <p className="text-xs text-muted-foreground">Требуют внимания</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Соответствие РК</CardTitle>
              <Printer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{kazakhstanDevices.length}</div>
              <p className="text-xs text-muted-foreground">Сертифицированных</p>
            </CardContent>
          </Card>
        </div>

        {/* Devices Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Подключенные устройства</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Устройство</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Подключение</TableHead>
                  <TableHead>Производитель</TableHead>
                  <TableHead>Последняя связь</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devices.map((device) => (
                  <TableRow key={device.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getDeviceIcon(device.type)}
                        <div>
                          <p className="font-medium text-card-foreground">{device.name}</p>
                          <p className="text-sm text-muted-foreground">{device.model}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getDeviceTypeLabel(device.type)}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(device.status)}
                        {getStatusBadge(device.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getConnectionIcon(device.connection)}
                        <span className="text-sm">
                          {device.connection.toUpperCase()}
                          {device.port && ` (${device.port})`}
                          {device.ip && ` (${device.ip})`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{device.brand}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {device.lastSeen.toLocaleTimeString('ru-RU')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => testDevice(device.id)}>
                          Тест
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setSelectedDevice(device)}>
                          Настроить
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Drivers */}
        <Card>
          <CardHeader>
            <CardTitle>Драйверы устройств</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Драйвер</TableHead>
                  <TableHead>Версия</TableHead>
                  <TableHead>Поддерживаемые устройства</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {drivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell className="font-medium">{driver.name}</TableCell>
                    <TableCell>{driver.version}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {driver.supportedModels.slice(0, 2).map(model => (
                          <Badge key={model} variant="outline" className="text-xs">
                            {model}
                          </Badge>
                        ))}
                        {driver.supportedModels.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{driver.supportedModels.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {driver.status === 'installed' && (
                        <Badge className="bg-green-100 text-green-800">Установлен</Badge>
                      )}
                      {driver.status === 'update_available' && (
                        <Badge className="bg-yellow-100 text-yellow-800">Обновление</Badge>
                      )}
                      {driver.status === 'not_installed' && (
                        <Badge variant="secondary">Не установлен</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {driver.status === 'update_available' && (
                        <Button variant="outline" size="sm">
                          Обновить
                        </Button>
                      )}
                      {driver.status === 'not_installed' && (
                        <Button variant="outline" size="sm">
                          Установить
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}