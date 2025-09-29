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
    <div className="w-96 bg-card border-l border-border flex flex-col" data-testid="cart">
      {/* Cart Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-card-foreground">Корзина</h2>
          {cart.length > 0 && (
            <Button
              variant="ghost"
              onClick={clearCart}
              className="text-destructive hover:text-destructive/80 touch-btn-sm"
              data-testid="clear-cart"
            >
              <Trash2 className="w-5 h-5" />
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
      <div className="flex-1 p-6 overflow-y-auto">
        {cart.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Корзина пуста</p>
          </div>
        ) : (
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="cart-item" data-testid={`cart-item-${item.id}`}>
                <div className="flex-1">
                  <h4 className="font-medium text-card-foreground text-lg mb-1">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">{formatCurrency(parseFloat(item.price))}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    className="touch-btn-sm"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    data-testid={`decrease-${item.id}`}
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  <span className="w-10 text-center font-medium text-lg" data-testid={`quantity-${item.id}`}>
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    className="touch-btn-sm"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    data-testid={`increase-${item.id}`}
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                <div className="w-20 text-right font-bold text-card-foreground text-lg">
                  {formatCurrency(parseFloat(item.price) * item.quantity)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Cart Summary */}
      {cart.length > 0 && (
        <div className="p-6 border-t border-border">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-card-foreground text-lg">
              <span>Подытог:</span>
              <span data-testid="subtotal">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-card-foreground text-lg">
              <span>Налог:</span>
              <span data-testid="tax">{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t border-border pt-3 text-card-foreground">
              <span>Итого:</span>
              <span data-testid="total">{formatCurrency(total)}</span>
            </div>
          </div>
          
          {/* Payment Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              className="payment-btn bg-green-600 hover:bg-green-700 text-white"
              onClick={handleCashPayment}
              data-testid="cash-payment"
            >
              <Banknote className="w-5 h-5 mr-3" />
              Наличные
            </Button>
            <Button
              className="payment-btn bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleCardPayment}
              data-testid="card-payment"
            >
              <CreditCard className="w-5 h-5 mr-3" />
              Карта
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
