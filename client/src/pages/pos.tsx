import { useState } from "react";
import Sidebar from "@/components/pos/sidebar";
import SalesTab from "@/components/pos/sales-tab";
import InventoryTab from "@/components/pos/inventory-tab";
import AnalyticsTab from "@/components/pos/analytics-tab";
import CustomersTab from "@/components/pos/customers-tab";
import ReturnsTab from "@/components/pos/returns-tab";
import ShiftTab from "@/components/pos/shift-tab";
import PaymentModal from "@/components/pos/payment-modal";
import ReceiptModal from "@/components/pos/receipt-modal";
import { usePOSStore } from "@/hooks/use-pos-store";

export default function POS() {
  const [activeTab, setActiveTab] = useState("sales");
  const { paymentModal, receiptModal } = usePOSStore();

  const renderTabContent = () => {
    switch (activeTab) {
      case "sales":
        return <SalesTab />;
      case "inventory":
        return <InventoryTab />;
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
      {receiptModal.isOpen && <ReceiptModal />}
    </div>
  );
}
