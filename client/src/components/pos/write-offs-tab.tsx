import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, AlertCircle, Calendar, TrendingDown, Package } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLanguage } from "@/i18n/LanguageContext";
import { useFormatters } from "@/i18n/utils";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import type { ProductWithCategory } from "@shared/schema";

const writeOffSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  quantity: z.number().min(1, "Quantity must be positive"),
  reason: z.enum(['expired', 'damaged', 'theft', 'loss', 'defective', 'other']),
  notes: z.string().optional(),
});

interface WriteOffRecord {
  id: string;
  productId: string;
  product: ProductWithCategory;
  quantity: number;
  reason: 'expired' | 'damaged' | 'theft' | 'loss' | 'defective' | 'other';
  cost: number;
  notes?: string;
  createdAt: Date;
  createdBy: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

export default function WriteOffsTab() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterReason, setFilterReason] = useState<string>("all");
  const { t } = useLanguage();
  const { formatCurrency, formatDate } = useFormatters();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof writeOffSchema>>({
    resolver: zodResolver(writeOffSchema),
    defaultValues: {
      quantity: 1,
    },
  });

  // Mock data - would be from API in production
  const writeOffs: WriteOffRecord[] = [
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
        imageUrl: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        category: { id: 'cat-1', name: 'Напитки', description: null }
      },
      quantity: 5,
      reason: 'expired',
      cost: 2500,
      notes: 'Просроченные упаковки, обнаружены при инвентаризации',
      createdAt: new Date('2024-01-15'),
      createdBy: 'Анна Петрова',
      approved: true,
      approvedBy: 'Менеджер',
      approvedAt: new Date('2024-01-16')
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
        imageUrl: null,
        isActive: true,
        createdAt: new Date('2024-01-02'),
        category: { id: 'cat-2', name: 'Выпечка', description: null }
      },
      quantity: 2,
      reason: 'damaged',
      cost: 600,
      notes: 'Поврежденная упаковка при транспортировке',
      createdAt: new Date('2024-01-18'),
      createdBy: 'Анна Петрова',
      approved: false
    }
  ];

  const { data: products = [] } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const writeOffMutation = useMutation({
    mutationFn: async (data: z.infer<typeof writeOffSchema>) => {
      // Mock API call - would be real in production
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/writeoffs"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: t.common.success,
        description: "Списание оформлено",
      });
    },
  });

  const reasonLabels = {
    expired: 'Просрочен',
    damaged: 'Поврежден',
    theft: 'Кража',
    loss: 'Потеря',
    defective: 'Брак',
    other: 'Другое'
  };

  const filteredWriteOffs = writeOffs.filter(writeOff => {
    const matchesSearch = writeOff.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         writeOff.product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesReason = filterReason === 'all' || writeOff.reason === filterReason;
    return matchesSearch && matchesReason;
  });

  const getReasonBadge = (reason: WriteOffRecord['reason']) => {
    const colors = {
      expired: 'bg-red-100 text-red-800',
      damaged: 'bg-orange-100 text-orange-800',
      theft: 'bg-purple-100 text-purple-800',
      loss: 'bg-yellow-100 text-yellow-800',
      defective: 'bg-gray-100 text-gray-800',
      other: 'bg-blue-100 text-blue-800'
    };
    
    return (
      <Badge className={colors[reason]}>
        {reasonLabels[reason]}
      </Badge>
    );
  };

  const totalWriteOffValue = writeOffs
    .filter(wo => filterReason === 'all' || wo.reason === filterReason)
    .reduce((sum, wo) => sum + wo.cost, 0);

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Списания товаров</h1>
          <div className="flex gap-3">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Новое списание
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Списание товара</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => writeOffMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="productId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Товар</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите товар" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map(product => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name} ({product.sku})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Количество</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Причина списания</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите причину" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(reasonLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Примечание</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Дополнительная информация..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                        {t.common.cancel}
                      </Button>
                      <Button type="submit" disabled={writeOffMutation.isPending} className="flex-1">
                        {writeOffMutation.isPending ? "Списание..." : "Списать"}
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
              <CardTitle className="text-sm font-medium">Сегодня списано</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">товарных позиций</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Стоимость списаний</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(totalWriteOffValue)}</div>
              <p className="text-xs text-muted-foreground">За текущий месяц</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">На утверждении</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">1</div>
              <p className="text-xs text-muted-foreground">Ожидает подтверждения</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Основная причина</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Просрочка</div>
              <p className="text-xs text-muted-foreground">60% от всех списаний</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <Input
            placeholder="Поиск по товарам или SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <Select value={filterReason} onValueChange={setFilterReason}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все причины</SelectItem>
              {Object.entries(reasonLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Write-offs Table */}
        <Card>
          <CardHeader>
            <CardTitle>История списаний</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Товар</TableHead>
                  <TableHead>Количество</TableHead>
                  <TableHead>Причина</TableHead>
                  <TableHead>Стоимость</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Списал</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredWriteOffs.map((writeOff) => (
                  <TableRow key={writeOff.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-card-foreground">{writeOff.product.name}</p>
                        <p className="text-sm text-muted-foreground">{writeOff.product.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>{writeOff.quantity}</TableCell>
                    <TableCell>{getReasonBadge(writeOff.reason)}</TableCell>
                    <TableCell className="font-semibold text-red-600">{formatCurrency(writeOff.cost)}</TableCell>
                    <TableCell>
                      {writeOff.approved ? (
                        <Badge className="bg-green-100 text-green-800">Утверждено</Badge>
                      ) : (
                        <Badge variant="secondary">На рассмотрении</Badge>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(writeOff.createdAt)}</TableCell>
                    <TableCell className="text-muted-foreground">{writeOff.createdBy}</TableCell>
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