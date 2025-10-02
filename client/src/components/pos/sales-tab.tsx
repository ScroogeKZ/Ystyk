import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePOSStore } from "@/hooks/use-pos-store";
import ProductGrid from "@/components/pos/product-grid";
import Cart from "@/components/pos/cart";

export default function SalesTab() {
  const [cartOpen, setCartOpen] = useState(false);
  const isMobile = useIsMobile();
  const { cart } = usePOSStore();

  if (isMobile) {
    return (
      <div className="flex-1 flex flex-col relative" data-testid="sales-tab">
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
    <div className="flex-1 flex" data-testid="sales-tab">
      <ProductGrid />
      <Cart />
    </div>
  );
}
