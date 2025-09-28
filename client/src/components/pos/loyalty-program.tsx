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
import { Progress } from "@/components/ui/progress";
import { 
  Gift, 
  Star, 
  User, 
  CreditCard, 
  Award, 
  TrendingUp, 
  Calendar,
  Plus,
  Search,
  Phone
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLanguage } from "@/i18n/LanguageContext";
import { useFormatters } from "@/i18n/utils";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const loyaltyCardSchema = z.object({
  customerPhone: z.string().min(10, "Введите корректный номер телефона"),
  customerName: z.string().min(2, "Введите имя клиента"),
  cardNumber: z.string().optional(),
});

interface LoyaltyCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  cardNumber: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalPoints: number;
  availablePoints: number;
  totalSpent: number;
  registrationDate: Date;
  lastVisit: Date;
  transactionCount: number;
  isActive: boolean;
}

interface LoyaltyTransaction {
  id: string;
  customerId: string;
  type: 'earn' | 'redeem' | 'expire' | 'bonus';
  points: number;
  description: string;
  orderId?: string;
  amount?: number;
  timestamp: Date;
}

interface LoyaltyTier {
  name: 'bronze' | 'silver' | 'gold' | 'platinum';
  displayName: string;
  minSpent: number;
  pointsMultiplier: number;
  discountPercent: number;
  benefits: string[];
  color: string;
}

export default function LoyaltyProgram() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<LoyaltyCustomer | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { t } = useLanguage();
  const { formatCurrency, formatDate } = useFormatters();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof loyaltyCardSchema>>({
    resolver: zodResolver(loyaltyCardSchema),
  });

  // Loyalty tiers
  const loyaltyTiers: LoyaltyTier[] = [
    {
      name: 'bronze',
      displayName: 'Бронзовая',
      minSpent: 0,
      pointsMultiplier: 1,
      discountPercent: 0,
      benefits: ['Начисление 1 балл за каждые 100₸'],
      color: 'bg-amber-600'
    },
    {
      name: 'silver',
      displayName: 'Серебряная',
      minSpent: 50000,
      pointsMultiplier: 1.5,
      discountPercent: 3,
      benefits: ['Начисление 1.5 балла за каждые 100₸', 'Скидка 3%', 'Приоритетное обслуживание'],
      color: 'bg-gray-400'
    },
    {
      name: 'gold',
      displayName: 'Золотая',
      minSpent: 150000,
      pointsMultiplier: 2,
      discountPercent: 5,
      benefits: ['Начисление 2 балла за каждые 100₸', 'Скидка 5%', 'Персональные предложения', 'Бонусы в день рождения'],
      color: 'bg-yellow-500'
    },
    {
      name: 'platinum',
      displayName: 'Платиновая',
      minSpent: 500000,
      pointsMultiplier: 3,
      discountPercent: 10,
      benefits: ['Начисление 3 балла за каждые 100₸', 'Скидка 10%', 'VIP статус', 'Эксклюзивные мероприятия', 'Персональный менеджер'],
      color: 'bg-purple-600'
    }
  ];

  // Mock data - would be from API in production
  const loyaltyCustomers: LoyaltyCustomer[] = [
    {
      id: '1',
      name: 'Айгерим Нурланова',
      phone: '+77771234567',
      email: 'aigerim@example.com',
      cardNumber: '4001234567890123',
      tier: 'gold',
      totalPoints: 2450,
      availablePoints: 1850,
      totalSpent: 185000,
      registrationDate: new Date('2023-06-15'),
      lastVisit: new Date('2024-01-25'),
      transactionCount: 47,
      isActive: true
    },
    {
      id: '2',
      name: 'Данияр Касымов',
      phone: '+77759876543',
      cardNumber: '4001234567890124',
      tier: 'silver',
      totalPoints: 890,
      availablePoints: 890,
      totalSpent: 67500,
      registrationDate: new Date('2023-11-20'),
      lastVisit: new Date('2024-01-20'),
      transactionCount: 28,
      isActive: true
    },
    {
      id: '3',
      name: 'Сауле Жакупова',
      phone: '+77751112233',
      email: 'saule@example.com',
      cardNumber: '4001234567890125',
      tier: 'bronze',
      totalPoints: 345,
      availablePoints: 245,
      totalSpent: 23400,
      registrationDate: new Date('2024-01-05'),
      lastVisit: new Date('2024-01-24'),
      transactionCount: 12,
      isActive: true
    }
  ];

  const loyaltyTransactions: LoyaltyTransaction[] = [
    {
      id: '1',
      customerId: '1',
      type: 'earn',
      points: 185,
      description: 'Покупка на сумму ₸18,500',
      orderId: 'ORD-001',
      amount: 18500,
      timestamp: new Date('2024-01-25')
    },
    {
      id: '2',
      customerId: '1',
      type: 'redeem',
      points: -600,
      description: 'Использование баллов на скидку',
      orderId: 'ORD-001',
      timestamp: new Date('2024-01-25')
    },
    {
      id: '3',
      customerId: '2',
      type: 'earn',
      points: 125,
      description: 'Покупка на сумму ₸12,500',
      orderId: 'ORD-002',
      amount: 12500,
      timestamp: new Date('2024-01-20')
    }
  ];

  const addLoyaltyCardMutation = useMutation({
    mutationFn: async (data: z.infer<typeof loyaltyCardSchema>) => {
      // Mock API call - would be real in production
      await new Promise(resolve => setTimeout(resolve, 1000));
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loyalty/customers"] });
      setIsAddDialogOpen(false);
      form.reset();
      toast({
        title: "Карта лояльности создана",
        description: "Новый клиент добавлен в программу лояльности",
      });
    },
  });

  const findCustomer = (searchTerm: string) => {
    if (!searchTerm) return null;
    
    return loyaltyCustomers.find(
      customer => 
        customer.phone.includes(searchTerm) ||
        customer.cardNumber.includes(searchTerm) ||
        customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getTierBadge = (tier: LoyaltyCustomer['tier']) => {
    const tierConfig = loyaltyTiers.find(t => t.name === tier);
    if (!tierConfig) return null;

    return (
      <Badge className={`${tierConfig.color} text-white`}>
        <Star className="w-3 h-3 mr-1" />
        {tierConfig.displayName}
      </Badge>
    );
  };

  const getNextTier = (customer: LoyaltyCustomer) => {
    const currentTierIndex = loyaltyTiers.findIndex(t => t.name === customer.tier);
    if (currentTierIndex === loyaltyTiers.length - 1) return null;
    
    const nextTier = loyaltyTiers[currentTierIndex + 1];
    const remainingAmount = nextTier.minSpent - customer.totalSpent;
    const progress = (customer.totalSpent / nextTier.minSpent) * 100;
    
    return { tier: nextTier, remaining: remainingAmount, progress: Math.min(progress, 100) };
  };

  const calculatePointsForAmount = (amount: number, tier: LoyaltyCustomer['tier']) => {
    const tierConfig = loyaltyTiers.find(t => t.name === tier);
    if (!tierConfig) return 0;
    
    return Math.floor((amount / 100) * tierConfig.pointsMultiplier);
  };

  const filteredCustomers = loyaltyCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone.includes(searchTerm) ||
    customer.cardNumber.includes(searchTerm)
  );

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Программа лояльности</h1>
          <div className="flex gap-3">
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить клиента
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Новая карта лояльности</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit((data) => addLoyaltyCardMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="customerName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Имя клиента</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Введите имя" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="customerPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Телефон</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="+7 777 123 45 67" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cardNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Номер карты (опционально)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Будет сгенерирован автоматически" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                        Отмена
                      </Button>
                      <Button type="submit" disabled={addLoyaltyCardMutation.isPending} className="flex-1">
                        {addLoyaltyCardMutation.isPending ? "Создание..." : "Создать"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Loyalty Program Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего участников</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loyaltyCustomers.length}</div>
              <p className="text-xs text-muted-foreground">Активных клиентов</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего баллов</CardTitle>
              <Gift className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loyaltyCustomers.reduce((sum, c) => sum + c.totalPoints, 0).toLocaleString('ru-RU')}
              </div>
              <p className="text-xs text-muted-foreground">Начислено клиентам</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Золотые клиенты</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loyaltyCustomers.filter(c => c.tier === 'gold' || c.tier === 'platinum').length}
              </div>
              <p className="text-xs text-muted-foreground">VIP статус</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Средние траты</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(loyaltyCustomers.reduce((sum, c) => sum + c.totalSpent, 0) / loyaltyCustomers.length)}
              </div>
              <p className="text-xs text-muted-foreground">На клиента</p>
            </CardContent>
          </Card>
        </div>

        {/* Loyalty Tiers */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Уровни лояльности</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {loyaltyTiers.map((tier) => (
                <div key={tier.name} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={`${tier.color} text-white`}>
                      <Star className="w-3 h-3 mr-1" />
                      {tier.displayName}
                    </Badge>
                    <span className="text-sm font-medium">
                      {tier.discountPercent > 0 && `-${tier.discountPercent}%`}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    От {formatCurrency(tier.minSpent)}
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {tier.benefits.map((benefit, index) => (
                      <li key={index}>• {benefit}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Customer Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Поиск клиента</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Поиск по телефону, номеру карты или имени..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={() => {
                const customer = findCustomer(searchTerm);
                if (customer) {
                  setSelectedCustomer(customer);
                } else {
                  toast({
                    title: "Клиент не найден",
                    description: "Попробуйте другой номер телефона или карты",
                    variant: "destructive",
                  });
                }
              }}>
                <Search className="w-4 h-4 mr-2" />
                Найти
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Selected Customer Info */}
        {selectedCustomer && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Информация о клиенте</span>
                {getTierBadge(selectedCustomer.tier)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="font-medium mb-2">Основная информация</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Имя:</span> {selectedCustomer.name}</div>
                    <div><span className="font-medium">Телефон:</span> {selectedCustomer.phone}</div>
                    <div><span className="font-medium">Карта:</span> {selectedCustomer.cardNumber}</div>
                    <div><span className="font-medium">Регистрация:</span> {formatDate(selectedCustomer.registrationDate)}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Статистика</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Всего потрачено:</span> {formatCurrency(selectedCustomer.totalSpent)}</div>
                    <div><span className="font-medium">Доступно баллов:</span> {selectedCustomer.availablePoints.toLocaleString('ru-RU')}</div>
                    <div><span className="font-medium">Покупок:</span> {selectedCustomer.transactionCount}</div>
                    <div><span className="font-medium">Последний визит:</span> {formatDate(selectedCustomer.lastVisit)}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Прогресс до следующего уровня</h3>
                  {(() => {
                    const nextTier = getNextTier(selectedCustomer);
                    if (!nextTier) {
                      return <p className="text-sm text-muted-foreground">Максимальный уровень достигнут</p>;
                    }
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{nextTier.tier.displayName}</span>
                          <span>{nextTier.progress.toFixed(1)}%</span>
                        </div>
                        <Progress value={nextTier.progress} />
                        <p className="text-xs text-muted-foreground">
                          Осталось потратить: {formatCurrency(nextTier.remaining)}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Клиенты программы лояльности</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Уровень</TableHead>
                  <TableHead>Баллы</TableHead>
                  <TableHead>Всего потрачено</TableHead>
                  <TableHead>Покупок</TableHead>
                  <TableHead>Последний визит</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-card-foreground">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        <p className="text-xs text-muted-foreground">{customer.cardNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell>{getTierBadge(customer.tier)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{customer.availablePoints.toLocaleString('ru-RU')}</p>
                        <p className="text-xs text-muted-foreground">из {customer.totalPoints.toLocaleString('ru-RU')}</p>
                      </div>
                    </TableCell>
                    <TableCell>{formatCurrency(customer.totalSpent)}</TableCell>
                    <TableCell>{customer.transactionCount}</TableCell>
                    <TableCell className="text-muted-foreground">{formatDate(customer.lastVisit)}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        Подробнее
                      </Button>
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