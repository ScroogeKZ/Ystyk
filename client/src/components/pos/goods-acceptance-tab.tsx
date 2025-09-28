import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Package, CheckCircle, AlertTriangle, Truck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLanguage } from "@/i18n/LanguageContext";
import { useFormatters } from "@/i18n/utils";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import type { ProductWithCategory } from "@shared/schema";

const acceptanceSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  expectedQuantity: z.number().min(1, "Expected quantity must be positive"),
  actualQuantity: z.number().min(0, "Actual quantity cannot be negative"),
  supplierInvoice: z.string().optional(),
  notes: z.string().optional(),
});

interface AcceptanceRecord {
  id: string;
  productId: string;
  product: ProductWithCategory;
  expectedQuantity: number;
  actualQuantity: number;
  discrepancy: number;
  status: 'pending' | 'accepted' | 'partial' | 'rejected';
  supplierInvoice?: string;
  notes?: string;
  createdAt: Date;
  acceptedBy: string;
}

export default function GoodsAcceptanceTab() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useLanguage();
  const { formatCurrency, formatDate } = useFormatters();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof acceptanceSchema>>({
    resolver: zodResolver(acceptanceSchema),
    defaultValues: {
      expectedQuantity: 1,
      actualQuantity: 1,
    },
  });

  // Mock data - would be from API in production
  const acceptanceRecords: AcceptanceRecord[] = [
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
      expectedQuantity: 100,
      actualQuantity: 95,
      discrepancy: -5,
      status: 'accepted',
      supplierInvoice: 'INV-2024-001',
      notes: 'Упаковка слегка повреждена',
      createdAt: new Date('2024-01-15'),
      acceptedBy: 'Анна Петрова'
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
      expectedQuantity: 50,
      actualQuantity: 50,
      discrepancy: 0,
      status: 'accepted',
      supplierInvoice: 'INV-2024-002',
      createdAt: new Date('2024-01-16'),
      acceptedBy: 'Анна Петрова'
    }
  ];

  const { data: products = [] } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const addAcceptanceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof acceptanceSchema>) => {
      // Mock API call - would be real in production
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/acceptances"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: t.common.success,
        description: "Приемка товара добавлена",
      });
    },
  });

  const filteredRecords = acceptanceRecords.filter(record =>
    record.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: AcceptanceRecord['status'], discrepancy: number) => {
    switch (status) {
      case 'accepted':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Принято
          </Badge>
        );
      case 'partial':
        return (
          <Badge variant="secondary">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Частично ({discrepancy > 0 ? '+' : ''}{discrepancy})
          </Badge>
        );
      case 'rejected':
        return <Badge variant="destructive">Отклонено</Badge>;
      default:
        return <Badge variant="outline">В ожидании</Badge>;
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Приемка товаров</h1>
          <div className="flex gap-3">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Новая приемка
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Приемка товара</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => addAcceptanceMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="productId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Товар</FormLabel>
                          <FormControl>
                            <select {...field} className="w-full p-2 border rounded">
                              <option value="">Выберите товар</option>
                              {products.map(product => (
                                <option key={product.id} value={product.id}>
                                  {product.name} ({product.sku})
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="expectedQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ожидаемое количество</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="actualQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Фактическое количество</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="supplierInvoice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Номер накладной</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                        {t.common.cancel}
                      </Button>
                      <Button type="submit" disabled={addAcceptanceMutation.isPending} className="flex-1">
                        {addAcceptanceMutation.isPending ? "Добавление..." : "Добавить"}
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
              <CardTitle className="text-sm font-medium">Сегодня принято</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">+3 от вчера</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Общая стоимость</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(125000)}</div>
              <p className="text-xs text-muted-foreground">За текущий месяц</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Расхождения</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <p className="text-xs text-muted-foreground">Требуют внимания</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Поставщики</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Активных поставщиков</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Поиск по товарам или SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Acceptance Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>История приемки</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Товар</TableHead>
                  <TableHead>Ожидалось</TableHead>
                  <TableHead>Получено</TableHead>
                  <TableHead>Расхождение</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead>Принял</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-card-foreground">{record.product.name}</p>
                        <p className="text-sm text-muted-foreground">{record.product.sku}</p>
                      </div>
                    </TableCell>
                    <TableCell>{record.expectedQuantity}</TableCell>
                    <TableCell>{record.actualQuantity}</TableCell>
                    <TableCell>
                      <span className={`font-medium ${record.discrepancy === 0 ? 'text-green-600' : 
                        record.discrepancy > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                        {record.discrepancy > 0 ? '+' : ''}{record.discrepancy}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status, record.discrepancy)}</TableCell>
                    <TableCell>{formatDate(record.createdAt)}</TableCell>
                    <TableCell className="text-muted-foreground">{record.acceptedBy}</TableCell>
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