import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Search, FileText, AlertTriangle, CheckCircle, Calculator } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLanguage } from "@/i18n/LanguageContext";
import { useFormatters } from "@/i18n/utils";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import type { ProductWithCategory } from "@shared/schema";

const auditSchema = z.object({
  name: z.string().min(1, "Audit name is required"),
  description: z.string().optional(),
});

const auditItemSchema = z.object({
  productId: z.string(),
  expectedQuantity: z.number(),
  actualQuantity: z.number(),
  notes: z.string().optional(),
});

interface AuditItem {
  id: string;
  productId: string;
  product: ProductWithCategory;
  expectedQuantity: number;
  actualQuantity: number;
  variance: number;
  status: 'pending' | 'counted' | 'verified';
  notes?: string;
}

interface Audit {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'in_progress' | 'completed' | 'cancelled';
  items: AuditItem[];
  createdAt: Date;
  completedAt?: Date;
  createdBy: string;
  totalItems: number;
  countedItems: number;
  totalVariance: number;
}

export default function InventoryAuditTab() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useLanguage();
  const { formatCurrency, formatDate } = useFormatters();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof auditSchema>>({
    resolver: zodResolver(auditSchema),
  });

  // Mock data - would be from API in production
  const audits: Audit[] = [
    {
      id: '1',
      name: 'Ежемесячная инвентаризация - Январь 2024',
      description: 'Полная инвентаризация всех товаров',
      status: 'completed',
      items: [],
      createdAt: new Date('2024-01-20'),
      completedAt: new Date('2024-01-22'),
      createdBy: 'Анна Петрова',
      totalItems: 45,
      countedItems: 45,
      totalVariance: -2500
    },
    {
      id: '2',
      name: 'Выборочная проверка - Напитки',
      description: 'Инвентаризация категории напитков',
      status: 'in_progress',
      items: [],
      createdAt: new Date('2024-01-25'),
      createdBy: 'Анна Петрова',
      totalItems: 12,
      countedItems: 8,
      totalVariance: 0
    }
  ];

  const auditItems: AuditItem[] = [
    {
      id: '1',
      productId: 'prod-1',
      product: {
        id: 'prod-1',
        name: 'Казахстанский чай',
        price: '500.00',
        sku: 'TEA-KZ-001',
        stock: 50,
        description: null,
        categoryId: 'cat-1',
        isActive: true,
        createdAt: new Date('2024-01-01'),
        category: { id: 'cat-1', name: 'Напитки', description: null }
      },
      expectedQuantity: 50,
      actualQuantity: 48,
      variance: -2,
      status: 'counted',
      notes: 'Найдены просроченные упаковки'
    },
    {
      id: '2',
      productId: 'prod-2',
      product: {
        id: 'prod-2',
        name: 'Баурсаки',
        price: '300.00',
        sku: 'PASTRY-001',
        stock: 25,
        description: null,
        categoryId: 'cat-2',
        isActive: true,
        createdAt: new Date('2024-01-02'),
        category: { id: 'cat-2', name: 'Выпечка', description: null }
      },
      expectedQuantity: 25,
      actualQuantity: 25,
      variance: 0,
      status: 'verified'
    }
  ];

  const { data: products = [] } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const createAuditMutation = useMutation({
    mutationFn: async (data: z.infer<typeof auditSchema>) => {
      // Mock API call - would be real in production
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/audits"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: t.common.success,
        description: "Инвентаризация создана",
      });
    },
  });

  const filteredAudits = audits.filter(audit =>
    audit.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: Audit['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Завершена
          </Badge>
        );
      case 'in_progress':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Calculator className="w-3 h-3 mr-1" />
            В процессе
          </Badge>
        );
      case 'draft':
        return <Badge variant="outline">Черновик</Badge>;
      default:
        return <Badge variant="destructive">Отменена</Badge>;
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Инвентаризация</h1>
          <div className="flex gap-3">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Новая инвентаризация
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Создать инвентаризацию</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => createAuditMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название инвентаризации</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Например: Ежемесячная проверка" />
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
                          <FormLabel>Описание (опционально)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Описание инвентаризации" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                        {t.common.cancel}
                      </Button>
                      <Button type="submit" disabled={createAuditMutation.isPending} className="flex-1">
                        {createAuditMutation.isPending ? "Создание..." : "Создать"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активные инвентаризации</CardTitle>
              <Calculator className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1</div>
              <p className="text-xs text-muted-foreground">В процессе</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Товаров к проверке</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">Осталось проверить</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Общие расхождения</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">-{formatCurrency(2500)}</div>
              <p className="text-xs text-muted-foreground">За последний месяц</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Точность инвентаризации</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">96.2%</div>
              <p className="text-xs text-muted-foreground">Средняя точность</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Поиск инвентаризаций..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Audits Table */}
        <Card>
          <CardHeader>
            <CardTitle>Список инвентаризаций</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Прогресс</TableHead>
                  <TableHead>Расхождения</TableHead>
                  <TableHead>Создана</TableHead>
                  <TableHead>Создал</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAudits.map((audit) => (
                  <TableRow key={audit.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-card-foreground">{audit.name}</p>
                        {audit.description && (
                          <p className="text-sm text-muted-foreground">{audit.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(audit.status)}</TableCell>
                    <TableCell>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(audit.countedItems / audit.totalItems) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {audit.countedItems} / {audit.totalItems}
                      </p>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${audit.totalVariance === 0 ? 'text-green-600' : 
                        audit.totalVariance > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {audit.totalVariance > 0 ? '+' : ''}{formatCurrency(Math.abs(audit.totalVariance))}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(audit.createdAt)}</TableCell>
                    <TableCell className="text-muted-foreground">{audit.createdBy}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4" />
                        </Button>
                        {audit.status === 'in_progress' && (
                          <Button size="sm">
                            Продолжить
                          </Button>
                        )}
                      </div>
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