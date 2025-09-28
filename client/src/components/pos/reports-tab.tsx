import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { FileText, Download, Calendar as CalendarIcon, TrendingUp, DollarSign, Users, Package2 } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useFormatters } from "@/i18n/utils";
import { format } from "date-fns";
import { ru, kk } from "date-fns/locale";

interface ReportData {
  id: string;
  type: 'sales' | 'inventory' | 'fiscal' | 'customers' | 'shift';
  name: string;
  period: string;
  generatedAt: Date;
  status: 'generating' | 'ready' | 'failed';
  format: 'pdf' | 'xlsx' | 'csv';
  size?: string;
}

interface SalesMetrics {
  period: string;
  totalSales: number;
  transactionCount: number;
  averageTicket: number;
  topProducts: { name: string; revenue: number; quantity: number }[];
  hourlyBreakdown: { hour: number; sales: number }[];
}

export default function ReportsTab() {
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [reportType, setReportType] = useState<string>("sales");
  const { t, language } = useLanguage();
  const { formatCurrency, formatDate } = useFormatters();

  // Mock data - would be from API in production
  const reports: ReportData[] = [
    {
      id: '1',
      type: 'sales',
      name: 'Отчет по продажам за январь 2024',
      period: '01.01.2024 - 31.01.2024',
      generatedAt: new Date('2024-02-01'),
      status: 'ready',
      format: 'pdf',
      size: '1.2 MB'
    },
    {
      id: '2',
      type: 'fiscal',
      name: 'Фискальный отчет Z-сводка',
      period: '27.01.2024',
      generatedAt: new Date('2024-01-27'),
      status: 'ready',
      format: 'pdf',
      size: '245 KB'
    },
    {
      id: '3',
      type: 'inventory',
      name: 'Отчет по остаткам товаров',
      period: 'На 28.01.2024',
      generatedAt: new Date('2024-01-28'),
      status: 'generating',
      format: 'xlsx'
    }
  ];

  const salesMetrics: SalesMetrics = {
    period: 'Январь 2024',
    totalSales: 1250000,
    transactionCount: 842,
    averageTicket: 1485,
    topProducts: [
      { name: 'Казахстанский чай', revenue: 125000, quantity: 250 },
      { name: 'Баурсаки', revenue: 98000, quantity: 327 },
      { name: 'Кофе арабика', revenue: 87500, quantity: 175 },
      { name: 'Национальные сладости', revenue: 65000, quantity: 130 },
      { name: 'Минеральная вода', revenue: 45000, quantity: 450 }
    ],
    hourlyBreakdown: [
      { hour: 9, sales: 45000 },
      { hour: 10, sales: 67000 },
      { hour: 11, sales: 89000 },
      { hour: 12, sales: 125000 },
      { hour: 13, sales: 156000 },
      { hour: 14, sales: 134000 },
      { hour: 15, sales: 112000 },
      { hour: 16, sales: 98000 },
      { hour: 17, sales: 145000 },
      { hour: 18, sales: 167000 },
      { hour: 19, sales: 143000 },
      { hour: 20, sales: 89000 }
    ]
  };

  const generateReport = (type: string) => {
    // Mock report generation
    console.log(`Generating ${type} report`);
  };

  const getStatusBadge = (status: ReportData['status']) => {
    switch (status) {
      case 'ready':
        return <Badge className="bg-green-100 text-green-800">Готов</Badge>;
      case 'generating':
        return <Badge className="bg-blue-100 text-blue-800">Создается</Badge>;
      case 'failed':
        return <Badge variant="destructive">Ошибка</Badge>;
    }
  };

  const getTypeLabel = (type: ReportData['type']) => {
    switch (type) {
      case 'sales': return 'Продажи';
      case 'inventory': return 'Товары';
      case 'fiscal': return 'Фискальный';
      case 'customers': return 'Клиенты';
      case 'shift': return 'Смена';
    }
  };

  const maxSales = Math.max(...salesMetrics.hourlyBreakdown.map(h => h.sales));

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Отчеты и аналитика</h1>
          <Button onClick={() => generateReport(reportType)}>
            <FileText className="w-4 h-4 mr-2" />
            Создать отчет
          </Button>
        </div>

        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Общие продажи</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(salesMetrics.totalSales)}</div>
              <p className="text-xs text-muted-foreground">{salesMetrics.period}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Количество чеков</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{salesMetrics.transactionCount}</div>
              <p className="text-xs text-muted-foreground">+12% от прошлого месяца</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Средний чек</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(salesMetrics.averageTicket)}</div>
              <p className="text-xs text-muted-foreground">+8% от прошлого месяца</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активные клиенты</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">324</div>
              <p className="text-xs text-muted-foreground">Уникальные покупатели</p>
            </CardContent>
          </Card>
        </div>

        {/* Hourly Sales Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Продажи по часам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {salesMetrics.hourlyBreakdown.map((item) => (
                <div key={item.hour} className="flex items-center space-x-4">
                  <div className="w-12 text-sm font-medium">{item.hour}:00</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 relative">
                    <div
                      className="bg-blue-600 h-4 rounded-full"
                      style={{ width: `${(item.sales / maxSales) * 100}%` }}
                    />
                  </div>
                  <div className="w-24 text-sm text-right font-medium">
                    {formatCurrency(item.sales)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Топ товары</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Товар</TableHead>
                  <TableHead>Выручка</TableHead>
                  <TableHead>Количество</TableHead>
                  <TableHead>Доля</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesMetrics.topProducts.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>{formatCurrency(product.revenue)}</TableCell>
                    <TableCell>{product.quantity}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(product.revenue / salesMetrics.totalSales) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm">
                          {((product.revenue / salesMetrics.totalSales) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Report Generation */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Создать новый отчет</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Отчет по продажам</SelectItem>
                  <SelectItem value="inventory">Отчет по товарам</SelectItem>
                  <SelectItem value="fiscal">Фискальный отчет</SelectItem>
                  <SelectItem value="customers">Отчет по клиентам</SelectItem>
                  <SelectItem value="shift">Сменный отчет</SelectItem>
                </SelectContent>
              </Select>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd.MM.yyyy", { locale: language === 'ru' ? ru : kk }) : "Дата с"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd.MM.yyyy", { locale: language === 'ru' ? ru : kk }) : "Дата по"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} />
                </PopoverContent>
              </Popover>

              <Button onClick={() => generateReport(reportType)}>
                Создать отчет
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Generated Reports */}
        <Card>
          <CardHeader>
            <CardTitle>История отчетов</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Отчет</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Период</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead>Размер</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell className="font-medium">{report.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(report.type)}</Badge>
                    </TableCell>
                    <TableCell>{report.period}</TableCell>
                    <TableCell>{getStatusBadge(report.status)}</TableCell>
                    <TableCell>{formatDate(report.generatedAt)}</TableCell>
                    <TableCell>{report.size || '-'}</TableCell>
                    <TableCell>
                      {report.status === 'ready' && (
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
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