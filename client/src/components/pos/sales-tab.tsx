import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePOSStore } from "@/hooks/use-pos-store";
import ProductGrid from "@/components/pos/product-grid";
import Cart from "@/components/pos/cart";
import KeyboardShortcutsHelp from "@/components/pos/keyboard-shortcuts-help";
import { useKeyboardShortcuts, POS_SHORTCUTS } from "@/hooks/use-keyboard-shortcuts";
import { useToast } from "@/hooks/use-toast";

export default function SalesTab() {
  const [cartOpen, setCartOpen] = useState(false);
  const isMobile = useIsMobile();
  const { cart, clearCart, openPaymentModal } = usePOSStore();
  const { toast } = useToast();

  // Calculate total
  const total = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

  // Keyboard shortcuts
  const [showHelp, setShowHelp] = useState(false);

  useKeyboardShortcuts([
    {
      key: POS_SHORTCUTS.HELP,
      description: "Показать справку по горячим клавишам",
      action: () => {
        setShowHelp(true);
      },
    },
    {
      key: POS_SHORTCUTS.OPEN_PAYMENT,
      description: "Инициировать оплату",
      action: () => {
        if (cart.length > 0) {
          openPaymentModal('cash', total);
        } else {
          toast({
            title: "Корзина пуста",
            description: "Добавьте товары для оплаты",
            variant: "destructive",
          });
        }
      },
      enabled: cart.length > 0,
    },
    {
      key: POS_SHORTCUTS.CLEAR_CART,
      description: "Очистить корзину",
      action: () => {
        if (cart.length > 0) {
          clearCart();
          toast({
            title: "Корзина очищена",
            description: "Все товары удалены из корзины",
          });
        }
      },
      enabled: cart.length > 0,
    },
    {
      key: POS_SHORTCUTS.CANCEL,
      description: "Отмена/закрыть модальное окно",
      action: () => {
        if (showHelp) {
          setShowHelp(false);
        } else if (cartOpen) {
          setCartOpen(false);
        }
      },
    },
  ]);

  if (isMobile) {
    return (
      <div className="flex-1 flex flex-col relative" data-testid="sales-tab">
        <div className="absolute top-4 right-4 z-30">
          <KeyboardShortcutsHelp open={showHelp} onOpenChange={setShowHelp} />
        </div>
        <ProductGrid />
        
        {/* Mobile Cart Button */}
        <div className="fixed bottom-4 right-4 z-40">
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button size="lg" className="rounded-full h-14 w-14 shadow-lg relative" data-testid="mobile-cart-trigger">
                <ShoppingCart className="w-6 h-6" />
                {cart.length > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center p-0">
                    {cart.length}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-96 p-0">
              <Cart />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex relative" data-testid="sales-tab">
      <div className="absolute top-4 right-4 z-30">
        <KeyboardShortcutsHelp open={showHelp} onOpenChange={setShowHelp} />
      </div>
      <ProductGrid />
      <Cart />
    </div>
  );
}
