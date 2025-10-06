import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Package } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { ProductWithCategory } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface LowStockAlertProps {
  threshold?: number; // Порог низкого остатка (по умолчанию 5)
}

export default function LowStockAlert({ threshold = 5 }: LowStockAlertProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const { toast } = useToast();

  const { data: products = [] } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  // Фильтруем товары с низким остатком
  const lowStockProducts = products.filter(
    (product) => product.isActive && product.stock <= threshold && product.stock > 0
  );

  const outOfStockProducts = products.filter(
    (product) => product.isActive && product.stock === 0
  );

  // Показываем уведомление при обнаружении товаров с низким остатком
  useEffect(() => {
    if (lowStockProducts.length > 0 && !dismissed) {
      toast({
        title: "⚠️ Низкий остаток товаров",
        description: `${lowStockProducts.length} товаров с низким остатком на складе`,
        variant: "default",
      });
    }

    if (outOfStockProducts.length > 0 && !dismissed) {
      toast({
        title: "❌ Товары закончились",
        description: `${outOfStockProducts.length} товаров закончились на складе`,
        variant: "destructive",
      });
    }
  }, [lowStockProducts.length, outOfStockProducts.length]);

  if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) {
    return null;
  }

  if (dismissed) {
    return (
      <div className="fixed bottom-4 left-4 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setDismissed(false)}
          data-testid="show-stock-alerts"
        >
          <AlertTriangle className="w-4 h-4 mr-2 text-orange-500" />
          <Badge variant="destructive" className="ml-1">
            {lowStockProducts.length + outOfStockProducts.length}
          </Badge>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-md">
      <Card className="border-orange-200 dark:border-orange-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              Контроль остатков
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDismissed(true)}
              data-testid="dismiss-stock-alerts"
            >
              Скрыть
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {outOfStockProducts.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Товары закончились</AlertTitle>
              <AlertDescription>
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                  <div className="flex items-center justify-between">
                    <span>{outOfStockProducts.length} товаров</span>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm">
                        {isOpen ? "Скрыть" : "Показать"}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent className="mt-2 space-y-1">
                    {outOfStockProducts.slice(0, 5).map((product) => (
                      <div key={product.id} className="text-sm py-1">
                        • {product.name} ({product.sku})
                      </div>
                    ))}
                    {outOfStockProducts.length > 5 && (
                      <div className="text-sm text-muted-foreground">
                        и еще {outOfStockProducts.length - 5}...
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </AlertDescription>
            </Alert>
          )}

          {lowStockProducts.length > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Низкий остаток</AlertTitle>
              <AlertDescription>
                <div className="space-y-1 mt-2">
                  {lowStockProducts.slice(0, 3).map((product) => (
                    <div key={product.id} className="text-sm flex items-center justify-between">
                      <span>• {product.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {product.stock} шт
                      </Badge>
                    </div>
                  ))}
                  {lowStockProducts.length > 3 && (
                    <div className="text-sm text-muted-foreground">
                      и еще {lowStockProducts.length - 3} товаров
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="text-xs text-muted-foreground pt-1">
            Порог оповещения: {threshold} шт
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
