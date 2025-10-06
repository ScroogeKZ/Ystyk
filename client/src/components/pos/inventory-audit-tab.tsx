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
import { Plus, Search, FileText, AlertTriangle, CheckCircle, Calculator, Package } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLanguage } from "@/i18n/LanguageContext";
import { useFormatters } from "@/i18n/utils";
import { useToast } from "@/hooks/use-toast";
import { useSessionStore } from "@/hooks/use-session-store";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { insertInventoryAuditSchema, insertInventoryAuditItemSchema } from "@shared/schema";
import type { ProductWithCategory, InventoryAuditWithItems } from "@shared/schema";
import { z } from "zod";

const auditFormSchema = insertInventoryAuditSchema.extend({
  name: z.string().min(1, "Название инвентаризации обязательно"),
}).omit({ createdBy: true });

const auditItemFormSchema = insertInventoryAuditItemSchema.extend({
  productId: z.string().min(1, "Выберите товар"),
  expectedQuantity: z.number().min(0, "Ожидаемое количество не может быть отрицательным"),
  actualQuantity: z.number().min(0, "Фактическое количество не может быть отрицательным"),
}).omit({ auditId: true, variance: true });

export default function InventoryAuditTab() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<string | null>(null);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useLanguage();
  const { formatCurrency, formatDate } = useFormatters();
  const { toast } = useToast();
  const userId = useSessionStore((state) => state.userId);

  const auditForm = useForm<z.infer<typeof auditFormSchema>>({
    resolver: zodResolver(auditFormSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "draft",
    },
  });

  const itemForm = useForm<z.infer<typeof auditItemFormSchema>>({
    resolver: zodResolver(auditItemFormSchema),
    defaultValues: {
      productId: "",
      expectedQuantity: 0,
      actualQuantity: 0,
      status: "pending",
      notes: "",
    },
  });

  const { data: audits = [], isLoading: isLoadingAudits } = useQuery<InventoryAuditWithItems[]>({
    queryKey: ["/api/inventory-audits"],
  });

  const { data: selectedAuditData } = useQuery<InventoryAuditWithItems>({
    queryKey: ["/api/inventory-audits", selectedAudit],
    enabled: !!selectedAudit,
  });

  const { data: products = [] } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const createAuditMutation = useMutation({
    mutationFn: async (data: z.infer<typeof auditFormSchema>) => {
      const auditData = {
        ...data,
        createdBy: userId,
      };
      const response = await apiRequest("POST", "/api/inventory-audits", auditData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-audits"] });
      setIsAddDialogOpen(false);
      auditForm.reset();
      toast({
        title: t.common.success,
        description: "Инвентаризация успешно создана",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось создать инвентаризацию",
        variant: "destructive",
      });
    },
  });

  const addAuditItemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof auditItemFormSchema>) => {
      if (!selectedAudit) throw new Error("Audit not selected");
      
      const variance = data.actualQuantity - data.expectedQuantity;
      const itemData = {
        ...data,
        variance,
      };
      
      const response = await apiRequest("POST", `/api/inventory-audits/${selectedAudit}/items`, itemData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-audits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-audits", selectedAudit] });
      setIsItemDialogOpen(false);
      itemForm.reset();
      toast({
        title: t.common.success,
        description: "Товар добавлен в инвентаризацию",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось добавить товар",
        variant: "destructive",
      });
    },
  });

  const updateAuditStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const completedAt = status === "completed" ? new Date().toISOString() : undefined;
      const response = await apiRequest("PUT", `/api/inventory-audits/${id}/status`, { 
        status, 
        completedAt 
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory-audits"] });
      toast({
        title: t.common.success,
        description: "Статус инвентаризации обновлен",
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

  const filteredAudits = audits.filter((audit) => {
    const searchLower = searchTerm.toLowerCase();
    return audit.name.toLowerCase().includes(searchLower);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" data-testid={`badge-status-completed`}>
            <CheckCircle className="w-3 h-3 mr-1" />
            Завершена
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100" data-testid={`badge-status-in-progress`}>
            <Calculator className="w-3 h-3 mr-1" />
            В процессе
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="outline" data-testid={`badge-status-draft`}>
            Черновик
          </Badge>
        );
      default:
        return (
          <Badge variant="destructive" data-testid={`badge-status-cancelled`}>
            Отменена
          </Badge>
        );
    }
  };

  const activeAudits = audits.filter(a => a.status === "in_progress").length;
  const totalItemsToCheck = audits
    .filter(a => a.status === "in_progress")
    .reduce((sum, a) => sum + (a.totalItems - a.countedItems), 0);
  const totalVariance = audits
    .filter(a => a.status === "completed")
    .reduce((sum, a) => sum + a.totalVariance, 0);
  const completedAudits = audits.filter(a => a.status === "completed");
  const accuracy = completedAudits.length > 0
    ? (completedAudits.reduce((sum, a) => {
        const itemsWithoutVariance = a.items?.filter(i => i.variance === 0).length || 0;
        return sum + (a.totalItems > 0 ? (itemsWithoutVariance / a.totalItems) : 0);
      }, 0) / completedAudits.length) * 100
    : 0;

  return (
    <div className="flex-1 p-6" data-testid="inventory-audit-tab">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Инвентаризация</h1>
          <div className="flex gap-3">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-audit">
                  <Plus className="w-4 h-4 mr-2" />
                  Новая инвентаризация
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Создать инвентаризацию</DialogTitle>
                </DialogHeader>
                <Form {...auditForm}>
                  <form
                    onSubmit={auditForm.handleSubmit((data) => createAuditMutation.mutate(data))}
                    className="space-y-4"
                  >
                    <FormField
                      control={auditForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название инвентаризации</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Например: Ежемесячная проверка" data-testid="input-audit-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={auditForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Описание (опционально)</FormLabel>
                          <FormControl>
                            <Textarea {...field} value={field.value || ""} placeholder="Описание инвентаризации" data-testid="input-audit-description" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1" data-testid="button-cancel-audit">
                        {t.common.cancel}
                      </Button>
                      <Button type="submit" disabled={createAuditMutation.isPending} className="flex-1" data-testid="button-submit-audit">
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
              {isLoadingAudits ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-active-audits">{activeAudits}</div>
                  <p className="text-xs text-muted-foreground">В процессе</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Товаров к проверке</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingAudits ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <div className="text-2xl font-bold" data-testid="text-items-to-check">{totalItemsToCheck}</div>
                  <p className="text-xs text-muted-foreground">Осталось проверить</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Общие расхождения</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingAudits ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className={`text-2xl font-bold ${totalVariance < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} data-testid="text-total-variance">
                    {totalVariance > 0 ? '+' : ''}{formatCurrency(Math.abs(totalVariance))}
                  </div>
                  <p className="text-xs text-muted-foreground">За все завершенные</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Точность инвентаризации</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoadingAudits ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-accuracy">
                    {accuracy.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Средняя точность</p>
                </>
              )}
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
            data-testid="input-search-audits"
          />
        </div>

        {/* Audits Table */}
        <Card>
          <CardHeader>
            <CardTitle>Список инвентаризаций</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAudits ? (
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filteredAudits.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-audits">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Инвентаризации не найдены</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Название</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Прогресс</TableHead>
                    <TableHead>Расхождения</TableHead>
                    <TableHead>Создана</TableHead>
                    <TableHead>Действия</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAudits.map((audit) => (
                    <TableRow key={audit.id} data-testid={`row-audit-${audit.id}`}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-card-foreground" data-testid={`text-audit-name-${audit.id}`}>
                            {audit.name}
                          </p>
                          {audit.description && (
                            <p className="text-sm text-muted-foreground" data-testid={`text-audit-description-${audit.id}`}>
                              {audit.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(audit.status)}</TableCell>
                      <TableCell>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full"
                            style={{ width: `${audit.totalItems > 0 ? (audit.countedItems / audit.totalItems) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1" data-testid={`text-audit-progress-${audit.id}`}>
                          {audit.countedItems} / {audit.totalItems}
                        </p>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${
                            audit.totalVariance === 0
                              ? "text-green-600 dark:text-green-400"
                              : audit.totalVariance > 0
                              ? "text-blue-600 dark:text-blue-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                          data-testid={`text-audit-variance-${audit.id}`}
                        >
                          {audit.totalVariance > 0 ? "+" : ""}
                          {formatCurrency(Math.abs(audit.totalVariance))}
                        </span>
                      </TableCell>
                      <TableCell data-testid={`text-audit-created-${audit.id}`}>
                        {formatDate(new Date(audit.createdAt))}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setSelectedAudit(audit.id)}
                            data-testid={`button-view-audit-${audit.id}`}
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                          {audit.status === "draft" && (
                            <Button
                              size="sm"
                              onClick={() =>
                                updateAuditStatusMutation.mutate({ id: audit.id, status: "in_progress" })
                              }
                              disabled={updateAuditStatusMutation.isPending}
                              data-testid={`button-start-audit-${audit.id}`}
                            >
                              Начать
                            </Button>
                          )}
                          {audit.status === "in_progress" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedAudit(audit.id);
                                  setIsItemDialogOpen(true);
                                }}
                                data-testid={`button-add-item-${audit.id}`}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Товар
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  updateAuditStatusMutation.mutate({ id: audit.id, status: "completed" })
                                }
                                disabled={updateAuditStatusMutation.isPending}
                                data-testid={`button-complete-audit-${audit.id}`}
                              >
                                Завершить
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add Item Dialog */}
        <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Добавить товар в инвентаризацию</DialogTitle>
            </DialogHeader>
            <Form {...itemForm}>
              <form
                onSubmit={itemForm.handleSubmit((data) => addAuditItemMutation.mutate(data))}
                className="space-y-4"
              >
                <FormField
                  control={itemForm.control}
                  name="productId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Товар</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-item-product">
                            <SelectValue placeholder="Выберите товар" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} ({product.sku}) - Запас: {product.stock}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={itemForm.control}
                  name="expectedQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ожидаемое количество</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-item-expected-quantity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={itemForm.control}
                  name="actualQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Фактическое количество</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-item-actual-quantity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={itemForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Примечания (опционально)</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ""} placeholder="Дополнительные заметки" data-testid="input-item-notes" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsItemDialogOpen(false);
                      itemForm.reset();
                    }}
                    className="flex-1"
                    data-testid="button-cancel-item"
                  >
                    {t.common.cancel}
                  </Button>
                  <Button
                    type="submit"
                    disabled={addAuditItemMutation.isPending}
                    className="flex-1"
                    data-testid="button-submit-item"
                  >
                    {addAuditItemMutation.isPending ? "Добавление..." : "Добавить"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Audit Details Dialog */}
        {selectedAuditData && (
          <Dialog open={!!selectedAudit && !isItemDialogOpen} onOpenChange={(open) => !open && setSelectedAudit(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{selectedAuditData.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedAuditData.description && (
                  <p className="text-sm text-muted-foreground">{selectedAuditData.description}</p>
                )}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium">Статус</p>
                    <div className="mt-1">{getStatusBadge(selectedAuditData.status)}</div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Прогресс</p>
                    <p className="mt-1" data-testid="text-detail-progress">
                      {selectedAuditData.countedItems} / {selectedAuditData.totalItems}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Расхождения</p>
                    <p className="mt-1 font-medium" data-testid="text-detail-variance">
                      {selectedAuditData.totalVariance > 0 ? '+' : ''}
                      {formatCurrency(Math.abs(selectedAuditData.totalVariance))}
                    </p>
                  </div>
                </div>
                {selectedAuditData.items && selectedAuditData.items.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2">Товары</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Товар</TableHead>
                          <TableHead>Ожидается</TableHead>
                          <TableHead>Фактически</TableHead>
                          <TableHead>Расхождение</TableHead>
                          <TableHead>Статус</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedAuditData.items.map((item) => (
                          <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                            <TableCell data-testid={`text-item-name-${item.id}`}>
                              {item.product?.name || "Unknown"}
                            </TableCell>
                            <TableCell data-testid={`text-item-expected-${item.id}`}>
                              {item.expectedQuantity}
                            </TableCell>
                            <TableCell data-testid={`text-item-actual-${item.id}`}>
                              {item.actualQuantity}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`font-medium ${
                                  item.variance === 0
                                    ? "text-green-600 dark:text-green-400"
                                    : item.variance > 0
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                                data-testid={`text-item-variance-${item.id}`}
                              >
                                {item.variance > 0 ? "+" : ""}
                                {item.variance}
                              </span>
                            </TableCell>
                            <TableCell data-testid={`badge-item-status-${item.id}`}>
                              {item.status === "verified" ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                  Проверено
                                </Badge>
                              ) : item.status === "counted" ? (
                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                                  Подсчитано
                                </Badge>
                              ) : (
                                <Badge variant="outline">Ожидает</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
