import { Button } from "@/components/ui/button";
import { X, Printer, Mail } from "lucide-react";
import { usePOSStore } from "@/hooks/use-pos-store";
import { generateReceiptPDF } from "@/lib/pdf-generator";

export default function ReceiptModal() {
  const { receiptModal, closeReceiptModal } = usePOSStore();

  if (!receiptModal.isOpen || !receiptModal.transaction) return null;

  const { transaction } = receiptModal;

  const handlePrint = () => {
    generateReceiptPDF(transaction);
  };

  const handleEmail = () => {
    // TODO: Implement email functionality
    console.log("Email receipt");
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="receipt-modal">
      <div className="bg-card border border-border rounded-lg w-96 max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-card-foreground">
              Чек #{transaction.receiptNumber}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeReceiptModal}
              data-testid="close-receipt-modal"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Receipt Content */}
          <div className="text-center mb-6">
            <h3 className="font-bold text-lg text-card-foreground">Кафе "Уютное место"</h3>
            <p className="text-sm text-muted-foreground">ул. Пушкина, д. 10</p>
            <p className="text-sm text-muted-foreground">+7 (495) 123-45-67</p>
          </div>
          
          <div className="space-y-2 mb-4 text-sm">
            <div className="flex justify-between">
              <span>Дата:</span>
              <span data-testid="receipt-date">
                {transaction.createdAt.toLocaleString('ru-RU')}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Кассир:</span>
              <span>Анна Петрова</span>
            </div>
            <div className="flex justify-between">
              <span>Касса:</span>
              <span>#001</span>
            </div>
          </div>
          
          <div className="border-t border-b border-border py-4 mb-4">
            {transaction.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm mb-2">
                <div>
                  <p className="text-card-foreground">{item.product.name}</p>
                  <p className="text-muted-foreground">
                    ₸{item.unitPrice} × {item.quantity}
                  </p>
                </div>
                <span className="text-card-foreground">₸{item.totalPrice}</span>
              </div>
            ))}
          </div>
          
          <div className="space-y-1 text-sm mb-6">
            <div className="flex justify-between">
              <span>Подытог:</span>
              <span data-testid="receipt-subtotal">₸{transaction.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Налог (10%):</span>
              <span data-testid="receipt-tax">₸{transaction.tax}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-border pt-2">
              <span>Итого:</span>
              <span data-testid="receipt-total">₸{transaction.total}</span>
            </div>
            {transaction.paymentMethod === "cash" && (
              <>
                <div className="flex justify-between">
                  <span>Получено:</span>
                  <span data-testid="receipt-received">₸{transaction.receivedAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Сдача:</span>
                  <span data-testid="receipt-change">₸{transaction.changeAmount}</span>
                </div>
              </>
            )}
          </div>
          
          <div className="text-center text-xs text-muted-foreground mb-6">
            <p>Спасибо за покупку!</p>
            <p>Обмен и возврат в течение 14 дней</p>
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-card border-t border-border p-6">
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleEmail}
              data-testid="email-receipt"
            >
              <Mail className="w-4 h-4 mr-2" />
              Email
            </Button>
            <Button
              className="flex-1"
              onClick={handlePrint}
              data-testid="print-receipt"
            >
              <Printer className="w-4 h-4 mr-2" />
              Печать
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
