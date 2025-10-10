import { type User, type InsertUser, type Product, type InsertProduct, type Category, type InsertCategory, type Customer, type InsertCustomer, type Supplier, type InsertSupplier, type Transaction, type InsertTransaction, type TransactionItem, type InsertTransactionItem, type Shift, type InsertShift, type Return, type InsertReturn, type ReturnItem, type InsertReturnItem, type TransactionWithItems, type ProductWithCategory, type ShiftSummary, type GoodsAcceptance, type InsertGoodsAcceptance, type InventoryAudit, type InsertInventoryAudit, type InventoryAuditItem, type InsertInventoryAuditItem, type WriteOff, type InsertWriteOff, type AuditLog, type InsertAuditLog, type CustomerTier, type InsertCustomerTier, users, products, categories, customers, suppliers, shifts, transactions, transactionItems, returns, returnItems, goodsAcceptance, inventoryAudits, inventoryAuditItems, writeOffs, auditLogs, customerTiers } from "@shared/schema";
import { drizzle } from "drizzle-orm/node-postgres";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";
import pkg from "pg";
const { Pool } = pkg;

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<Category>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;

  // Products
  getProducts(): Promise<ProductWithCategory[]>;
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  getExpiringProducts(daysThreshold: number): Promise<ProductWithCategory[]>;
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
  getTransactionsByDateRange(startDate: string, endDate: string): Promise<TransactionWithItems[]>;
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
  getABCAnalysis(): Promise<Array<{ product: Product; revenue: number; category: 'A' | 'B' | 'C'; percentage: number }>>;
  getProfitabilityAnalysis(): Promise<Array<{ product: Product; revenue: number; margin: number; profit: number }>>;
  getSalesForecast(days: number): Promise<Array<{ date: string; predicted: number; confidence: number }>>;
  getActiveSessionsCount(): Promise<number>;
  
  // Goods Acceptance
  getGoodsAcceptance(): Promise<any[]>;
  createGoodsAcceptance(acceptance: any): Promise<any>;
  updateGoodsAcceptanceStatus(id: string, status: string): Promise<boolean>;
  
  // Inventory Audits
  getInventoryAudits(): Promise<any[]>;
  getInventoryAudit(id: string): Promise<any | undefined>;
  createInventoryAudit(audit: any): Promise<any>;
  addAuditItem(auditId: string, item: any): Promise<any>;
  updateAuditStatus(id: string, status: string, completedAt?: Date): Promise<boolean>;
  
  // Write-offs
  getWriteOffs(): Promise<any[]>;
  createWriteOff(writeOff: any): Promise<any>;
  approveWriteOff(id: string, approvedBy: string): Promise<boolean>;
  
  // Audit Logs
  createAuditLog(log: any): Promise<any>;
  getAuditLogs(userId?: string, action?: string): Promise<any[]>;
  
  // Customer Tiers
  getCustomerTiers(): Promise<any[]>;
  createCustomerTier(tier: any): Promise<any>;
  updateCustomerTier(id: string, tier: Partial<any>): Promise<any | undefined>;
  
  // Suppliers
  getSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<Supplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<boolean>;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
});

const db = drizzle({ client: pool });

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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount !== null && result.rowCount > 0;
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

  async getExpiringProducts(daysThreshold: number): Promise<ProductWithCategory[]> {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
    
    const result = await db
      .select()
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(
        and(
          sql`${products.expirationDate} IS NOT NULL`,
          lte(products.expirationDate, thresholdDate)
        )
      );
    
    return result.map(row => ({
      ...row.products,
      category: row.categories || undefined
    }));
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
    return await db.transaction(async (tx) => {
      const shift = await tx
        .select()
        .from(shifts)
        .where(eq(shifts.id, id))
        .limit(1);
      
      if (!shift[0]) {
        throw new Error('Смена не найдена');
      }
      
      if (shift[0].status === 'closed') {
        throw new Error('Смена уже закрыта');
      }
      
      const result = await tx
        .update(shifts)
        .set({ 
          endTime: new Date(), 
          endingCash: endingCash.toString(), 
          status: "closed" 
        })
        .where(eq(shifts.id, id))
        .returning();
      
      return result[0];
    });
  }

  async getShiftSummary(id: string): Promise<ShiftSummary | undefined> {
    try {
      const shift = await db.select().from(shifts).where(eq(shifts.id, id)).limit(1);
      if (!shift[0]) {
        return undefined;
      }

      const shiftTransactions = await db
        .select()
        .from(transactions)
        .where(eq(transactions.shiftId, id));

      if (shiftTransactions.length === 0) {
        return {
          shift: shift[0],
          totalSales: "0",
          totalTransactions: 0,
          cashSales: "0",
          cardSales: "0"
        };
      }

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
    } catch (error) {
      console.error('Error in getShiftSummary:', error);
      throw new Error('Не удалось получить сводку по смене');
    }
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

  async getTransactionsByDateRange(startDate: string, endDate: string): Promise<TransactionWithItems[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const txns = await db
      .select()
      .from(transactions)
      .where(
        and(
          gte(transactions.createdAt, start),
          lte(transactions.createdAt, end)
        )
      )
      .orderBy(desc(transactions.createdAt));
    
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
        await tx.update(products)
          .set({ stock: sql`GREATEST(0, stock - ${item.quantity})` })
          .where(eq(products.id, item.productId));
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
        await tx.update(products)
          .set({ stock: sql`stock + ${item.quantity}` })
          .where(eq(products.id, item.productId));
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

  async getABCAnalysis(): Promise<Array<{ product: Product; revenue: number; category: 'A' | 'B' | 'C'; percentage: number }>> {
    const result = await db
      .select({
        productId: transactionItems.productId,
        revenue: sql<number>`CAST(SUM(${transactionItems.totalPrice}) AS DECIMAL)`
      })
      .from(transactionItems)
      .groupBy(transactionItems.productId)
      .orderBy(desc(sql`SUM(${transactionItems.totalPrice})`));

    const totalRevenue = result.reduce((sum, item) => sum + parseFloat(item.revenue.toString()), 0);
    let cumulativePercentage = 0;

    const analysis = await Promise.all(
      result.map(async (item) => {
        const revenue = parseFloat(item.revenue.toString());
        const percentage = (revenue / totalRevenue) * 100;
        cumulativePercentage += percentage;
        
        let category: 'A' | 'B' | 'C';
        if (cumulativePercentage <= 80) {
          category = 'A';
        } else if (cumulativePercentage <= 95) {
          category = 'B';
        } else {
          category = 'C';
        }

        return {
          product: (await this.getProduct(item.productId))!,
          revenue,
          category,
          percentage
        };
      })
    );

    return analysis;
  }

  async getProfitabilityAnalysis(): Promise<Array<{ product: Product; revenue: number; margin: number; profit: number }>> {
    const result = await db
      .select({
        productId: transactionItems.productId,
        revenue: sql<number>`CAST(SUM(${transactionItems.totalPrice}) AS DECIMAL)`,
        cost: sql<number>`CAST(SUM(${transactionItems.quantity} * ${products.price} * 0.6) AS DECIMAL)`
      })
      .from(transactionItems)
      .leftJoin(products, eq(transactionItems.productId, products.id))
      .groupBy(transactionItems.productId)
      .orderBy(desc(sql`SUM(${transactionItems.totalPrice})`));

    const analysis = await Promise.all(
      result.map(async (item) => {
        const revenue = parseFloat(item.revenue.toString());
        const cost = parseFloat(item.cost?.toString() || '0');
        const profit = revenue - cost;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        return {
          product: (await this.getProduct(item.productId))!,
          revenue,
          margin,
          profit
        };
      })
    );

    return analysis;
  }

  async getSalesForecast(days: number): Promise<Array<{ date: string; predicted: number; confidence: number }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const historicalSales = await db
      .select({
        date: sql<string>`DATE(${transactions.createdAt})`,
        total: sql<number>`CAST(SUM(${transactions.total}) AS DECIMAL)`
      })
      .from(transactions)
      .where(
        and(
          gte(transactions.createdAt, startDate),
          lte(transactions.createdAt, endDate)
        )
      )
      .groupBy(sql`DATE(${transactions.createdAt})`)
      .orderBy(sql`DATE(${transactions.createdAt})`);

    const dailyAvg = historicalSales.reduce((sum, day) => sum + parseFloat(day.total.toString()), 0) / historicalSales.length;
    const forecast: Array<{ date: string; predicted: number; confidence: number }> = [];

    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date();
      forecastDate.setDate(forecastDate.getDate() + i);
      
      const dayOfWeek = forecastDate.getDay();
      const weekendMultiplier = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.2 : 1.0;
      const predicted = dailyAvg * weekendMultiplier;
      const confidence = Math.max(0.6, 1 - (i * 0.02));

      forecast.push({
        date: forecastDate.toISOString().split('T')[0],
        predicted: Math.round(predicted),
        confidence: Math.round(confidence * 100) / 100
      });
    }

    return forecast;
  }

  async getActiveSessionsCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(shifts)
      .where(eq(shifts.status, 'open'));
    
    return result[0]?.count || 0;
  }

  // Goods Acceptance
  async getGoodsAcceptance(): Promise<GoodsAcceptance[]> {
    return db.select().from(goodsAcceptance).orderBy(desc(goodsAcceptance.createdAt));
  }

  async createGoodsAcceptance(acceptance: InsertGoodsAcceptance): Promise<GoodsAcceptance> {
    const [result] = await db.insert(goodsAcceptance).values(acceptance).returning();
    
    if (acceptance.status === 'accepted') {
      await db.update(products)
        .set({ stock: sql`stock + ${acceptance.actualQuantity}` })
        .where(eq(products.id, acceptance.productId));
    }
    
    return result;
  }

  async updateGoodsAcceptanceStatus(id: string, status: string): Promise<boolean> {
    const [acceptance] = await db.select().from(goodsAcceptance).where(eq(goodsAcceptance.id, id));
    if (!acceptance) return false;

    await db.update(goodsAcceptance).set({ status }).where(eq(goodsAcceptance.id, id));
    
    if (status === 'accepted' && acceptance.status !== 'accepted') {
      await db.update(products)
        .set({ stock: sql`stock + ${acceptance.actualQuantity}` })
        .where(eq(products.id, acceptance.productId));
    }
    
    return true;
  }

  // Inventory Audits
  async getInventoryAudits(): Promise<InventoryAudit[]> {
    return db.select().from(inventoryAudits).orderBy(desc(inventoryAudits.createdAt));
  }

  async getInventoryAudit(id: string): Promise<InventoryAudit | undefined> {
    const [result] = await db.select().from(inventoryAudits).where(eq(inventoryAudits.id, id));
    return result;
  }

  async createInventoryAudit(audit: InsertInventoryAudit): Promise<InventoryAudit> {
    const [result] = await db.insert(inventoryAudits).values(audit).returning();
    return result;
  }

  async addAuditItem(auditId: string, item: InsertInventoryAuditItem): Promise<InventoryAuditItem> {
    const [result] = await db.insert(inventoryAuditItems).values({ ...item, auditId }).returning();
    return result;
  }

  async updateAuditStatus(id: string, status: string, completedAt?: Date): Promise<boolean> {
    const updateData: any = { status };
    if (completedAt) {
      updateData.completedAt = completedAt;
    }
    
    await db.update(inventoryAudits).set(updateData).where(eq(inventoryAudits.id, id));
    return true;
  }

  // Write-offs
  async getWriteOffs(): Promise<WriteOff[]> {
    return db.select().from(writeOffs).orderBy(desc(writeOffs.createdAt));
  }

  async createWriteOff(writeOff: InsertWriteOff): Promise<WriteOff> {
    return db.transaction(async (tx) => {
      const [result] = await tx.insert(writeOffs).values(writeOff).returning();
      
      if (result.approved) {
        await tx.update(products)
          .set({ stock: sql`stock - ${result.quantity}` })
          .where(eq(products.id, result.productId));
      }
      
      return result;
    });
  }

  async approveWriteOff(id: string, approvedBy: string): Promise<boolean> {
    return db.transaction(async (tx) => {
      const [writeOff] = await tx.select().from(writeOffs).where(eq(writeOffs.id, id));
      if (!writeOff) return false;

      await tx.update(writeOffs)
        .set({ 
          approved: true, 
          approvedBy, 
          approvedAt: new Date() 
        })
        .where(eq(writeOffs.id, id));

      await tx.update(products)
        .set({ stock: sql`stock - ${writeOff.quantity}` })
        .where(eq(products.id, writeOff.productId));

      return true;
    });
  }

  // Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [result] = await db.insert(auditLogs).values(log).returning();
    return result;
  }

  async getAuditLogs(userId?: string, action?: string): Promise<AuditLog[]> {
    let query = db.select().from(auditLogs);
    
    const conditions = [];
    if (userId) conditions.push(eq(auditLogs.userId, userId));
    if (action) conditions.push(eq(auditLogs.action, action));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return query.orderBy(desc(auditLogs.createdAt));
  }

  // Customer Tiers
  async getCustomerTiers(): Promise<CustomerTier[]> {
    return db.select().from(customerTiers).orderBy(customerTiers.minPoints);
  }

  async createCustomerTier(tier: InsertCustomerTier): Promise<CustomerTier> {
    const [result] = await db.insert(customerTiers).values(tier).returning();
    return result;
  }

  async updateCustomerTier(id: string, tier: Partial<CustomerTier>): Promise<CustomerTier | undefined> {
    const [result] = await db.update(customerTiers).set(tier).where(eq(customerTiers.id, id)).returning();
    return result;
  }

  async getSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers).orderBy(suppliers.name);
  }

  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [result] = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    return result;
  }

  async createSupplier(supplier: InsertSupplier): Promise<Supplier> {
    const [result] = await db.insert(suppliers).values(supplier).returning();
    return result;
  }

  async updateSupplier(id: string, supplier: Partial<Supplier>): Promise<Supplier | undefined> {
    const [result] = await db.update(suppliers).set(supplier).where(eq(suppliers.id, id)).returning();
    return result;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}

export const storage = new PostgresStorage();
