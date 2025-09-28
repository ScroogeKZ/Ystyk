import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Delete } from "lucide-react";
import { usePOSStore } from "@/hooks/use-pos-store";

export default function PaymentModal() {
  const { paymentModal, closePaymentModal, processPayment } = usePOSStore();
  const [receivedAmount, setReceivedAmount] = useState(0);

  const change = Math.max(0, receivedAmount - paymentModal.amount);
  const canProcess = receivedAmount >= paymentModal.amount;

  useEffect(() => {
    setReceivedAmount(0);
  }, [paymentModal.isOpen]);

  const handleNumberClick = (value: string) => {
    if (value === "00") {
      setReceivedAmount(prev => prev * 100);
    } else {
      setReceivedAmount(prev => parseInt(prev.toString() + value));
    }
  };

  const handleBackspace = () => {
    setReceivedAmount(prev => Math.floor(prev / 10));
  };

  const handleProcess = () => {
    if (canProcess) {
      processPayment(receivedAmount, change);
    }
  };

  if (!paymentModal.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="payment-modal">
      <div className="bg-card border border-border rounded-lg w-96 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-card-foreground">
            Оплата {paymentModal.method === "cash" ? "наличными" : "картой"}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={closePaymentModal}
            data-testid="close-payment-modal"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Amount Display */}
        <div className="bg-muted rounded-lg p-4 mb-4">
          <p className="text-sm text-muted-foreground mb-1">К оплате:</p>
          <p className="text-2xl font-bold text-primary" data-testid="payment-amount">
            ₽{paymentModal.amount.toFixed(2)}
          </p>
        </div>
        
        {paymentModal.method === "cash" && (
          <>
            <div className="bg-input rounded-lg p-4 mb-4">
              <p className="text-sm text-muted-foreground mb-1">Получено:</p>
              <p className="text-2xl font-bold text-card-foreground" data-testid="received-amount">
                ₽{receivedAmount}
              </p>
            </div>
            
            <div className="bg-accent rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground mb-1">Сдача:</p>
              <p className="text-2xl font-bold text-green-600" data-testid="change-amount">
                ₽{change.toFixed(2)}
              </p>
            </div>
            
            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <Button
                  key={num}
                  variant="outline"
                  className="number-pad-btn"
                  onClick={() => handleNumberClick(num.toString())}
                  data-testid={`number-${num}`}
                >
                  {num}
                </Button>
              ))}
              <Button
                variant="outline"
                className="number-pad-btn"
                onClick={() => handleNumberClick("00")}
                data-testid="number-00"
              >
                00
              </Button>
              <Button
                variant="outline"
                className="number-pad-btn"
                onClick={() => handleNumberClick("0")}
                data-testid="number-0"
              >
                0
              </Button>
              <Button
                variant="destructive"
                className="number-pad-btn"
                onClick={handleBackspace}
                data-testid="backspace"
              >
                <Delete className="w-4 h-4" />
              </Button>
            </div>
          </>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={closePaymentModal}
            data-testid="cancel-payment"
          >
            Отмена
          </Button>
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            onClick={handleProcess}
            disabled={paymentModal.method === "cash" && !canProcess}
            data-testid="process-payment"
          >
            Завершить
          </Button>
        </div>
      </div>
    </div>
  );
}
