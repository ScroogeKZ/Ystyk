import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Minus, Plus, CreditCard, Banknote } from "lucide-react";
import { usePOSStore } from "@/hooks/use-pos-store";
import { useQuery } from "@tanstack/react-query";
import type { Customer } from "@shared/schema";

export default function Cart() {
  const { 
    cart, 
    selectedCustomer, 
    setSelectedCustomer, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    openPaymentModal 
  } = usePOSStore();

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.1; // 10% tax
  const total = subtotal + tax;

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
              size="sm"
              onClick={clearCart}
              className="text-destructive hover:text-destructive/80"
              data-testid="clear-cart"
            >
              <Trash2 className="w-4 h-4" />
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
          <div className="space-y-3">
            {cart.map((item) => (
              <div key={item.id} className="cart-item" data-testid={`cart-item-${item.id}`}>
                <div className="flex-1">
                  <h4 className="font-medium text-card-foreground">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">₽{item.price}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    data-testid={`decrease-${item.id}`}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-8 text-center font-medium" data-testid={`quantity-${item.id}`}>
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    data-testid={`increase-${item.id}`}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
                <div className="w-16 text-right font-bold text-card-foreground">
                  ₽{(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Cart Summary */}
      {cart.length > 0 && (
        <div className="p-6 border-t border-border">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-card-foreground">
              <span>Подытог:</span>
              <span data-testid="subtotal">₽{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-card-foreground">
              <span>Налог:</span>
              <span data-testid="tax">₽{tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xl font-bold border-t border-border pt-2 text-card-foreground">
              <span>Итого:</span>
              <span data-testid="total">₽{total.toFixed(2)}</span>
            </div>
          </div>
          
          {/* Payment Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              className="payment-btn bg-green-600 hover:bg-green-700 text-white"
              onClick={handleCashPayment}
              data-testid="cash-payment"
            >
              <Banknote className="w-4 h-4 mr-2" />
              Наличные
            </Button>
            <Button
              className="payment-btn bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleCardPayment}
              data-testid="card-payment"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Карта
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
