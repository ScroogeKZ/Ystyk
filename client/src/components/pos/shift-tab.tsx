import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Lock, Printer, Plus, Minus, CreditCard, Banknote, RotateCcw } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Shift, ShiftSummary, TransactionWithItems } from "@shared/schema";

const openShiftSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  startingCash: z.string().min(1, "Starting cash is required"),
});

const closeShiftSchema = z.object({
  endingCash: z.string().min(1, "Ending cash is required"),
});

export default function ShiftTab() {
  const [isOpenDialogOpen, setIsOpenDialogOpen] = useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock user ID - in real app this would come from auth context
  const currentUserId = "default-user-id";

  const { data: currentShift, isLoading } = useQuery<Shift>({
    queryKey: ["/api/shifts/current", currentUserId],
  });

  const { data: shiftSummary } = useQuery<ShiftSummary>({
    queryKey: ["/api/shifts", currentShift?.id, "summary"],
    enabled: !!currentShift?.id,
  });

  const { data: shiftTransactions = [] } = useQuery<TransactionWithItems[]>({
    queryKey: ["/api/transactions"],
    select: (data: TransactionWithItems[]) => currentShift ? data.filter((t) => t.shiftId === currentShift.id) : [],
    enabled: !!currentShift,
  });

  const openShiftMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/shifts", {
        userId: data.userId,
        startingCash: data.startingCash,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts/current", currentUserId] });
      setIsOpenDialogOpen(false);
      toast({
        title: "Успех",
        description: "Смена открыта",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const closeShiftMutation = useMutation({
    mutationFn: async (data: { endingCash: string }) => {
      if (!currentShift) throw new Error("No active shift");
      const response = await apiRequest("PUT", `/api/shifts/${currentShift.id}/close`, {
        endingCash: parseFloat(data.endingCash),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/shifts/current", currentUserId] });
      setIsCloseDialogOpen(false);
      toast({
        title: "Успех",
        description: "Смена закрыта",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const openForm = useForm({
    resolver: zodResolver(openShiftSchema),
    defaultValues: {
      userId: currentUserId,
      startingCash: "2000",
    },
  });

  const closeForm = useForm({
    resolver: zodResolver(closeShiftSchema),
    defaultValues: {
      endingCash: "",
    },
  });

  const onOpenSubmit = (data: any) => {
    openShiftMutation.mutate(data);
  };

  const onCloseSubmit = (data: any) => {
    closeShiftMutation.mutate(data);
  };

  const handlePrintReport = () => {
    // TODO: Implement shift report printing
    toast({
      title: "Печать отчета",
      description: "Функция печати отчета будет реализована",
    });
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6" data-testid="shift-tab">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Управление сменой</h1>
          <div className="flex gap-3">
            {currentShift && (
              <Button onClick={handlePrintReport} data-testid="print-shift-report">
                <Printer className="w-4 h-4 mr-2" />
                Отчет
              </Button>
            )}
            
            {currentShift ? (
              <Dialog open={isCloseDialogOpen} onOpenChange={setIsCloseDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" data-testid="close-shift-button">
                    <Lock className="w-4 h-4 mr-2" />
                    Закрыть смену
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Закрыть смену</DialogTitle>
                  </DialogHeader>
                  <Form {...closeForm}>
                    <form onSubmit={closeForm.handleSubmit(onCloseSubmit)} className="space-y-4">
                      <FormField
                        control={closeForm.control}
                        name="endingCash"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Остаток наличных в кассе</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                placeholder="0.00"
                                {...field} 
                                data-testid="input-ending-cash" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        variant="destructive"
                        disabled={closeShiftMutation.isPending}
                        data-testid="confirm-close-shift"
                      >
                        {closeShiftMutation.isPending ? "Закрытие..." : "Закрыть смену"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            ) : (
              <Dialog open={isOpenDialogOpen} onOpenChange={setIsOpenDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="open-shift-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Открыть смену
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Открыть новую смену</DialogTitle>
                  </DialogHeader>
                  <Form {...openForm}>
                    <form onSubmit={openForm.handleSubmit(onOpenSubmit)} className="space-y-4">
                      <FormField
                        control={openForm.control}
                        name="startingCash"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Начальная сумма в кассе</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                step="0.01" 
                                {...field} 
                                data-testid="input-starting-cash" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        disabled={openShiftMutation.isPending}
                        data-testid="confirm-open-shift"
                      >
                        {openShiftMutation.isPending ? "Открытие..." : "Открыть смену"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
        
        {!currentShift ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-card-foreground mb-2">Смена не открыта</h2>
                <p className="text-muted-foreground mb-6">
                  Для начала работы необходимо открыть смену
                </p>
                <Button onClick={() => setIsOpenDialogOpen(true)} data-testid="open-shift-cta">
                  <Plus className="w-4 h-4 mr-2" />
                  Открыть смену
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Shift Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="stat-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Статус смены</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800" data-testid="shift-status">
                      {currentShift.status === "open" ? "Открыта" : "Закрыта"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1" data-testid="shift-start-time">
                    Открыта в {currentShift.startTime.toLocaleTimeString('ru-RU', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="stat-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Касса на начало</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-card-foreground" data-testid="starting-cash">
                    ₽{parseFloat(currentShift.startingCash).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="stat-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Текущие продажи</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-primary" data-testid="current-sales">
                    ₽{shiftSummary?.totalSales || "0.00"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {shiftSummary?.totalTransactions || 0} транзакций
                  </p>
                </CardContent>
              </Card>
            </div>
            
            {/* Transactions Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-card-foreground">Транзакции смены</CardTitle>
              </CardHeader>
              <CardContent>
                {shiftTransactions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Транзакций пока нет</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shiftTransactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-border last:border-b-0" data-testid={`transaction-${transaction.id}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            transaction.status === "refunded" 
                              ? "bg-red-100 text-red-600" 
                              : transaction.paymentMethod === "cash"
                              ? "bg-green-100 text-green-600"
                              : "bg-blue-100 text-blue-600"
                          }`}>
                            {transaction.status === "refunded" ? (
                              <RotateCcw className="w-4 h-4" />
                            ) : transaction.paymentMethod === "cash" ? (
                              <Banknote className="w-4 h-4" />
                            ) : (
                              <CreditCard className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-card-foreground">
                              {transaction.status === "refunded" ? "Возврат" : "Продажа"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {transaction.createdAt.toLocaleTimeString('ru-RU', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.status === "refunded" ? "text-red-600" : "text-card-foreground"
                          }`}>
                            {transaction.status === "refunded" ? "-" : ""}₽{transaction.total}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {transaction.paymentMethod === "cash" ? "Наличные" : "Карта"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
