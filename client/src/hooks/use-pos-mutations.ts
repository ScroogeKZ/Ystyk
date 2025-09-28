import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { usePOSStore } from './use-pos-store';
import { 
  buildTransaction, 
  transactionBuilderToInsert, 
  cartItemsToTransactionItems,
  type PaymentRequest 
} from '@/domain/payment';
import type { TransactionWithItems } from '@shared/schema';

/**
 * Separate hook for POS mutations following functional programming principles
 * Side effects are isolated from pure state management
 */
export const usePOSMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { 
    prepareTransaction, 
    validatePaymentRequest, 
    clearCart, 
    closePaymentModal, 
    openReceiptModal 
  } = usePOSStore();

  const createTransactionMutation = useMutation({
    mutationFn: async (payment: PaymentRequest) => {
      // Get transaction data from store
      const transactionData = prepareTransaction();
      if (!transactionData) {
        throw new Error('Корзина пуста');
      }

      // Validate payment
      const paymentResult = validatePaymentRequest(payment);
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Ошибка валидации платежа');
      }

      // Build transaction using pure functions
      const transactionBuilder = buildTransaction(
        transactionData.cart,
        transactionData.summary,
        payment,
        paymentResult,
        transactionData.context
      );

      // Convert to API format
      const transactionInsert = transactionBuilderToInsert(transactionBuilder);
      
      // Make API call
      const response = await apiRequest('POST', '/api/transactions', {
        transaction: transactionInsert,
        items: cartItemsToTransactionItems(transactionBuilder.items, 'temp-id')
      });
      
      return response.json();
    },
    onSuccess: (transaction: TransactionWithItems) => {
      // Clear cart and close modal using pure actions
      clearCart();
      closePaymentModal();
      
      // Open receipt modal
      openReceiptModal(transaction);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      
      toast({
        title: 'Успех',
        description: 'Транзакция завершена успешно',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const createReturnMutation = useMutation({
    mutationFn: async ({ 
      originalTransactionId, 
      returnItems, 
      reason 
    }: {
      originalTransactionId: string;
      returnItems: { productId: string; quantity: number }[];
      reason?: string;
    }) => {
      const response = await apiRequest('POST', '/api/returns', {
        originalTransactionId,
        returnItems,
        reason,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/returns'] });
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      
      toast({
        title: 'Успех',
        description: 'Возврат оформлен успешно',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    createTransaction: createTransactionMutation,
    createReturn: createReturnMutation,
  };
};