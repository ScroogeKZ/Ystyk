import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { ThemeToggleSimple } from "@/components/theme-toggle";
import FiscalStatus from "@/components/pos/fiscal-status";
import { useSessionStore } from "@/hooks/use-session-store";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Users, 
  RotateCcw, 
  Clock,
  ScanBarcode,
  Wifi,
  User,
  Settings,
  LogOut,
  UserCog
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}


export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { t } = useLanguage();
  const currentShift = useSessionStore((state) => state.currentShift);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: session } = useQuery<{ user?: { id: string; username: string; role: string } }>({
    queryKey: ["/api/auth/session"],
  });

  const isAdmin = session?.user?.role === 'admin';

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout", {});
      
      // Clear all queries and session store
      queryClient.clear();
      queryClient.invalidateQueries({ queryKey: ["/api/auth/session"] });
      useSessionStore.setState({ userId: '', currentShift: null });
      
      toast({
        title: "Выход выполнен",
        description: "Вы успешно вышли из системы",
      });
      setLocation("/login");
    } catch (error: any) {
      toast({
        title: "Ошибка",
        description: error.message || "Не удалось выйти из системы",
        variant: "destructive",
      });
    }
  };
  
  // Define all tabs with role restrictions
  const allTabs = [
    { id: "sales", label: t.sidebar.sales, icon: ShoppingCart, roles: ['admin', 'cashier'] },
    { id: "shift", label: t.sidebar.shift, icon: Clock, roles: ['admin', 'cashier'] },
    { id: "inventory", label: t.sidebar.inventory, icon: Package, roles: ['admin', 'cashier'] },
    { id: "acceptance", label: "Приемка", icon: Package, roles: ['admin'] },
    { id: "audit", label: "Инвентаризация", icon: Package, roles: ['admin'] },
    { id: "writeoffs", label: "Списания", icon: Package, roles: ['admin'] },
    { id: "loyalty", label: "Лояльность", icon: User, roles: ['admin', 'cashier'] },
    { id: "promotions", label: "Акции", icon: Package, roles: ['admin'] },
    { id: "hardware", label: "Оборудование", icon: Settings, roles: ['admin'] },
    { id: "reports", label: "Отчеты", icon: BarChart3, roles: ['admin'] },
    { id: "monitoring", label: "Мониторинг", icon: BarChart3, roles: ['admin'] },
    { id: "analytics", label: t.sidebar.analytics, icon: BarChart3, roles: ['admin'] },
    { id: "customers", label: t.sidebar.customers, icon: Users, roles: ['admin', 'cashier'] },
    { id: "returns", label: t.sidebar.returns, icon: RotateCcw, roles: ['admin', 'cashier'] },
    { id: "users", label: "Пользователи", icon: UserCog, roles: ['admin'] },
  ];

  // Filter tabs based on user role
  const userRole = session?.user?.role || 'cashier';
  const tabs = allTabs.filter(tab => tab.roles.includes(userRole));
  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col" data-testid="sidebar">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <ScanBarcode className="text-sidebar-primary-foreground text-lg" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">{t.sidebar.posSystem}</h1>
            <p className="text-xs text-muted-foreground">{t.sidebar.register}</p>
          </div>
        </div>
        
        {/* Status */}
        <div className="flex items-center gap-2">
          {currentShift ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <Wifi className="w-3 h-3 mr-1" />
              {t.sidebar.shiftOpen}
            </Badge>
          ) : (
            <Badge variant="destructive" className="bg-red-100 text-red-800">
              <Wifi className="w-3 h-3 mr-1" />
              Смена закрыта
            </Badge>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4" data-testid="navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "sidebar-btn",
                activeTab === tab.id && "active"
              )}
              data-testid={`tab-${tab.id}`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
            </button>
          );
        })}
      </nav>
      
      {/* Fiscal Status */}
      <div className="p-4 border-t border-sidebar-border">
        <FiscalStatus />
      </div>
      
      {/* Settings */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center justify-between gap-2">
          <LanguageSwitcher />
          <ThemeToggleSimple />
        </div>
      </div>
      
      {/* User Info */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
            <User className="text-sidebar-primary-foreground text-sm" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-sidebar-foreground">
              {session?.user?.username || "Пользователь"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isAdmin ? "Администратор" : t.common.cashier}
            </p>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full" 
          onClick={handleLogout}
          data-testid="button-logout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Выход
        </Button>
      </div>
    </div>
  );
}
