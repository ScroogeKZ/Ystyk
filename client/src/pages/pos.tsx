import { useState } from "react";
import { Menu, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import Sidebar from "@/components/pos/sidebar";
import SalesTab from "@/components/pos/sales-tab";
import InventoryTab from "@/components/pos/inventory-tab";
import GoodsAcceptanceTab from "@/components/pos/goods-acceptance-tab";
import InventoryAuditTab from "@/components/pos/inventory-audit-tab";
import WriteOffsTab from "@/components/pos/write-offs-tab";
import LoyaltyProgram from "@/components/pos/loyalty-program";
import PromotionsTab from "@/components/pos/promotions-tab";
import HardwareConfig from "@/components/pos/hardware-config";
import ReportsTab from "@/components/pos/reports-tab";
import MonitoringDashboard from "@/components/pos/monitoring-dashboard";
import AnalyticsTab from "@/components/pos/analytics-tab";
import CustomersTab from "@/components/pos/customers-tab";
import ReturnsTab from "@/components/pos/returns-tab";
import ShiftTab from "@/components/pos/shift-tab";
import UsersManagement from "@/pages/users-management";
import PaymentModal from "@/components/pos/payment-modal";
import EnhancedReceiptModal from "@/components/pos/enhanced-receipt-modal";
import { usePOSStore } from "@/hooks/use-pos-store";
import { useSyncCurrentShift } from "@/hooks/use-sync-current-shift";
import { Badge } from "@/components/ui/badge";

export default function POS() {
  const [activeTab, setActiveTab] = useState("sales");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { paymentModal, receiptModal, cart } = usePOSStore();
  const isMobile = useIsMobile();
  
  // Sync current shift with backend
  useSyncCurrentShift();

  const renderTabContent = () => {
    switch (activeTab) {
      case "sales":
        return <SalesTab />;
      case "inventory":
        return <InventoryTab />;
      case "acceptance":
        return <GoodsAcceptanceTab />;
      case "audit":
        return <InventoryAuditTab />;
      case "writeoffs":
        return <WriteOffsTab />;
      case "loyalty":
        return <LoyaltyProgram />;
      case "promotions":
        return <PromotionsTab />;
      case "hardware":
        return <HardwareConfig />;
      case "reports":
        return <ReportsTab />;
      case "monitoring":
        return <MonitoringDashboard />;
      case "analytics":
        return <AnalyticsTab />;
      case "customers":
        return <CustomersTab />;
      case "returns":
        return <ReturnsTab />;
      case "shift":
        return <ShiftTab />;
      case "users":
        return <UsersManagement />;
      default:
        return <SalesTab />;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground" data-testid="pos-main">
      {/* Mobile Header */}
      {isMobile && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" data-testid="mobile-menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <Sidebar activeTab={activeTab} onTabChange={(tab) => {
                setActiveTab(tab);
                setSidebarOpen(false);
              }} />
            </SheetContent>
          </Sheet>
          
          <h1 className="text-lg font-bold">POS System</h1>
          
          <div className="relative">
            {cart.length > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                {cart.length}
              </Badge>
            )}
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        {!isMobile && <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />}
        
        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {renderTabContent()}
        </div>
      </div>
      
      {paymentModal.isOpen && <PaymentModal />}
      {receiptModal.isOpen && <EnhancedReceiptModal />}
    </div>
  );
}
