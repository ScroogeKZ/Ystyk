import ProductGrid from "@/components/pos/product-grid";
import Cart from "@/components/pos/cart";

export default function SalesTab() {
  return (
    <div className="flex-1 flex" data-testid="sales-tab">
      <ProductGrid />
      <Cart />
    </div>
  );
}
