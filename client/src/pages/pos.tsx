import { useState } from "react";
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
import PaymentModal from "@/components/pos/payment-modal";
import EnhancedReceiptModal from "@/components/pos/enhanced-receipt-modal";
import { usePOSStore } from "@/hooks/use-pos-store";
import { useSyncCurrentShift } from "@/hooks/use-sync-current-shift";

export default function POS() {
  const [activeTab, setActiveTab] = useState("sales");
  const { paymentModal, receiptModal } = usePOSStore();
  
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
      default:
        return <SalesTab />;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground" data-testid="pos-main">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="flex-1 flex overflow-hidden">
        {renderTabContent()}
      </div>
      
      {paymentModal.isOpen && <PaymentModal />}
      {receiptModal.isOpen && <EnhancedReceiptModal />}
    </div>
  );
}
