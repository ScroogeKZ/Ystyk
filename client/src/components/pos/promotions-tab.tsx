import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Plus, 
  Percent, 
  Tag, 
  Calendar as CalendarIcon, 
  Gift, 
  Star,
  TrendingUp,
  Users,
  ShoppingCart,
  Edit,
  Trash2
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLanguage } from "@/i18n/LanguageContext";
import { useFormatters } from "@/i18n/utils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { z } from "zod";

const promotionSchema = z.object({
  name: z.string().min(1, "Название обязательно"),
  description: z.string().optional(),
  type: z.enum(['percentage', 'fixed_amount', 'buy_x_get_y', '2_for_1', 'loyalty_bonus']),
  value: z.number().min(0, "Значение должно быть положительным"),
  minAmount: z.number().min(0).optional(),
  startDate: z.date(),
  endDate: z.date(),
  isActive: z.boolean(),
  applicableCategories: z.array(z.string()).optional(),
  maxUsage: z.number().min(1).optional(),
});

interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | '2_for_1' | 'loyalty_bonus';
  value: number;
  minAmount?: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  applicableCategories?: string[];
  maxUsage?: number;
  currentUsage: number;
  createdAt: Date;
  createdBy: string;
}

interface Coupon {
  id: string;
  code: string;
  promotionId: string;
  promotion: Promotion;
  customerId?: string;
  customerPhone?: string;
  isUsed: boolean;
  usedAt?: Date;
  expiresAt: Date;
  generatedAt: Date;
}

export default function PromotionsTab() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { t, language } = useLanguage();
  const { formatCurrency, formatDate } = useFormatters();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof promotionSchema>>({
    resolver: zodResolver(promotionSchema),
    defaultValues: {
      isActive: true,
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  // Mock data - would be from API in production
  const promotions: Promotion[] = [
    {
      id: '1',
      name: 'Новогодние скидки 2024',
      description: 'Скидка 15% на все товары в честь Нового года',
      type: 'percentage',
      value: 15,
      minAmount: 5000,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-01-15'),
      isActive: true,
      maxUsage: 1000,
      currentUsage: 234,
      createdAt: new Date('2023-12-20'),
      createdBy: 'Анна Петрова'
    },
    {
      id: '2',
      name: 'Скидка на второй товар',
      description: 'Купите 2 товара - получите скидку 50% на второй',
      type: 'buy_x_get_y',
      value: 50,
      startDate: new Date('2024-01-10'),
      endDate: new Date('2024-01-31'),
      isActive: true,
      applicableCategories: ['cat-1', 'cat-2'],
      currentUsage: 78,
      createdAt: new Date('2024-01-05'),
      createdBy: 'Менеджер'
    },
    {
      id: '3',
      name: 'Фиксированная скидка ₸1000',
      description: 'Скидка ₸1,000 при покупке от ₸10,000',
      type: 'fixed_amount',
      value: 1000,
      minAmount: 10000,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-02-15'),
      isActive: false,
      maxUsage: 500,
      currentUsage: 0,
      createdAt: new Date('2024-01-10'),
      createdBy: 'Анна Петрова'
    },
    {
      id: '4',
      name: 'Двойные баллы лояльности',
      description: 'Начисление двойных баллов программы лояльности',
      type: 'loyalty_bonus',
      value: 2,
      startDate: new Date('2024-01-20'),
      endDate: new Date('2024-01-27'),
      isActive: true,
      currentUsage: 156,
      createdAt: new Date('2024-01-18'),
      createdBy: 'Менеджер'
    }
  ];

  const coupons: Coupon[] = [
    {
      id: '1',
      code: 'NY2024-ABC123',
      promotionId: '1',
      promotion: promotions[0],
      customerId: '1',
      customerPhone: '+77771234567',
      isUsed: true,
      usedAt: new Date('2024-01-03'),
      expiresAt: new Date('2024-01-15'),
      generatedAt: new Date('2024-01-01')
    },
    {
      id: '2',
      code: 'NY2024-DEF456',
      promotionId: '1',
      promotion: promotions[0],
      isUsed: false,
      expiresAt: new Date('2024-01-15'),
      generatedAt: new Date('2024-01-01')
    }
  ];

  const createPromotionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof promotionSchema>) => {
      // Mock API call - would be real in production
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/promotions"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Акция создана",
        description: "Новая промо-акция успешно добавлена",
      });
    },
  });

  const generateCoupons = (promotionId: string, count: number) => {
    toast({
      title: "Создание купонов",
      description: `Генерируем ${count} купонов для акции...`,
    });
    
    // Mock coupon generation
    setTimeout(() => {
      toast({
        title: "Купоны созданы",
        description: `Успешно создано ${count} купонов`,
      });
    }, 2000);
  };

  const getPromotionTypeBadge = (type: Promotion['type']) => {
    const types = {
      'percentage': { label: 'Процент', color: 'bg-blue-100 text-blue-800' },
      'fixed_amount': { label: 'Фикс. сумма', color: 'bg-green-100 text-green-800' },
      'buy_x_get_y': { label: '2-й со скидкой', color: 'bg-purple-100 text-purple-800' },
      '2_for_1': { label: '2 за 1', color: 'bg-orange-100 text-orange-800' },
      'loyalty_bonus': { label: 'Бонус лояльности', color: 'bg-yellow-100 text-yellow-800' }
    };
    
    const config = types[type];
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getStatusBadge = (promotion: Promotion) => {
    const now = new Date();
    const isExpired = now > promotion.endDate;
    const isStarted = now >= promotion.startDate;
    
    if (!promotion.isActive) {
      return <Badge variant="secondary">Отключена</Badge>;
    }
    
    if (isExpired) {
      return <Badge variant="destructive">Истекла</Badge>;
    }
    
    if (!isStarted) {
      return <Badge className="bg-blue-100 text-blue-800">Запланирована</Badge>;
    }
    
    return <Badge className="bg-green-100 text-green-800">Активна</Badge>;
  };

  const getPromotionDescription = (promotion: Promotion) => {
    switch (promotion.type) {
      case 'percentage':
        return `Скидка ${promotion.value}%${promotion.minAmount ? ` при покупке от ${formatCurrency(promotion.minAmount)}` : ''}`;
      case 'fixed_amount':
        return `Скидка ${formatCurrency(promotion.value)}${promotion.minAmount ? ` при покупке от ${formatCurrency(promotion.minAmount)}` : ''}`;
      case 'buy_x_get_y':
        return `Скидка ${promotion.value}% на второй товар`;
      case '2_for_1':
        return 'Два товара по цене одного';
      case 'loyalty_bonus':
        return `Баллы лояльности x${promotion.value}`;
      default:
        return promotion.description || '';
    }
  };

  const filteredPromotions = promotions.filter(promotion =>
    promotion.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    promotion.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Промо-акции и купоны</h1>
          <div className="flex gap-3">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать акцию
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Новая промо-акция</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => createPromotionMutation.mutate(data))} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Название акции</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Например: Скидка 20%" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Тип акции</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Выберите тип" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="percentage">Процентная скидка</SelectItem>
                                <SelectItem value="fixed_amount">Фиксированная скидка</SelectItem>
                                <SelectItem value="buy_x_get_y">2-й товар со скидкой</SelectItem>
                                <SelectItem value="2_for_1">2 товара за цену 1</SelectItem>
                                <SelectItem value="loyalty_bonus">Бонус лояльности</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Описание</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Подробное описание акции" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Значение (% или ₸)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="minAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Мин. сумма покупки (₸)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                value={field.value || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Дата начала</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant="outline" className="w-full justify-start">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "dd.MM.yyyy", { locale: ru }) : "Выберите дату"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Дата окончания</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button variant="outline" className="w-full justify-start">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value ? format(field.value, "dd.MM.yyyy", { locale: ru }) : "Выберите дату"}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="maxUsage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Лимит использований</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                {...field} 
                                onChange={e => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                                value={field.value || ''}
                                placeholder="Без лимита"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="isActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-y-0 gap-2">
                            <FormLabel>Активная акция</FormLabel>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                        Отмена
                      </Button>
                      <Button type="submit" disabled={createPromotionMutation.isPending} className="flex-1">
                        {createPromotionMutation.isPending ? "Создание..." : "Создать акцию"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Promotions Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активные акции</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {promotions.filter(p => p.isActive && new Date() >= p.startDate && new Date() <= p.endDate).length}
              </div>
              <p className="text-xs text-muted-foreground">Действующих сейчас</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего использований</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {promotions.reduce((sum, p) => sum + p.currentUsage, 0)}
              </div>
              <p className="text-xs text-muted-foreground">Раз применены</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Купоны</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{coupons.length}</div>
              <p className="text-xs text-muted-foreground">
                {coupons.filter(c => c.isUsed).length} использовано
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Средняя скидка</CardTitle>
              <Percent className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12.5%</div>
              <p className="text-xs text-muted-foreground">За последний месяц</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <Input
            placeholder="Поиск акций..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        {/* Promotions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Список промо-акций</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Акция</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Период</TableHead>
                  <TableHead>Использования</TableHead>
                  <TableHead>Создана</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPromotions.map((promotion) => (
                  <TableRow key={promotion.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-card-foreground">{promotion.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {getPromotionDescription(promotion)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{getPromotionTypeBadge(promotion.type)}</TableCell>
                    <TableCell>{getStatusBadge(promotion)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatDate(promotion.startDate)}</div>
                        <div className="text-muted-foreground">{formatDate(promotion.endDate)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{promotion.currentUsage}</div>
                        {promotion.maxUsage && (
                          <div className="text-muted-foreground">из {promotion.maxUsage}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(promotion.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => generateCoupons(promotion.id, 50)}
                        >
                          <Gift className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}