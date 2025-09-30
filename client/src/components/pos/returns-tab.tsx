import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, RotateCcw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSessionStore } from "@/hooks/use-session-store";
import type { TransactionWithItems, Return, Transaction } from "@shared/schema";

type ReturnWithTransaction = Return & { originalTransaction: Transaction };

export default function ReturnsTab() {
  const [receiptNumber, setReceiptNumber] = useState("");
  const [foundTransaction, setFoundTransaction] = useState<TransactionWithItems | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: returns = [] } = useQuery<ReturnWithTransaction[]>({
    queryKey: ["/api/returns"],
  });

  const searchTransactionMutation = useMutation({
    mutationFn: async (receiptNumber: string) => {
      const response = await apiRequest("GET", `/api/transactions/receipt/${receiptNumber}`);
      return response.json();
    },
    onSuccess: (data) => {
      setFoundTransaction(data);
      toast({
        title: "Найдено",
        description: "Транзакция найдена",
      });
    },
    onError: () => {
      setFoundTransaction(null);
      toast({
        title: "Не найдено",
        description: "Транзакция с таким номером чека не найдена",
        variant: "destructive",
      });
    },
  });

  const createReturnMutation = useMutation({
    mutationFn: async ({ returnData, items }: any) => {
      const response = await apiRequest("POST", "/api/returns", { returnData, items });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/returns"] });
      setFoundTransaction(null);
      setReceiptNumber("");
      toast({
        title: "Успех",
        description: "Возврат оформлен",
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

  const handleSearch = () => {
    if (receiptNumber.trim()) {
      searchTransactionMutation.mutate(receiptNumber.trim());
    }
  };

  const handleReturn = () => {
    if (!foundTransaction) return;

    const userId = useSessionStore.getState().userId;
    if (!userId) {
      toast({
        title: "Ошибка",
        description: "Требуется вход в систему",
        variant: "destructive",
      });
      return;
    }

    const returnData = {
      originalTransactionId: foundTransaction.id,
      userId,
      reason: "Customer return",
      refundAmount: foundTransaction.total,
      refundMethod: foundTransaction.paymentMethod,
    };

    const items = foundTransaction.items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    }));

    createReturnMutation.mutate({ returnData, items });
  };

  return (
    <div className="flex-1 p-6" data-testid="returns-tab">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-foreground">Возвраты и отмены</h1>
        
        {/* Search Receipt */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground">Поиск чека для возврата</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Номер чека..."
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="flex-1"
                data-testid="receipt-search"
              />
              <Button 
                onClick={handleSearch}
                disabled={searchTransactionMutation.isPending}
                data-testid="search-receipt"
              >
                <Search className="w-4 h-4 mr-2" />
                {searchTransactionMutation.isPending ? "Поиск..." : "Найти"}
              </Button>
            </div>
            
            {/* Found Transaction */}
            {foundTransaction && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-card-foreground">Чек #{foundTransaction.receiptNumber}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(foundTransaction.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-card-foreground">₸{foundTransaction.total}</p>
                    <Badge variant="secondary">{foundTransaction.paymentMethod === "cash" ? "Наличные" : "Карта"}</Badge>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  {foundTransaction.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-card-foreground">{item.product.name} × {item.quantity}</span>
                      <span className="text-card-foreground">₸{item.totalPrice}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={handleReturn}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  disabled={createReturnMutation.isPending}
                  data-testid="process-return"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {createReturnMutation.isPending ? "Оформление..." : "Оформить возврат"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Recent Returns */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-card-foreground">История возвратов</CardTitle>
          </CardHeader>
          <CardContent>
            {returns.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Возвратов пока нет</p>
              </div>
            ) : (
              <div className="space-y-4">
                {returns.map((returnItem) => (
                  <div key={returnItem.id} className="flex items-center justify-between p-4 bg-muted rounded-lg" data-testid={`return-${returnItem.id}`}>
                    <div>
                      <p className="font-medium text-card-foreground">Чек #{returnItem.originalTransaction.receiptNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(returnItem.createdAt).toLocaleString('ru-RU')}
                      </p>
                      <p className="text-sm text-muted-foreground">{returnItem.reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-red-600">-₸{returnItem.refundAmount}</p>
                      <Badge variant="destructive">Возврат</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
