import type { CartItem, CartSummary } from "./cart";
import type { Transaction, TransactionItem, InsertTransaction, InsertTransactionItem } from "@shared/schema";

export type PaymentMethod = 'cash' | 'card';

export interface PaymentRequest {
  method: PaymentMethod;
  amount: number;
  receivedAmount?: number;
}

export interface PaymentResult {
  success: boolean;
  changeAmount?: number;
  error?: string;
}

export interface TransactionBuilder {
  receiptNumber: string;
  shiftId: string;
  customerId?: string;
  userId: string;
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  receivedAmount?: number;
  changeAmount?: number;
  items: CartItem[];
}

// Pure functions for payment operations

/**
 * Validate payment amount
 */
export const validatePayment = (payment: PaymentRequest, totalAmount: number): PaymentResult => {
  if (payment.method === 'card') {
    return { success: true };
  }
  
  if (payment.method === 'cash') {
    const receivedAmount = payment.receivedAmount ?? payment.amount;
    
    if (receivedAmount < totalAmount) {
      return {
        success: false,
        error: 'Недостаточная сумма наличных'
      };
    }
    
    const changeAmount = receivedAmount - totalAmount;
    return {
      success: true,
      changeAmount: Math.round(changeAmount * 100) / 100
    };
  }
  
  return {
    success: false,
    error: 'Неподдерживаемый способ оплаты'
  };
};

/**
 * Generate receipt number
 */
export const generateReceiptNumber = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `RCP-${timestamp}-${random.toString().padStart(3, '0')}`;
};

/**
 * Build transaction from cart and payment data
 */
export const buildTransaction = (
  cart: CartItem[],
  summary: CartSummary,
  payment: PaymentRequest,
  paymentResult: PaymentResult,
  context: {
    shiftId: string;
    userId: string;
    customerId?: string;
  }
): TransactionBuilder => {
  return {
    receiptNumber: generateReceiptNumber(),
    shiftId: context.shiftId,
    customerId: context.customerId,
    userId: context.userId,
    subtotal: summary.subtotal,
    tax: summary.tax,
    total: summary.total,
    paymentMethod: payment.method,
    receivedAmount: payment.receivedAmount,
    changeAmount: paymentResult.changeAmount,
    items: [...cart] // immutable copy
  };
};

/**
 * Convert TransactionBuilder to InsertTransaction
 */
export const transactionBuilderToInsert = (builder: TransactionBuilder): InsertTransaction => ({
  receiptNumber: builder.receiptNumber,
  shiftId: builder.shiftId,
  customerId: builder.customerId || null,
  userId: builder.userId,
  subtotal: builder.subtotal.toString(),
  tax: builder.tax.toString(),
  total: builder.total.toString(),
  paymentMethod: builder.paymentMethod,
  receivedAmount: builder.receivedAmount?.toString(),
  changeAmount: builder.changeAmount?.toString(),
  status: 'completed',
  isOffline: false
});

/**
 * Convert cart items to transaction items
 */
export const cartItemsToTransactionItems = (
  cart: CartItem[],
  transactionId: string
): InsertTransactionItem[] => {
  return cart.map(item => ({
    transactionId,
    productId: item.id,
    quantity: item.quantity,
    unitPrice: item.price,
    totalPrice: (parseFloat(item.price) * item.quantity).toString()
  }));
};

/**
 * Calculate refund amount for return
 */
export const calculateRefundAmount = (
  originalItems: TransactionItem[],
  returnItems: { productId: string; quantity: number }[]
): number => {
  return returnItems.reduce((total, returnItem) => {
    const originalItem = originalItems.find(item => item.productId === returnItem.productId);
    if (!originalItem) return total;
    
    const unitPrice = parseFloat(originalItem.unitPrice);
    const refundQuantity = Math.min(returnItem.quantity, originalItem.quantity);
    
    return total + (unitPrice * refundQuantity);
  }, 0);
};

/**
 * Validate return request
 */
export const validateReturn = (
  originalItems: TransactionItem[],
  returnItems: { productId: string; quantity: number }[]
): { success: boolean; error?: string } => {
  for (const returnItem of returnItems) {
    const originalItem = originalItems.find(item => item.productId === returnItem.productId);
    
    if (!originalItem) {
      return {
        success: false,
        error: `Товар с ID ${returnItem.productId} не найден в оригинальной транзакции`
      };
    }
    
    if (returnItem.quantity > originalItem.quantity) {
      return {
        success: false,
        error: `Количество для возврата превышает оригинальное количество`
      };
    }
    
    if (returnItem.quantity <= 0) {
      return {
        success: false,
        error: `Неверное количество для возврата`
      };
    }
  }
  
  return { success: true };
};