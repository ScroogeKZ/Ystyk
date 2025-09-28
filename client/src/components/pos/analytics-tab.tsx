import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Banknote, Receipt, TrendingUp, Wifi } from "lucide-react";
import { useState } from "react";
import type { Product } from "@shared/schema";

interface DailySales {
  revenue: number;
  transactions: number;
  averageCheck: number;
}

interface TopProduct {
  product: Product;
  sold: number;
}

export default function AnalyticsTab() {
  const [dateFilter, setDateFilter] = useState("today");

  const { data: dailyAnalytics } = useQuery<DailySales>({
    queryKey: ["/api/analytics/daily", new Date().toISOString().split('T')[0]],
  });

  const { data: topProducts = [] } = useQuery<TopProduct[]>({
    queryKey: ["/api/analytics/top-products"],
  });

  return (
    <div className="flex-1 p-6" data-testid="analytics-tab">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Аналитика</h1>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-48" data-testid="date-filter">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Сегодня</SelectItem>
              <SelectItem value="yesterday">Вчера</SelectItem>
              <SelectItem value="week">На этой неделе</SelectItem>
              <SelectItem value="month">В этом месяце</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Выручка</CardTitle>
              <Banknote className="w-4 h-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground" data-testid="revenue">
                ₽{dailyAnalytics?.revenue?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-green-600">+12% от вчера</p>
            </CardContent>
          </Card>
          
          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Транзакции</CardTitle>
              <Receipt className="w-4 h-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground" data-testid="transactions">
                {dailyAnalytics?.transactions || 0}
              </div>
              <p className="text-xs text-blue-600">+3 от вчера</p>
            </CardContent>
          </Card>
          
          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Средний чек</CardTitle>
              <TrendingUp className="w-4 h-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground" data-testid="average-check">
                ₽{dailyAnalytics?.averageCheck?.toFixed(2) || "0.00"}
              </div>
              <p className="text-xs text-purple-600">+₽15 от вчера</p>
            </CardContent>
          </Card>
          
          <Card className="stat-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Офлайн операций</CardTitle>
              <Wifi className="w-4 h-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">0</div>
              <p className="text-xs text-red-600">Ожидают синхронизации</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-card-foreground">Выручка по часам</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                <p className="text-muted-foreground">График выручки по часам</p>
              </div>
            </CardContent>
          </Card>
          
          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-card-foreground">Топ товары</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topProducts.length > 0 ? (
                  topProducts.map((item, index) => (
                    <div key={item.product.id} className="flex items-center justify-between" data-testid={`top-product-${index}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">{index + 1}</span>
                        </div>
                        <span className="text-card-foreground">{item.product.name}</span>
                      </div>
                      <span className="font-semibold text-card-foreground">{item.sold} шт</span>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center">Нет данных о продажах</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
