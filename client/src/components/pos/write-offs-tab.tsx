import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, AlertCircle, Calendar, TrendingDown, Package, CheckCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLanguage } from "@/i18n/LanguageContext";
import { useFormatters } from "@/i18n/utils";
import { useToast } from "@/hooks/use-toast";
import { useSessionStore } from "@/hooks/use-session-store";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertWriteOffSchema } from "@shared/schema";
import type { ProductWithCategory, WriteOffWithProduct } from "@shared/schema";
import { z } from "zod";

const writeOffFormSchema = insertWriteOffSchema.extend({
  productId: z.string().min(1, "Выберите товар"),
  quantity: z.number().min(1, "Количество должно быть положительным"),
}).omit({ createdBy: true, cost: true });

export default function WriteOffsTab() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterReason, setFilterReason] = useState<string>("all");
  const { t } = useLanguage();
  const { formatCurrency, formatDate } = useFormatters();
  const { toast } = useToast();
  const userId = useSessionStore((state) => state.userId);

  const { data: session } = useQuery<{ user?: { id: string; username: string; role: string } }>({
    queryKey: ["/api/auth/session"],
  });

  const isAdmin = session?.user?.role === "admin";

  const form = useForm<z.infer<typeof writeOffFormSchema>>({
    resolver: zodResolver(writeOffFormSchema),
    defaultValues: {
      productId: "",
      quantity: 1,
      reason: "expired",
      notes: "",
      approved: false,
    },
  });

  const { data: writeOffs = [], isLoading: isLoadingWriteOffs } = useQuery<WriteOffWithProduct[]>({
    queryKey: ["/api/write-offs"],
  });

  const { data: products = [] } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const writeOffMutation = useMutation({
    mutationFn: async (data: z.infer<typeof writeOffFormSchema>) => {
      const product = products.find((p) => p.id === data.productId);
      if (!product) {
        throw new Error("Товар не найден");
      }

      const cost = parseFloat(product.price) * data.quantity;

      const writeOffData = {
        ...data,
        createdBy: userId,
        cost: cost.toString(),
      };

      const response = await apiRequest("POST", "/api/write-offs", writeOffData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/write-offs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: t.common.success,
        description: "Списание успешно создано",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать списание",
        variant: "destructive",
      });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("PUT", `/api/write-offs/${id}/approve`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/write-offs"] });
      toast({
        title: t.common.success,
        description: "Списание одобрено",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось одобрить списание",
        variant: "destructive",
      });
    },
  });

  const reasonLabels = {
    expired: "Просрочен",
    damaged: "Поврежден",
    theft: "Кража",
    loss: "Потеря",
    defective: "Брак",
    other: "Другое",
  };

  const filteredWriteOffs = writeOffs.filter((writeOff) => {
    const matchesSearch =
      writeOff.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      writeOff.product?.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesReason = filterReason === "all" || writeOff.reason === filterReason;
    return matchesSearch && matchesReason;
  });

  const getReasonBadge = (reason: string) => {
    const colors: Record<string, string> = {
      expired: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100",
      damaged: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100",
      theft: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100",
      loss: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100",
      defective: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100",
      other: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100",
    };

    return (
      <Badge className={colors[reason] || colors.other} data-testid={`badge-reason-${reason}`}>
        {reasonLabels[reason as keyof typeof reasonLabels] || reason}
      </Badge>
    );
  };

  const totalWriteOffValue = writeOffs
    .filter((wo) => filterReason === "all" || wo.reason === filterReason)
    .reduce((sum, wo) => sum + parseFloat(wo.cost || "0"), 0);

  const todayWriteOffs = writeOffs.filter(
    (wo) => new Date(wo.createdAt).toDateString() === new Date().toDateString()
  ).length;

  const pendingApproval = writeOffs.filter((wo) => !wo.approved).length;

  const reasonCounts = writeOffs.reduce((acc, wo) => {
    acc[wo.reason] = (acc[wo.reason] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topReason =
    Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0] || [];
  const topReasonLabel = topReason[0]
    ? reasonLabels[topReason[0] as keyof typeof reasonLabels]
    : "N/A";
  const topReasonPercent = topReason[1]
    ? Math.round((topReason[1] / writeOffs.length) * 100)
    : 0;

  return (
    <div className="flex-1 p-6" data-testid="write-offs-tab">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Списания товаров</h1>
          <div className="flex gap-3">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-writeoff">
                  <Plus className="w-4 h-4 mr-2" />
                  Новое списание
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Списание товара</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit((data) => writeOffMutation.mutate(data))}
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
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Количество</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              data-testid="input-quantity"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
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
                              <SelectTrigger data-testid="select-reason">
                                <SelectValue placeholder="Выберите причину" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(reasonLabels).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
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
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Примечание</FormLabel>
                          <FormControl>
                            <Textarea
                              data-testid="input-notes"
                              {...field}
                              value={field.value || ""}
                              placeholder="Дополнительная информация..."
                            />
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
                        disabled={writeOffMutation.isPending}
                        className="flex-1"
                        data-testid="button-submit"
                      >
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
          <Card data-testid="card-today-writeoffs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Сегодня списано</CardTitle>
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingWriteOffs ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-today-count">
                    {todayWriteOffs}
                  </div>
                  <p className="text-xs text-muted-foreground">товарных позиций</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card data-testid="card-total-value">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Стоимость списаний</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingWriteOffs ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-red-600" data-testid="text-total-value">
                    {formatCurrency(totalWriteOffValue)}
                  </div>
                  <p className="text-xs text-muted-foreground">За текущий месяц</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card data-testid="card-pending-approval">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">На утверждении</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingWriteOffs ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-orange-600" data-testid="text-pending-count">
                    {pendingApproval}
                  </div>
                  <p className="text-xs text-muted-foreground">Ожидает подтверждения</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card data-testid="card-top-reason">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Основная причина</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingWriteOffs ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-top-reason">
                    {topReasonLabel}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {topReasonPercent}% от всех списаний
                  </p>
                </>
              )}
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
            data-testid="input-search"
          />
          <Select value={filterReason} onValueChange={setFilterReason}>
            <SelectTrigger className="w-48" data-testid="select-filter-reason">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все причины</SelectItem>
              {Object.entries(reasonLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Write-offs Table */}
        <Card data-testid="card-writeoffs-table">
          <CardHeader>
            <CardTitle>История списаний</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingWriteOffs ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
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
                    {isAdmin && <TableHead>Действия</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWriteOffs.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={isAdmin ? 8 : 7}
                        className="text-center text-muted-foreground"
                        data-testid="text-no-writeoffs"
                      >
                        Нет списаний
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredWriteOffs.map((writeOff) => (
                      <TableRow key={writeOff.id} data-testid={`row-writeoff-${writeOff.id}`}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-card-foreground" data-testid={`text-product-name-${writeOff.id}`}>
                              {writeOff.product?.name || "N/A"}
                            </p>
                            <p className="text-sm text-muted-foreground" data-testid={`text-product-sku-${writeOff.id}`}>
                              {writeOff.product?.sku || "N/A"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell data-testid={`text-quantity-${writeOff.id}`}>
                          {writeOff.quantity}
                        </TableCell>
                        <TableCell>{getReasonBadge(writeOff.reason)}</TableCell>
                        <TableCell className="font-semibold text-red-600" data-testid={`text-cost-${writeOff.id}`}>
                          {formatCurrency(parseFloat(writeOff.cost || "0"))}
                        </TableCell>
                        <TableCell>
                          {writeOff.approved ? (
                            <Badge
                              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                              data-testid={`badge-status-approved-${writeOff.id}`}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Утверждено
                            </Badge>
                          ) : (
                            <Badge variant="secondary" data-testid={`badge-status-pending-${writeOff.id}`}>
                              На рассмотрении
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell data-testid={`text-date-${writeOff.id}`}>
                          {formatDate(new Date(writeOff.createdAt))}
                        </TableCell>
                        <TableCell className="text-muted-foreground" data-testid={`text-created-by-${writeOff.id}`}>
                          {writeOff.createdByUser?.username || "N/A"}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            {!writeOff.approved && (
                              <Button
                                size="sm"
                                onClick={() => approveMutation.mutate(writeOff.id)}
                                disabled={approveMutation.isPending}
                                data-testid={`button-approve-${writeOff.id}`}
                              >
                                {approveMutation.isPending ? "..." : "Одобрить"}
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
