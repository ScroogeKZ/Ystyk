import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import FiscalStatus from "@/components/pos/fiscal-status";
import { useSessionStore } from "@/hooks/use-session-store";
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
  Settings
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}


export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { t } = useLanguage();
  const currentShift = useSessionStore((state) => state.currentShift);
  
  const tabs = [
    { id: "sales", label: t.sidebar.sales, icon: ShoppingCart },
    { id: "inventory", label: t.sidebar.inventory, icon: Package },
    { id: "acceptance", label: "Приемка", icon: Package },
    { id: "audit", label: "Инвентаризация", icon: Package },
    { id: "writeoffs", label: "Списания", icon: Package },
    { id: "loyalty", label: "Лояльность", icon: User },
    { id: "promotions", label: "Акции", icon: Package },
    { id: "hardware", label: "Оборудование", icon: Settings },
    { id: "reports", label: "Отчеты", icon: BarChart3 },
    { id: "monitoring", label: "Мониторинг", icon: BarChart3 },
    { id: "analytics", label: t.sidebar.analytics, icon: BarChart3 },
    { id: "customers", label: t.sidebar.customers, icon: Users },
    { id: "returns", label: t.sidebar.returns, icon: RotateCcw },
    { id: "shift", label: t.sidebar.shift, icon: Clock },
  ];
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
      
      {/* Language Switcher */}
      <div className="p-4 border-t border-sidebar-border">
        <LanguageSwitcher />
      </div>
      
      {/* User Info */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
            <User className="text-sidebar-primary-foreground text-sm" />
          </div>
          <div>
            <p className="text-sm font-medium text-sidebar-foreground">Анна Петрова</p>
            <p className="text-xs text-muted-foreground">{t.common.cashier}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
