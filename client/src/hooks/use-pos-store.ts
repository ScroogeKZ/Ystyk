import { create } from 'zustand';
import type { TransactionWithItems } from '@shared/schema';
import { useSessionStore } from './use-session-store';
import { 
  addItemToCart, 
  removeItemFromCart, 
  updateItemQuantity, 
  clearCart, 
  calculateCartSummary,
  type CartItem,
  type CartSummary 
} from '@/domain/cart';
import { 
  validatePayment, 
  buildTransaction, 
  type PaymentMethod,
  type PaymentRequest 
} from '@/domain/payment';

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
  
  // Computed state
  cartSummary: CartSummary;
  
  // Pure cart actions
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  setSelectedCustomer: (customerId: string | null) => void;
  
  // Modal actions
  openPaymentModal: (method: PaymentMethod, amount: number) => void;
  closePaymentModal: () => void;
  openReceiptModal: (transaction: TransactionWithItems) => void;
  closeReceiptModal: () => void;
  
  // Payment preparation (pure functions)
  validatePaymentRequest: (payment: PaymentRequest) => ReturnType<typeof validatePayment>;
  prepareTransaction: () => { cart: CartItem[]; summary: CartSummary; context: any } | null;
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
  
  // Computed state - recalculated on every access
  get cartSummary() {
    return calculateCartSummary(get().cart);
  },
  
  // Pure cart actions using domain functions
  addToCart: (item) => {
    const { cart } = get();
    const newCart = addItemToCart(cart, item);
    set({ cart: newCart });
  },
  
  removeFromCart: (id) => {
    const { cart } = get();
    const newCart = removeItemFromCart(cart, id);
    set({ cart: newCart });
  },
  
  updateQuantity: (id, quantity) => {
    const { cart } = get();
    const newCart = updateItemQuantity(cart, id, quantity);
    set({ cart: newCart });
  },
  
  clearCart: () => {
    const newCart = clearCart();
    set({ cart: newCart, selectedCustomer: null });
  },
  
  setSelectedCustomer: (customerId) => {
    set({ selectedCustomer: customerId === "new" ? null : customerId });
  },
  
  // Modal actions
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
  
  // Pure payment functions
  validatePaymentRequest: (payment) => {
    const { cartSummary } = get();
    return validatePayment(payment, cartSummary.total);
  },
  
  prepareTransaction: () => {
    const { cart, cartSummary, selectedCustomer } = get();
    
    if (cart.length === 0) return null;
    
    // Get session from session store
    const session = useSessionStore.getState();
    
    // Ensure we have an active shift
    if (!session.currentShift) {
      return null;
    }
    
    // Use real shift and user IDs from session
    const context = {
      shiftId: session.currentShift.id,
      userId: session.userId,
      customerId: selectedCustomer || undefined,
    };
    
    // This will be used by external mutation hooks
    return {
      cart: [...cart],
      summary: cartSummary,
      context
    };
  },
}));
