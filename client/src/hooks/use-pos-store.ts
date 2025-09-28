import { create } from 'zustand';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { TransactionWithItems } from '@shared/schema';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  sku: string;
}

interface PaymentModalState {
  isOpen: boolean;
  method: 'cash' | 'card' | null;
  amount: number;
}

interface ReceiptModalState {
  isOpen: boolean;
  transaction: TransactionWithItems | null;
}

interface POSStore {
  // Cart state
  cart: CartItem[];
  selectedCustomer: string | null;
  
  // Modal states
  paymentModal: PaymentModalState;
  receiptModal: ReceiptModalState;
  
  // Cart actions
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setSelectedCustomer: (customerId: string | null) => void;
  
  // Payment actions
  openPaymentModal: (method: 'cash' | 'card', amount: number) => void;
  closePaymentModal: () => void;
  processPayment: (receivedAmount?: number, changeAmount?: number) => void;
  
  // Receipt actions
  openReceiptModal: (transaction: TransactionWithItems) => void;
  closeReceiptModal: () => void;
}

export const usePOSStore = create<POSStore>((set, get) => ({
  // Initial state
  cart: [],
  selectedCustomer: null,
  paymentModal: {
    isOpen: false,
    method: null,
    amount: 0,
  },
  receiptModal: {
    isOpen: false,
    transaction: null,
  },
  
  // Cart actions
  addToCart: (item) => {
    const { cart } = get();
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      if (existingItem.quantity < item.stock) {
        set({
          cart: cart.map(cartItem =>
            cartItem.id === item.id
              ? { ...cartItem, quantity: cartItem.quantity + 1 }
              : cartItem
          )
        });
      }
    } else {
      set({
        cart: [...cart, { ...item, quantity: 1 }]
      });
    }
  },
  
  removeFromCart: (id) => {
    const { cart } = get();
    set({
      cart: cart.filter(item => item.id !== id)
    });
  },
  
  updateQuantity: (id, quantity) => {
    const { cart } = get();
    if (quantity <= 0) {
      get().removeFromCart(id);
      return;
    }
    
    set({
      cart: cart.map(item =>
        item.id === id
          ? { ...item, quantity: Math.min(quantity, item.stock) }
          : item
      )
    });
  },
  
  clearCart: () => {
    set({ cart: [], selectedCustomer: null });
  },
  
  setSelectedCustomer: (customerId) => {
    set({ selectedCustomer: customerId === "new" ? null : customerId });
  },
  
  // Payment actions
  openPaymentModal: (method, amount) => {
    set({
      paymentModal: {
        isOpen: true,
        method,
        amount,
      }
    });
  },
  
  closePaymentModal: () => {
    set({
      paymentModal: {
        isOpen: false,
        method: null,
        amount: 0,
      }
    });
  },
  
  processPayment: (receivedAmount, changeAmount) => {
    const { cart, selectedCustomer, paymentModal } = get();
    
    if (cart.length === 0) return;
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;
    
    // Mock current user and shift - in real app this would come from auth context
    const currentUserId = Array.from(new Set([])).length > 0 ? 'real-user-id' : 'mock-user-id-' + Date.now();
    const currentShiftId = 'mock-shift-id-' + Date.now(); // This should come from current shift
    
    // Create transaction
    const transactionData = {
      shiftId: currentShiftId,
      customerId: selectedCustomer || undefined,
      userId: currentUserId,
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      paymentMethod: paymentModal.method!,
      receivedAmount: receivedAmount ? receivedAmount.toFixed(2) : total.toFixed(2),
      changeAmount: changeAmount ? changeAmount.toFixed(2) : '0.00',
      status: 'completed',
      isOffline: false, // TODO: Check actual network status
    };
    
    const items = cart.map(item => ({
      productId: item.id,
      quantity: item.quantity,
      unitPrice: item.price.toFixed(2),
      totalPrice: (item.price * item.quantity).toFixed(2),
    }));
    
    // Use mutation to create transaction
    const queryClient = useQueryClient();
    const { toast } = useToast();
    
    const createTransactionMutation = useMutation({
      mutationFn: async () => {
        const response = await apiRequest('POST', '/api/transactions', {
          transaction: transactionData,
          items,
        });
        return response.json();
      },
      onSuccess: (transaction: TransactionWithItems) => {
        // Clear cart and close payment modal
        set({
          cart: [],
          selectedCustomer: null,
          paymentModal: {
            isOpen: false,
            method: null,
            amount: 0,
          },
        });
        
        // Open receipt modal
        get().openReceiptModal(transaction);
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/products'] });
        queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
        
        toast({
          title: 'Успех',
          description: 'Транзакция завершена успешно',
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Ошибка',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
    
    createTransactionMutation.mutate();
  },
  
  // Receipt actions
  openReceiptModal: (transaction) => {
    set({
      receiptModal: {
        isOpen: true,
        transaction,
      }
    });
  },
  
  closeReceiptModal: () => {
    set({
      receiptModal: {
        isOpen: false,
        transaction: null,
      }
    });
  },
}));

// Helper hook for mutations within the store
export const usePOSMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const createTransactionMutation = useMutation({
    mutationFn: async ({ transaction, items }: any) => {
      const response = await apiRequest('POST', '/api/transactions', {
        transaction,
        items,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
  
  return {
    createTransactionMutation,
  };
};
