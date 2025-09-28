import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Mail, Printer, Shield, CheckCircle } from "lucide-react";
import { usePOSStore } from "@/hooks/use-pos-store";
import { useLanguage } from "@/i18n/LanguageContext";
import { useFormatters } from "@/i18n/utils";

export default function EnhancedReceiptModal() {
  const { receiptModal, closeReceiptModal } = usePOSStore();
  const { t } = useLanguage();
  const { formatCurrency, formatDate } = useFormatters();
  const transaction = receiptModal.transaction;

  if (!receiptModal.isOpen || !transaction) return null;

  const fiscalInfo = {
    fiscalSign: "FP-2024-001",
    qrCode: "https://check.kz/" + transaction.id,
    ofdOperator: "ТОО \"Казахстан ОФД\"",
    fiscalNumber: "KZ123456789012",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="receipt-modal">
      <div className="bg-card border border-border rounded-lg w-96 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-card-foreground">{t.fiscal.fiscalReceipt}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeReceiptModal}
            data-testid="close-receipt-modal"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Fiscal Status Badge */}
        <div className="mb-4 flex justify-center">
          <Badge className="bg-green-100 text-green-800">
            <Shield className="w-3 h-3 mr-1" />
            <CheckCircle className="w-3 h-3 mr-1" />
            {t.fiscal.fiscalReceipt}
          </Badge>
        </div>

        {/* Store Info */}
        <div className="text-center mb-4">
          <h3 className="font-bold text-lg text-card-foreground">{t.receipt.storeName}</h3>
          <p className="text-sm text-muted-foreground">{t.receipt.address}</p>
          <p className="text-sm text-muted-foreground">{t.receipt.phone}</p>
          <p className="text-xs text-muted-foreground mt-1">ИИН/БИН: {fiscalInfo.fiscalNumber}</p>
        </div>
        
        <div className="space-y-2 mb-4 text-sm">
          <div className="flex justify-between">
            <span>{t.receipt.date}</span>
            <span data-testid="receipt-date">
              {formatDate(transaction.createdAt)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>{t.receipt.cashier}</span>
            <span>Анна Петрова</span>
          </div>
          <div className="flex justify-between">
            <span>{t.receipt.register}</span>
            <span>#001</span>
          </div>
          <div className="flex justify-between">
            <span>Смена:</span>
            <span>#004</span>
          </div>
        </div>
        
        <div className="border-t border-b border-border py-4 mb-4">
          {transaction.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm mb-2">
              <div>
                <p className="text-card-foreground">{item.product.name}</p>
                <p className="text-muted-foreground">
                  {formatCurrency(Number(item.unitPrice))} × {item.quantity}
                </p>
              </div>
              <span className="text-card-foreground">{formatCurrency(Number(item.totalPrice))}</span>
            </div>
          ))}
        </div>
        
        <div className="space-y-1 text-sm mb-4">
          <div className="flex justify-between">
            <span>{t.receipt.subtotal}</span>
            <span data-testid="receipt-subtotal">{formatCurrency(Number(transaction.subtotal))}</span>
          </div>
          <div className="flex justify-between">
            <span>{t.receipt.tax}</span>
            <span data-testid="receipt-tax">{formatCurrency(Number(transaction.tax))}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-border pt-2">
            <span>{t.receipt.total}</span>
            <span data-testid="receipt-total">{formatCurrency(Number(transaction.total))}</span>
          </div>
          {transaction.paymentMethod === "cash" && (
            <>
              <div className="flex justify-between">
                <span>{t.receipt.received}</span>
                <span data-testid="receipt-received">{formatCurrency(Number(transaction.receivedAmount || 0))}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.receipt.change}</span>
                <span data-testid="receipt-change">{formatCurrency(Number(transaction.changeAmount || 0))}</span>
              </div>
            </>
          )}
        </div>

        {/* Fiscal Information */}
        <div className="bg-muted p-3 rounded-lg mb-4 text-xs">
          <div className="font-semibold mb-2 text-center">{t.fiscal.fiscalInfo}</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>{t.fiscal.fiscalSign}</span>
              <span className="font-mono">{fiscalInfo.fiscalSign}</span>
            </div>
            <div className="flex justify-between">
              <span>{t.fiscal.ofdOperator}</span>
              <span>{fiscalInfo.ofdOperator}</span>
            </div>
            <div className="text-center mt-2">
              <div className="w-16 h-16 bg-white border mx-auto flex items-center justify-center">
                {/* QR Code placeholder */}
                <span className="text-xs">QR</span>
              </div>
              <p className="mt-1">{t.fiscal.checkReceipt}</p>
            </div>
          </div>
        </div>
        
        <div className="text-center text-xs text-muted-foreground mb-4">
          <p>{t.receipt.thankYou}</p>
          <p>{t.receipt.returnPolicy}</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1">
            <Mail className="w-4 h-4 mr-2" />
            {t.receipt.email}
          </Button>
          <Button className="flex-1">
            <Printer className="w-4 h-4 mr-2" />
            {t.receipt.print}
          </Button>
        </div>
      </div>
    </div>
  );
}