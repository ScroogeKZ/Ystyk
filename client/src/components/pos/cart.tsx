import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Minus, Plus, CreditCard, Banknote } from "lucide-react";
import { usePOSStore } from "@/hooks/use-pos-store";
import { useQuery } from "@tanstack/react-query";
import { useFormatters } from "@/i18n/utils";
import type { Customer } from "@shared/schema";

export default function Cart() {
  const { 
    cart,
    cartSummary,
    selectedCustomer, 
    setSelectedCustomer, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    openPaymentModal 
  } = usePOSStore();
  
  
  const { formatCurrency } = useFormatters();

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { subtotal, tax, total } = cartSummary;

  const handleCashPayment = () => {
    openPaymentModal("cash", total);
  };

  const handleCardPayment = () => {
    openPaymentModal("card", total);
  };

  return (
    <div className="w-full sm:w-96 bg-card sm:border-l border-border flex flex-col h-full" data-testid="cart">
      {/* Cart Header */}
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-card-foreground">Корзина</h2>
          {cart.length > 0 && (
            <Button
              variant="ghost"
              onClick={clearCart}
              className="text-destructive hover:text-destructive/80 touch-btn-sm"
              data-testid="clear-cart"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          )}
        </div>
        
        {/* Customer Selection */}
        <Select value={selectedCustomer || ""} onValueChange={setSelectedCustomer}>
          <SelectTrigger data-testid="customer-select">
            <SelectValue placeholder="Новый покупатель" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Новый покупатель</SelectItem>
            {customers.map((customer) => (
              <SelectItem key={customer.id} value={customer.id}>
                {customer.name} ({customer.phone})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {/* Cart Items */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <p className="text-muted-foreground">Корзина пуста</p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="cart-item flex-wrap sm:flex-nowrap gap-2 sm:gap-3" data-testid={`cart-item-${item.id}`}>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-card-foreground text-sm sm:text-base md:text-lg mb-1 truncate">{item.name}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground">{formatCurrency(parseFloat(item.price))}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="touch-btn-sm h-8 w-8 p-0 sm:h-9 sm:w-9"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    data-testid={`decrease-${item.id}`}
                  >
                    <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                  <span className="w-8 sm:w-10 text-center font-medium text-sm sm:text-base" data-testid={`quantity-${item.id}`}>
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="touch-btn-sm h-8 w-8 p-0 sm:h-9 sm:w-9"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    data-testid={`increase-${item.id}`}
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
                <div className="w-16 sm:w-20 text-right font-bold text-card-foreground text-sm sm:text-base md:text-lg">
                  {formatCurrency(parseFloat(item.price) * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Cart Summary */}
      {cart.length > 0 && (
        <div className="p-4 sm:p-6 border-t border-border">
          <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
            <div className="flex justify-between text-card-foreground text-sm sm:text-base">
              <span>Подытог:</span>
              <span data-testid="subtotal">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-card-foreground text-sm sm:text-base">
              <span>Налог:</span>
              <span data-testid="tax">{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-lg sm:text-xl font-bold border-t border-border pt-2 sm:pt-3 text-card-foreground">
              <span>Итого:</span>
              <span data-testid="total">{formatCurrency(total)}</span>
            </div>
          </div>
          
          {/* Payment Buttons */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <Button
              className="payment-btn bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base py-2 sm:py-3"
              onClick={handleCashPayment}
              data-testid="cash-payment"
            >
              <Banknote className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
              <span className="hidden sm:inline">Наличные</span>
              <span className="sm:hidden">Нал</span>
            </Button>
            <Button
              className="payment-btn bg-blue-600 hover:bg-blue-700 text-white text-sm sm:text-base py-2 sm:py-3"
              onClick={handleCardPayment}
              data-testid="card-payment"
            >
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 sm:mr-2" />
              <span className="sm:inline">Карта</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
