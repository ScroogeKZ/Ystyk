import { type User, type InsertUser, type Product, type InsertProduct, type Category, type InsertCategory, type Customer, type InsertCustomer, type Transaction, type InsertTransaction, type TransactionItem, type InsertTransactionItem, type Shift, type InsertShift, type Return, type InsertReturn, type ReturnItem, type InsertReturnItem, type TransactionWithItems, type ProductWithCategory, type ShiftSummary } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Products
  getProducts(): Promise<ProductWithCategory[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<Product>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  updateProductStock(id: string, quantity: number): Promise<boolean>;

  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerByPhone(phone: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer | undefined>;
  updateCustomerLoyaltyPoints(id: string, points: number): Promise<boolean>;

  // Shifts
  getCurrentShift(userId: string): Promise<Shift | undefined>;
  createShift(shift: InsertShift): Promise<Shift>;
  closeShift(id: string, endingCash: number): Promise<Shift | undefined>;
  getShiftSummary(id: string): Promise<ShiftSummary | undefined>;

  // Transactions
  getTransactions(shiftId?: string): Promise<TransactionWithItems[]>;
  getTransaction(id: string): Promise<TransactionWithItems | undefined>;
  getTransactionByReceiptNumber(receiptNumber: string): Promise<TransactionWithItems | undefined>;
  createTransaction(transaction: InsertTransaction, items: InsertTransactionItem[]): Promise<TransactionWithItems>;
  updateTransactionStatus(id: string, status: string): Promise<boolean>;

  // Returns
  getReturns(): Promise<(Return & { originalTransaction: Transaction })[]>;
  createReturn(returnData: InsertReturn, items: InsertReturnItem[]): Promise<Return>;

  // Analytics
  getDailySales(date: Date): Promise<{ revenue: number; transactions: number; averageCheck: number }>;
  getTopProducts(limit: number): Promise<Array<{ product: Product; sold: number }>>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private categories: Map<string, Category> = new Map();
  private products: Map<string, Product> = new Map();
  private customers: Map<string, Customer> = new Map();
  private shifts: Map<string, Shift> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private transactionItems: Map<string, TransactionItem[]> = new Map();
  private returns: Map<string, Return> = new Map();
  private returnItems: Map<string, ReturnItem[]> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create default categories
    const beverages: Category = {
      id: randomUUID(),
      name: "Напитки",
      description: "Горячие и холодные напитки"
    };
    const pastry: Category = {
      id: randomUUID(),
      name: "Выпечка",
      description: "Свежая выпечка и десерты"
    };
    const snacks: Category = {
      id: randomUUID(),
      name: "Закуски",
      description: "Легкие закуски и снеки"
    };

    this.categories.set(beverages.id, beverages);
    this.categories.set(pastry.id, pastry);
    this.categories.set(snacks.id, snacks);

    // Create default products
    const products: Product[] = [
      {
        id: randomUUID(),
        sku: "ESP001",
        name: "Эспрессо",
        description: "Классический эспрессо",
        price: "120.00",
        stock: 25,
        categoryId: beverages.id,
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        sku: "CRS001",
        name: "Круассан",
        description: "Французский круассан с маслом",
        price: "180.00",
        stock: 12,
        categoryId: pastry.id,
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        sku: "JCE001",
        name: "Сок апельсиновый",
        description: "Свежевыжатый апельсиновый сок",
        price: "150.00",
        stock: 8,
        categoryId: beverages.id,
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        sku: "SND001",
        name: "Сэндвич с курицей",
        description: "Сэндвич с жареной курицей и овощами",
        price: "320.00",
        stock: 6,
        categoryId: snacks.id,
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        sku: "ICE001",
        name: "Мороженое ванильное",
        description: "Классическое ванильное мороженое",
        price: "95.00",
        stock: 15,
        categoryId: pastry.id,
        isActive: true,
        createdAt: new Date()
      },
      {
        id: randomUUID(),
        sku: "WTR001",
        name: "Вода минеральная",
        description: "Минеральная вода без газа",
        price: "60.00",
        stock: 30,
        categoryId: beverages.id,
        isActive: true,
        createdAt: new Date()
      }
    ];

    products.forEach(product => {
      this.products.set(product.id, product);
    });

    // Create default user
    const defaultUser: User = {
      id: randomUUID(),
      username: "cashier",
      password: "password", // In real app, this would be hashed
      role: "cashier",
      email: "cashier@pos.local"
    };
    this.users.set(defaultUser.id, defaultUser);
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { 
      ...insertUser, 
      id: randomUUID(),
      role: insertUser.role || "cashier",
      email: insertUser.email || null
    };
    this.users.set(user.id, user);
    return user;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const category: Category = { 
      ...insertCategory, 
      id: randomUUID(),
      description: insertCategory.description || null
    };
    this.categories.set(category.id, category);
    return category;
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    const updated = { ...category, ...updates };
    this.categories.set(id, updated);
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  // Products
  async getProducts(): Promise<ProductWithCategory[]> {
    return Array.from(this.products.values()).map(product => ({
      ...product,
      category: product.categoryId ? this.categories.get(product.categoryId) : undefined
    }));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(product => product.sku === sku);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const product: Product = { 
      ...insertProduct, 
      id: randomUUID(),
      createdAt: new Date(),
      description: insertProduct.description || null,
      categoryId: insertProduct.categoryId || null,
      stock: insertProduct.stock || 0,
      isActive: insertProduct.isActive ?? true
    };
    this.products.set(product.id, product);
    return product;
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    const updated = { ...product, ...updates };
    this.products.set(id, updated);
    return updated;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  async updateProductStock(id: string, quantity: number): Promise<boolean> {
    const product = this.products.get(id);
    if (!product) return false;
    product.stock = Math.max(0, product.stock + quantity);
    this.products.set(id, product);
    return true;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    return Array.from(this.customers.values()).find(customer => customer.phone === phone);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const customer: Customer = { 
      ...insertCustomer, 
      id: randomUUID(),
      loyaltyPoints: 0,
      createdAt: new Date(),
      phone: insertCustomer.phone || null,
      email: insertCustomer.email || null
    };
    this.customers.set(customer.id, customer);
    return customer;
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;
    const updated = { ...customer, ...updates };
    this.customers.set(id, updated);
    return updated;
  }

  async updateCustomerLoyaltyPoints(id: string, points: number): Promise<boolean> {
    const customer = this.customers.get(id);
    if (!customer) return false;
    customer.loyaltyPoints += points;
    this.customers.set(id, customer);
    return true;
  }

  // Shifts
  async getCurrentShift(userId: string): Promise<Shift | undefined> {
    return Array.from(this.shifts.values()).find(shift => 
      shift.userId === userId && shift.status === "open"
    );
  }

  async createShift(insertShift: InsertShift): Promise<Shift> {
    const shift: Shift = { 
      ...insertShift, 
      id: randomUUID(),
      startTime: new Date(),
      status: "open",
      endTime: null,
      endingCash: null
    };
    this.shifts.set(shift.id, shift);
    return shift;
  }

  async closeShift(id: string, endingCash: number): Promise<Shift | undefined> {
    const shift = this.shifts.get(id);
    if (!shift) return undefined;
    shift.endTime = new Date();
    shift.endingCash = endingCash.toString();
    shift.status = "closed";
    this.shifts.set(id, shift);
    return shift;
  }

  async getShiftSummary(id: string): Promise<ShiftSummary | undefined> {
    const shift = this.shifts.get(id);
    if (!shift) return undefined;

    const shiftTransactions = Array.from(this.transactions.values())
      .filter(t => t.shiftId === id);

    const totalSales = shiftTransactions
      .reduce((sum, t) => sum + parseFloat(t.total), 0)
      .toString();

    const cashSales = shiftTransactions
      .filter(t => t.paymentMethod === "cash")
      .reduce((sum, t) => sum + parseFloat(t.total), 0)
      .toString();

    const cardSales = shiftTransactions
      .filter(t => t.paymentMethod === "card")
      .reduce((sum, t) => sum + parseFloat(t.total), 0)
      .toString();

    return {
      shift,
      totalSales,
      totalTransactions: shiftTransactions.length,
      cashSales,
      cardSales
    };
  }

  // Transactions
  async getTransactions(shiftId?: string): Promise<TransactionWithItems[]> {
    const transactions = Array.from(this.transactions.values())
      .filter(t => !shiftId || t.shiftId === shiftId);

    return transactions.map(transaction => ({
      ...transaction,
      items: (this.transactionItems.get(transaction.id) || []).map(item => ({
        ...item,
        product: this.products.get(item.productId)!
      })),
      customer: transaction.customerId ? this.customers.get(transaction.customerId) : undefined
    }));
  }

  async getTransaction(id: string): Promise<TransactionWithItems | undefined> {
    const transaction = this.transactions.get(id);
    if (!transaction) return undefined;

    return {
      ...transaction,
      items: (this.transactionItems.get(id) || []).map(item => ({
        ...item,
        product: this.products.get(item.productId)!
      })),
      customer: transaction.customerId ? this.customers.get(transaction.customerId) : undefined
    };
  }

  async getTransactionByReceiptNumber(receiptNumber: string): Promise<TransactionWithItems | undefined> {
    const transaction = Array.from(this.transactions.values())
      .find(t => t.receiptNumber === receiptNumber);
    
    if (!transaction) return undefined;

    return {
      ...transaction,
      items: (this.transactionItems.get(transaction.id) || []).map(item => ({
        ...item,
        product: this.products.get(item.productId)!
      })),
      customer: transaction.customerId ? this.customers.get(transaction.customerId) : undefined
    };
  }

  async createTransaction(insertTransaction: InsertTransaction, items: InsertTransactionItem[]): Promise<TransactionWithItems> {
    const transaction: Transaction = { 
      ...insertTransaction, 
      id: randomUUID(),
      receiptNumber: `R${Date.now()}`,
      createdAt: new Date(),
      status: insertTransaction.status || "completed",
      customerId: insertTransaction.customerId || null,
      receivedAmount: insertTransaction.receivedAmount || null,
      changeAmount: insertTransaction.changeAmount || null,
      isOffline: insertTransaction.isOffline ?? false
    };

    const transactionItems: TransactionItem[] = items.map(item => ({
      ...item,
      id: randomUUID(),
      transactionId: transaction.id
    }));

    this.transactions.set(transaction.id, transaction);
    this.transactionItems.set(transaction.id, transactionItems);

    // Update product stock
    for (const item of transactionItems) {
      await this.updateProductStock(item.productId, -item.quantity);
    }

    return {
      ...transaction,
      items: transactionItems.map(item => ({
        ...item,
        product: this.products.get(item.productId)!
      })),
      customer: transaction.customerId ? this.customers.get(transaction.customerId) : undefined
    };
  }

  async updateTransactionStatus(id: string, status: string): Promise<boolean> {
    const transaction = this.transactions.get(id);
    if (!transaction) return false;
    transaction.status = status;
    this.transactions.set(id, transaction);
    return true;
  }

  // Returns
  async getReturns(): Promise<(Return & { originalTransaction: Transaction })[]> {
    return Array.from(this.returns.values()).map(returnItem => ({
      ...returnItem,
      originalTransaction: this.transactions.get(returnItem.originalTransactionId)!
    }));
  }

  async createReturn(insertReturn: InsertReturn, items: InsertReturnItem[]): Promise<Return> {
    const returnRecord: Return = { 
      ...insertReturn, 
      id: randomUUID(),
      createdAt: new Date(),
      reason: insertReturn.reason || null
    };

    const returnItems: ReturnItem[] = items.map(item => ({
      ...item,
      id: randomUUID(),
      returnId: returnRecord.id
    }));

    this.returns.set(returnRecord.id, returnRecord);
    this.returnItems.set(returnRecord.id, returnItems);

    // Update product stock (add back returned items)
    for (const item of returnItems) {
      await this.updateProductStock(item.productId, item.quantity);
    }

    return returnRecord;
  }

  // Analytics
  async getDailySales(date: Date): Promise<{ revenue: number; transactions: number; averageCheck: number }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dayTransactions = Array.from(this.transactions.values())
      .filter(t => t.createdAt >= startOfDay && t.createdAt <= endOfDay);

    const revenue = dayTransactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
    const transactions = dayTransactions.length;
    const averageCheck = transactions > 0 ? revenue / transactions : 0;

    return { revenue, transactions, averageCheck };
  }

  async getTopProducts(limit: number): Promise<Array<{ product: Product; sold: number }>> {
    const productSales: Map<string, number> = new Map();

    // Count sales for each product
    for (const items of Array.from(this.transactionItems.values())) {
      for (const item of items) {
        const current = productSales.get(item.productId) || 0;
        productSales.set(item.productId, current + item.quantity);
      }
    }

    // Sort and limit
    const sortedProducts = Array.from(productSales.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([productId, sold]) => ({
        product: this.products.get(productId)!,
        sold
      }));

    return sortedProducts;
  }
}

export const storage = new MemStorage();
