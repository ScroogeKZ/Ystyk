import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Lock, Printer, Plus, Minus, CreditCard, Banknote, RotateCcw, FileSpreadsheet, FileText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import jsPDF from "jspdf";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSessionStore } from "@/hooks/use-session-store";
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

  // Get user ID and current shift from session store
  const currentUserId = useSessionStore((state) => state.userId);
  const currentShift = useSessionStore((state) => state.currentShift);

  const { isLoading } = useQuery<Shift>({
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

  const handleExportExcel = async () => {
    if (!currentShift) {
      toast({
        title: "Ошибка",
        description: "Нет активной смены",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/shifts/${currentShift.id}/export/excel`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to export');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shift_report_${new Date(currentShift.startTime).toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Успех",
        description: "Отчет экспортирован в Excel",
      });
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось экспортировать отчет",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = async () => {
    if (!currentShift) {
      toast({
        title: "Ошибка",
        description: "Нет активной смены",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/shifts/${currentShift.id}/export/csv`, {
        credentials: 'include',
      });
      
      if (!response.ok) throw new Error('Failed to export');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shift_report_${new Date(currentShift.startTime).toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Успех",
        description: "Отчет экспортирован в CSV",
      });
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось экспортировать отчет",
        variant: "destructive",
      });
    }
  };

  const handlePrintReport = () => {
    if (!currentShift || !shiftSummary) {
      toast({
        title: "Ошибка",
        description: "Нет данных для печати отчета",
        variant: "destructive",
      });
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let yPos = 20;

      doc.setFontSize(18);
      doc.text("ОТЧЕТ О СМЕНЕ", pageWidth / 2, yPos, { align: "center" });
      yPos += 15;

      doc.setFontSize(10);

      const startTime = new Date(currentShift.startTime).toLocaleString("ru-RU");
      const endTime = currentShift.endTime 
        ? new Date(currentShift.endTime).toLocaleString("ru-RU")
        : "Смена открыта";

      doc.text(`Дата начала: ${startTime}`, 20, yPos);
      yPos += 7;
      doc.text(`Дата окончания: ${endTime}`, 20, yPos);
      yPos += 7;
      doc.text(`Статус: ${currentShift.status === "open" ? "Открыта" : "Закрыта"}`, 20, yPos);
      yPos += 15;

      doc.setFontSize(14);
      doc.text("ФИНАНСОВАЯ ИНФОРМАЦИЯ", 20, yPos);
      yPos += 10;

      doc.setFontSize(10);
      doc.text(`Касса на начало: ₸${parseFloat(currentShift.startingCash).toFixed(2)}`, 20, yPos);
      yPos += 7;
      
      if (currentShift.endingCash) {
        doc.text(`Касса на конец: ₸${parseFloat(currentShift.endingCash).toFixed(2)}`, 20, yPos);
        yPos += 7;
      }

      doc.text(`Всего продаж: ₸${shiftSummary.totalSales}`, 20, yPos);
      yPos += 7;
      doc.text(`Количество транзакций: ${shiftSummary.totalTransactions}`, 20, yPos);
      yPos += 7;
      doc.text(`Продажи наличными: ₸${shiftSummary.cashSales}`, 20, yPos);
      yPos += 7;
      doc.text(`Продажи картой: ₸${shiftSummary.cardSales}`, 20, yPos);
      yPos += 15;

      if (currentShift.endingCash) {
        const expected = parseFloat(currentShift.startingCash) + parseFloat(shiftSummary.cashSales);
        const actual = parseFloat(currentShift.endingCash);
        const difference = actual - expected;

        doc.text(`Ожидаемая касса: ₸${expected.toFixed(2)}`, 20, yPos);
        yPos += 7;
        doc.text(`Фактическая касса: ₸${actual.toFixed(2)}`, 20, yPos);
        yPos += 7;
        
        doc.setTextColor(difference >= 0 ? 0 : 255, difference >= 0 ? 128 : 0, 0);
        doc.text(`Разница: ₸${difference.toFixed(2)}`, 20, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 15;
      }

      if (shiftTransactions.length > 0) {
        doc.setFontSize(14);
        doc.text("ТРАНЗАКЦИИ", 20, yPos);
        yPos += 10;

        doc.setFontSize(9);

        shiftTransactions.forEach((transaction, index) => {
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }

          const time = new Date(transaction.createdAt).toLocaleTimeString("ru-RU", {
            hour: "2-digit",
            minute: "2-digit",
          });
          const amount = transaction.status === "refunded" 
            ? `-₸${transaction.total}` 
            : `₸${transaction.total}`;
          const method = transaction.paymentMethod === "cash" ? "Наличные" : "Карта";
          const status = transaction.status === "refunded" ? "Возврат" : "Продажа";

          doc.text(`${index + 1}. ${time} - ${status} - ${method} - ${amount}`, 20, yPos);
          yPos += 6;
        });
      }

      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Отчет сформирован: ${new Date().toLocaleString("ru-RU")}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );

      const fileName = `shift_report_${new Date(currentShift.startTime).toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);

      toast({
        title: "Успех",
        description: "Отчет о смене загружен",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось создать отчет",
        variant: "destructive",
      });
    }
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
              <>
                <Button onClick={handlePrintReport} data-testid="print-shift-report">
                  <Printer className="w-4 h-4 mr-2" />
                  PDF
                </Button>
                <Button onClick={handleExportExcel} variant="outline" data-testid="export-excel">
                  <FileSpreadsheet className="w-4 h-4 mr-2" />
                  Excel
                </Button>
                <Button onClick={handleExportCSV} variant="outline" data-testid="export-csv">
                  <FileText className="w-4 h-4 mr-2" />
                  CSV
                </Button>
              </>
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
                    Открыта в {new Date(currentShift.startTime).toLocaleTimeString('ru-RU', { 
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
                    ₸{parseFloat(currentShift.startingCash).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="stat-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Текущие продажи</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xl font-bold text-primary" data-testid="current-sales">
                    ₸{shiftSummary?.totalSales || "0.00"}
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
                              {new Date(transaction.createdAt).toLocaleTimeString('ru-RU', { 
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
                            {transaction.status === "refunded" ? "-" : ""}₸{transaction.total}
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
