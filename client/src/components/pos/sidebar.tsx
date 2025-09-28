import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Users, 
  RotateCcw, 
  Clock,
  ScanBarcode,
  Wifi,
  User
} from "lucide-react";

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "sales", label: "Продажи", icon: ShoppingCart },
  { id: "inventory", label: "Товары", icon: Package },
  { id: "analytics", label: "Аналитика", icon: BarChart3 },
  { id: "customers", label: "Клиенты", icon: Users },
  { id: "returns", label: "Возвраты", icon: RotateCcw },
  { id: "shift", label: "Смена", icon: Clock },
];

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col" data-testid="sidebar">
      {/* Header */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center">
            <ScanBarcode className="text-sidebar-primary-foreground text-lg" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-sidebar-foreground">POS System</h1>
            <p className="text-xs text-muted-foreground">Касса #001</p>
          </div>
        </div>
        
        {/* Status */}
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <Wifi className="w-3 h-3 mr-1" />
            Офлайн
          </Badge>
          <span className="text-xs text-muted-foreground">Смена открыта</span>
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
      
      {/* User Info */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-sidebar-primary rounded-full flex items-center justify-center">
            <User className="text-sidebar-primary-foreground text-sm" />
          </div>
          <div>
            <p className="text-sm font-medium text-sidebar-foreground">Анна Петрова</p>
            <p className="text-xs text-muted-foreground">Кассир</p>
          </div>
        </div>
      </div>
    </div>
  );
}
