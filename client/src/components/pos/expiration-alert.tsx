import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, X } from "lucide-react";
import type { ProductWithCategory } from "@shared/schema";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ru } from "date-fns/locale";

export default function ExpirationAlert() {
  const [dismissed, setDismissed] = useState(false);

  const { data: allExpiringProducts = [] } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products/expiring"],
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });

  // Filter products expiring within 7 days
  const criticalProducts = allExpiringProducts.filter(p => {
    if (!p.expirationDate) return false;
    const expDate = new Date(p.expirationDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7;
  });

  if (dismissed || criticalProducts.length === 0) {
    return null;
  }

  const expiredProducts = criticalProducts.filter(p => {
    const expDate = new Date(p.expirationDate!);
    return expDate < new Date();
  });

  const expiringProducts = criticalProducts.filter(p => {
    const expDate = new Date(p.expirationDate!);
    return expDate >= new Date();
  });

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md" data-testid="expiration-alert">
      <Alert variant="destructive" className="relative pr-10">
        <AlertTriangle className="h-4 w-4" />
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={() => setDismissed(true)}
          data-testid="dismiss-alert"
        >
          <X className="h-4 w-4" />
        </Button>
        <AlertTitle>Внимание! Просроченные товары</AlertTitle>
        <AlertDescription className="mt-2">
          {expiredProducts.length > 0 && (
            <div className="mb-2">
              <p className="font-semibold text-destructive">
                Просрочено ({expiredProducts.length}):
              </p>
              <ul className="mt-1 space-y-1">
                {expiredProducts.slice(0, 3).map((product) => (
                  <li key={product.id} className="text-sm">
                    • {product.name} (
                    {format(new Date(product.expirationDate!), "dd.MM.yyyy", { locale: ru })})
                  </li>
                ))}
                {expiredProducts.length > 3 && (
                  <li className="text-sm italic">
                    и ещё {expiredProducts.length - 3}...
                  </li>
                )}
              </ul>
            </div>
          )}
          {expiringProducts.length > 0 && (
            <div>
              <p className="font-semibold">
                Истекает в ближайшие 7 дней ({expiringProducts.length}):
              </p>
              <ul className="mt-1 space-y-1">
                {expiringProducts.slice(0, 3).map((product) => {
                  const expDate = new Date(product.expirationDate!);
                  const daysLeft = Math.ceil((expDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <li key={product.id} className="text-sm">
                      • {product.name} (через {daysLeft} {daysLeft === 1 ? "день" : daysLeft < 5 ? "дня" : "дней"})
                    </li>
                  );
                })}
                {expiringProducts.length > 3 && (
                  <li className="text-sm italic">
                    и ещё {expiringProducts.length - 3}...
                  </li>
                )}
              </ul>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
