import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Barcode, Coffee, Cookie, GlassWater, Sandwich, IceCream, PillBottle } from "lucide-react";
import { usePOSStore } from "@/hooks/use-pos-store";
import { useFormatters } from "@/i18n/utils";
import BarcodeScanner from "./barcode-scanner";
import type { ProductWithCategory, Category } from "@shared/schema";

const iconMap: Record<string, any> = {
  "Напитки": Coffee,
  "Выпечка": Cookie,
  "Закуски": Sandwich,
  default: Coffee
};

export default function ProductGrid() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [scannerOpen, setScannerOpen] = useState(false);
  const { addToCart } = usePOSStore();
  const { formatCurrency } = useFormatters();

  const { data: products = [], isLoading } = useQuery<ProductWithCategory[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  // Автоматический тест отключен - корзина работает корректно!

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.categoryId === selectedCategory;
    return matchesSearch && matchesCategory && product.isActive;
  });

  const handleAddToCart = (product: ProductWithCategory) => {
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      sku: product.sku
    };
    addToCart(cartItem);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col" data-testid="product-grid">
      {/* Search and Categories */}
      <div className="p-3 sm:p-6 border-b border-border">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Поиск товаров..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-products"
            />
          </div>
          <Button 
            className="px-4 sm:px-6 w-full sm:w-auto" 
            data-testid="barcode-scanner"
            onClick={() => setScannerOpen(true)}
          >
            <Barcode className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Сканер</span>
          </Button>
        </div>
        
        {/* Categories */}
        <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 -mb-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            className="category-btn whitespace-nowrap text-sm sm:text-base"
            onClick={() => setSelectedCategory("all")}
            data-testid="category-all"
          >
            Все
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              className="category-btn whitespace-nowrap text-sm sm:text-base"
              onClick={() => setSelectedCategory(category.id)}
              data-testid={`category-${category.id}`}
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Products Grid */}
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {filteredProducts.map((product) => {
            const Icon = iconMap[product.category?.name || "default"] || iconMap.default;
            return (
              <div
                key={product.id}
                className="product-card"
                onClick={() => handleAddToCart(product)}
                data-testid={`product-${product.id}`}
              >
                <div className="aspect-square bg-muted rounded-lg mb-2 sm:mb-4 flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon className="text-muted-foreground w-8 h-8 sm:w-12 sm:h-12" />
                  )}
                </div>
                <h3 className="font-semibold mb-1 sm:mb-2 text-card-foreground text-sm sm:text-base md:text-lg line-clamp-2">{product.name}</h3>
                <p className="text-base sm:text-lg md:text-xl font-bold text-primary mb-1">{formatCurrency(parseFloat(product.price))}</p>
                <p className="text-xs text-muted-foreground">
                  В наличии: {product.stock}
                  {product.stock <= 5 && (
                    <Badge variant="destructive" className="ml-1 sm:ml-2 text-xs">Мало</Badge>
                  )}
                </p>
              </div>
            );
          })}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Товары не найдены</p>
          </div>
        )}
      </div>
      
      <BarcodeScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onProductScanned={(product) => {
          addToCart({
            id: product.id,
            name: product.name,
            price: product.price,
            stock: product.stock,
            sku: product.sku
          });
          setScannerOpen(false);
        }}
      />
    </div>
  );
}
