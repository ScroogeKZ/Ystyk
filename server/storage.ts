import { type User, type InsertUser, type Product, type InsertProduct, type Category, type InsertCategory, type Customer, type InsertCustomer, type Transaction, type InsertTransaction, type TransactionItem, type InsertTransactionItem, type Shift, type InsertShift, type Return, type InsertReturn, type ReturnItem, type InsertReturnItem, type TransactionWithItems, type ProductWithCategory, type ShiftSummary, users, products, categories, customers, shifts, transactions, transactionItems, returns, returnItems } from "@shared/schema";
import { drizzle } from "drizzle-orm/neon-serverless";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import ws from "ws";

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

const db = drizzle({
  connection: process.env.DATABASE_URL!,
  ws: ws,
});

export class PostgresStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const result = await db.insert(categories).values(insertCategory).returning();
    return result[0];
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | undefined> {
    const result = await db.update(categories).set(updates).where(eq(categories.id, id)).returning();
    return result[0];
  }

  async deleteCategory(id: string): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Products
  async getProducts(): Promise<ProductWithCategory[]> {
    const result = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id));
    
    return result.map(row => ({
      ...row.products,
      category: row.categories || undefined
    }));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.sku, sku)).limit(1);
    return result[0];
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const result = await db.insert(products).values(insertProduct).returning();
    return result[0];
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | undefined> {
    const result = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    return result[0];
  }

  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateProductStock(id: string, quantity: number): Promise<boolean> {
    const product = await this.getProduct(id);
    if (!product) return false;
    
    const newStock = Math.max(0, product.stock + quantity);
    await db.update(products).set({ stock: newStock }).where(eq(products.id, id));
    return true;
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers);
  }

  async getCustomer(id: string): Promise<Customer | undefined> {
    const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
    return result[0];
  }

  async getCustomerByPhone(phone: string): Promise<Customer | undefined> {
    const result = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);
    return result[0];
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const result = await db.insert(customers).values(insertCustomer).returning();
    return result[0];
  }

  async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer | undefined> {
    const result = await db.update(customers).set(updates).where(eq(customers.id, id)).returning();
    return result[0];
  }

  async updateCustomerLoyaltyPoints(id: string, points: number): Promise<boolean> {
    const customer = await this.getCustomer(id);
    if (!customer) return false;
    
    const newPoints = customer.loyaltyPoints + points;
    await db.update(customers).set({ loyaltyPoints: newPoints }).where(eq(customers.id, id));
    return true;
  }

  // Shifts
  async getCurrentShift(userId: string): Promise<Shift | undefined> {
    const result = await db
      .select()
      .from(shifts)
      .where(and(eq(shifts.userId, userId), eq(shifts.status, "open")))
      .limit(1);
    return result[0];
  }

  async createShift(insertShift: InsertShift): Promise<Shift> {
    const result = await db.insert(shifts).values(insertShift).returning();
    return result[0];
  }

  async closeShift(id: string, endingCash: number): Promise<Shift | undefined> {
    const result = await db
      .update(shifts)
      .set({ 
        endTime: new Date(), 
        endingCash: endingCash.toString(), 
        status: "closed" 
      })
      .where(eq(shifts.id, id))
      .returning();
    return result[0];
  }

  async getShiftSummary(id: string): Promise<ShiftSummary | undefined> {
    const shift = await db.select().from(shifts).where(eq(shifts.id, id)).limit(1);
    if (!shift[0]) return undefined;

    const shiftTransactions = await db
      .select()
      .from(transactions)
      .where(eq(transactions.shiftId, id));

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
      shift: shift[0],
      totalSales,
      totalTransactions: shiftTransactions.length,
      cashSales,
      cardSales
    };
  }

  // Transactions
  async getTransactions(shiftId?: string): Promise<TransactionWithItems[]> {
    const query = shiftId 
      ? db.select().from(transactions).where(eq(transactions.shiftId, shiftId))
      : db.select().from(transactions);
    
    const txns = await query;
    
    const result: TransactionWithItems[] = [];
    for (const txn of txns) {
      const items = await db
        .select()
        .from(transactionItems)
        .leftJoin(products, eq(transactionItems.productId, products.id))
        .where(eq(transactionItems.transactionId, txn.id));
      
      const customer = txn.customerId 
        ? await this.getCustomer(txn.customerId)
        : undefined;
      
      result.push({
        ...txn,
        items: items.map(item => ({
          ...item.transaction_items,
          product: item.products!
        })),
        customer
      });
    }
    
    return result;
  }

  async getTransaction(id: string): Promise<TransactionWithItems | undefined> {
    const txn = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1);
    if (!txn[0]) return undefined;

    const items = await db
      .select()
      .from(transactionItems)
      .leftJoin(products, eq(transactionItems.productId, products.id))
      .where(eq(transactionItems.transactionId, id));
    
    const customer = txn[0].customerId 
      ? await this.getCustomer(txn[0].customerId)
      : undefined;

    return {
      ...txn[0],
      items: items.map(item => ({
        ...item.transaction_items,
        product: item.products!
      })),
      customer
    };
  }

  async getTransactionByReceiptNumber(receiptNumber: string): Promise<TransactionWithItems | undefined> {
    const txn = await db
      .select()
      .from(transactions)
      .where(eq(transactions.receiptNumber, receiptNumber))
      .limit(1);
    
    if (!txn[0]) return undefined;

    const items = await db
      .select()
      .from(transactionItems)
      .leftJoin(products, eq(transactionItems.productId, products.id))
      .where(eq(transactionItems.transactionId, txn[0].id));
    
    const customer = txn[0].customerId 
      ? await this.getCustomer(txn[0].customerId)
      : undefined;

    return {
      ...txn[0],
      items: items.map(item => ({
        ...item.transaction_items,
        product: item.products!
      })),
      customer
    };
  }

  async createTransaction(insertTransaction: InsertTransaction, items: InsertTransactionItem[]): Promise<TransactionWithItems> {
    return await db.transaction(async (tx) => {
      const txn = await tx.insert(transactions).values(insertTransaction).returning();
      
      const itemsWithTransactionId = items.map(item => ({
        ...item,
        transactionId: txn[0].id
      }));
      
      const insertedItems = await tx.insert(transactionItems).values(itemsWithTransactionId).returning();
      
      for (const item of insertedItems) {
        const product = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
        if (product[0]) {
          const newStock = Math.max(0, product[0].stock - item.quantity);
          await tx.update(products)
            .set({ stock: newStock })
            .where(eq(products.id, item.productId));
        }
      }
      
      const itemsWithProducts = await Promise.all(
        insertedItems.map(async (item) => {
          const product = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
          return {
            ...item,
            product: product[0]!
          };
        })
      );
      
      const customer = txn[0].customerId 
        ? (await tx.select().from(customers).where(eq(customers.id, txn[0].customerId)).limit(1))[0]
        : undefined;

      return {
        ...txn[0],
        items: itemsWithProducts,
        customer
      };
    });
  }

  async updateTransactionStatus(id: string, status: string): Promise<boolean> {
    const result = await db.update(transactions).set({ status }).where(eq(transactions.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Returns
  async getReturns(): Promise<(Return & { originalTransaction: Transaction })[]> {
    const returnRecords = await db.select().from(returns);
    
    const result = await Promise.all(
      returnRecords.map(async (returnRecord) => {
        const originalTxn = await db
          .select()
          .from(transactions)
          .where(eq(transactions.id, returnRecord.originalTransactionId))
          .limit(1);
        
        return {
          ...returnRecord,
          originalTransaction: originalTxn[0]
        };
      })
    );
    
    return result;
  }

  async createReturn(insertReturn: InsertReturn, items: InsertReturnItem[]): Promise<Return> {
    return await db.transaction(async (tx) => {
      const returnRecord = await tx.insert(returns).values(insertReturn).returning();
      
      const itemsWithReturnId = items.map(item => ({
        ...item,
        returnId: returnRecord[0].id
      }));
      
      const insertedItems = await tx.insert(returnItems).values(itemsWithReturnId).returning();
      
      for (const item of insertedItems) {
        const product = await tx.select().from(products).where(eq(products.id, item.productId)).limit(1);
        if (product[0]) {
          await tx.update(products)
            .set({ stock: product[0].stock + item.quantity })
            .where(eq(products.id, item.productId));
        }
      }
      
      return returnRecord[0];
    });
  }

  // Analytics
  async getDailySales(date: Date): Promise<{ revenue: number; transactions: number; averageCheck: number }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const dayTransactions = await db
      .select()
      .from(transactions)
      .where(and(
        gte(transactions.createdAt, startOfDay),
        lte(transactions.createdAt, endOfDay)
      ));

    const revenue = dayTransactions.reduce((sum, t) => sum + parseFloat(t.total), 0);
    const transactionCount = dayTransactions.length;
    const averageCheck = transactionCount > 0 ? revenue / transactionCount : 0;

    return { revenue, transactions: transactionCount, averageCheck };
  }

  async getTopProducts(limit: number): Promise<Array<{ product: Product; sold: number }>> {
    const result = await db
      .select({
        productId: transactionItems.productId,
        sold: sql<number>`CAST(SUM(${transactionItems.quantity}) AS INTEGER)`
      })
      .from(transactionItems)
      .groupBy(transactionItems.productId)
      .orderBy(desc(sql`SUM(${transactionItems.quantity})`))
      .limit(limit);

    const topProducts = await Promise.all(
      result.map(async (item) => ({
        product: (await this.getProduct(item.productId))!,
        sold: item.sold
      }))
    );

    return topProducts;
  }
}

export const storage = new PostgresStorage();
