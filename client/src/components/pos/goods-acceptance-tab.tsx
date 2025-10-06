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
import { Plus, Package, CheckCircle, AlertTriangle, Truck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLanguage } from "@/i18n/LanguageContext";
import { useFormatters } from "@/i18n/utils";
import { useToast } from "@/hooks/use-toast";
import { useSessionStore } from "@/hooks/use-session-store";
import { apiRequest } from "@/lib/queryClient";
import { insertGoodsAcceptanceSchema } from "@shared/schema";
import type { ProductWithCategory, GoodsAcceptance } from "@shared/schema";
import { z } from "zod";

const acceptanceFormSchema = insertGoodsAcceptanceSchema.extend({
  productId: z.string().min(1, "Выберите товар"),
  expectedQuantity: z.number().min(1, "Ожидаемое количество должно быть положительным"),
  actualQuantity: z.number().min(0, "Фактическое количество не может быть отрицательным"),
}).omit({ acceptedBy: true, discrepancy: true });

type AcceptanceRecord = GoodsAcceptance & {
  product: ProductWithCategory;
};

export default function GoodsAcceptanceTab() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useLanguage();
  const { formatCurrency, formatDate } = useFormatters();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const userId = useSessionStore((state) => state.userId);

  const form = useForm<z.infer<typeof acceptanceFormSchema>>({
    resolver: zodResolver(acceptanceFormSchema),
    defaultValues: {
      productId: "",
      expectedQuantity: 1,
      actualQuantity: 1,
      status: "pending",
      supplierInvoice: "",
      notes: "",
    },
  });

  const { data: acceptanceRecords = [], isLoading } = useQuery<AcceptanceRecord[]>({
    queryKey: ["/api/goods-acceptance"],
  });

  const { data: products = [] } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const addAcceptanceMutation = useMutation({
    mutationFn: async (data: z.infer<typeof acceptanceFormSchema>) => {
      const discrepancy = data.actualQuantity - data.expectedQuantity;
      let status = "accepted";
      if (discrepancy < 0) {
        status = "partial";
      }
      
      const acceptanceData = {
        ...data,
        acceptedBy: userId,
        discrepancy,
        status,
      };
      
      const response = await apiRequest("POST", "/api/goods-acceptance", acceptanceData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goods-acceptance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: t.common.success,
        description: "Приемка товара успешно добавлена",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить приемку",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await apiRequest("PUT", `/api/goods-acceptance/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/goods-acceptance"] });
      toast({
        title: t.common.success,
        description: "Статус приемки обновлен",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось обновить статус",
        variant: "destructive",
      });
    },
  });

  const filteredRecords = acceptanceRecords.filter((record) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      record.product?.name?.toLowerCase().includes(searchLower) ||
      record.product?.sku?.toLowerCase().includes(searchLower) ||
      record.supplierInvoice?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string, discrepancy: number) => {
    switch (status) {
      case "accepted":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" data-testid={`badge-status-accepted`}>
            <CheckCircle className="w-3 h-3 mr-1" />
            Принято
          </Badge>
        );
      case "partial":
        return (
          <Badge variant="secondary" data-testid={`badge-status-partial`}>
            <AlertTriangle className="w-3 h-3 mr-1" />
            Частично ({discrepancy > 0 ? "+" : ""}
            {discrepancy})
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="destructive" data-testid={`badge-status-rejected`}>
            Отклонено
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" data-testid={`badge-status-pending`}>
            В ожидании
          </Badge>
        );
    }
  };

  // Calculate summary stats
  const todayAccepted = acceptanceRecords.filter(
    (r) => new Date(r.createdAt).toDateString() === new Date().toDateString()
  ).length;

  const discrepancies = acceptanceRecords.filter(
    (r) => r.discrepancy !== 0 && r.status !== "rejected"
  ).length;

  return (
    <div className="flex-1 p-6" data-testid="goods-acceptance-tab">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Приемка товаров</h1>
          <div className="flex gap-3">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-acceptance">
                  <Plus className="w-4 h-4 mr-2" />
                  Новая приемка
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Приемка товара</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit((data) => addAcceptanceMutation.mutate(data))}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="productId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Товар</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-product">
                                <SelectValue placeholder="Выберите товар" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map((product) => (
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
                      name="expectedQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ожидаемое количество</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-expected-quantity"
                            />
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
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                              data-testid="input-actual-quantity"
                            />
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
                            <Input {...field} value={field.value || ""} data-testid="input-invoice-number" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Примечания</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ""} data-testid="textarea-notes" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                        className="flex-1"
                        data-testid="button-cancel"
                      >
                        {t.common.cancel}
                      </Button>
                      <Button
                        type="submit"
                        disabled={addAcceptanceMutation.isPending}
                        className="flex-1"
                        data-testid="button-submit"
                      >
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
              <div className="text-2xl font-bold" data-testid="text-today-accepted">
                {todayAccepted}
              </div>
              <p className="text-xs text-muted-foreground">приемок</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего записей</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-records">
                {acceptanceRecords.length}
              </div>
              <p className="text-xs text-muted-foreground">За все время</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Расхождения</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-discrepancies">
                {discrepancies}
              </div>
              <p className="text-xs text-muted-foreground">Требуют внимания</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Товаров</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-products-count">
                {products.length}
              </div>
              <p className="text-xs text-muted-foreground">В каталоге</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Поиск по товарам, SKU или номеру накладной..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
            data-testid="input-search"
          />
        </div>

        {/* Acceptance Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>История приемки</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Загрузка...</div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? "Записи не найдены" : "Пока нет записей приемки"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Товар</TableHead>
                    <TableHead>Ожидалось</TableHead>
                    <TableHead>Получено</TableHead>
                    <TableHead>Расхождение</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Накладная</TableHead>
                    <TableHead>Дата</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id} data-testid={`row-acceptance-${record.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-card-foreground">
                            {record.product?.name || "Неизвестный товар"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {record.product?.sku || "N/A"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell data-testid={`text-expected-${record.id}`}>
                        {record.expectedQuantity}
                      </TableCell>
                      <TableCell data-testid={`text-actual-${record.id}`}>
                        {record.actualQuantity}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${
                            record.discrepancy === 0
                              ? "text-green-600 dark:text-green-400"
                              : record.discrepancy > 0
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-red-600 dark:text-red-400"
                          }`}
                          data-testid={`text-discrepancy-${record.id}`}
                        >
                          {record.discrepancy > 0 ? "+" : ""}
                          {record.discrepancy}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(record.status, record.discrepancy)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {record.supplierInvoice || "—"}
                      </TableCell>
                      <TableCell data-testid={`text-date-${record.id}`}>
                        {formatDate(new Date(record.createdAt))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
