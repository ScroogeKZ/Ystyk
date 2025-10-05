import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, json, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("cashier"), // cashier, manager
  email: text("email"),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  categoryId: varchar("category_id").references(() => categories.id),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  expirationDate: timestamp("expiration_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  categoryIdx: index("products_category_idx").on(table.categoryId),
  expirationIdx: index("products_expiration_idx").on(table.expirationDate),
  activeIdx: index("products_active_idx").on(table.isActive),
  skuIdx: index("products_sku_idx").on(table.sku),
}));

// Customer Tiers (Уровни лояльности) - определяем до customers для ссылки
export const customerTiers = pgTable("customer_tiers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Bronze, Silver, Gold, Platinum
  minPoints: integer("min_points").notNull().default(0),
  maxPoints: integer("max_points"),
  discountPercent: decimal("discount_percent", { precision: 5, scale: 2 }).notNull().default("0"),
  color: text("color"), // For UI display
  benefits: text("benefits"), // Description of benefits
});

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
  tierId: varchar("tier_id").references(() => customerTiers.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  phoneIdx: index("customers_phone_idx").on(table.phone),
  emailIdx: index("customers_email_idx").on(table.email),
  tierIdx: index("customers_tier_idx").on(table.tierId),
}));

export const shifts = pgTable("shifts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  startTime: timestamp("start_time").notNull().defaultNow(),
  endTime: timestamp("end_time"),
  startingCash: decimal("starting_cash", { precision: 10, scale: 2 }).notNull(),
  endingCash: decimal("ending_cash", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("open"), // open, closed
}, (table) => ({
  userIdx: index("shifts_user_idx").on(table.userId),
  statusIdx: index("shifts_status_idx").on(table.status),
  startTimeIdx: index("shifts_start_time_idx").on(table.startTime),
}));

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  receiptNumber: text("receipt_number").notNull().unique(),
  shiftId: varchar("shift_id").notNull().references(() => shifts.id),
  customerId: varchar("customer_id").references(() => customers.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull(), // cash, card
  receivedAmount: decimal("received_amount", { precision: 10, scale: 2 }),
  changeAmount: decimal("change_amount", { precision: 10, scale: 2 }),
  status: text("status").notNull().default("completed"), // completed, refunded, cancelled
  isOffline: boolean("is_offline").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  shiftIdx: index("transactions_shift_idx").on(table.shiftId),
  customerIdx: index("transactions_customer_idx").on(table.customerId),
  userIdx: index("transactions_user_idx").on(table.userId),
  createdAtIdx: index("transactions_created_at_idx").on(table.createdAt),
  receiptIdx: index("transactions_receipt_idx").on(table.receiptNumber),
  statusIdx: index("transactions_status_idx").on(table.status),
}));

export const transactionItems = pgTable("transaction_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionId: varchar("transaction_id").notNull().references(() => transactions.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
}, (table) => ({
  transactionIdx: index("transaction_items_transaction_idx").on(table.transactionId),
  productIdx: index("transaction_items_product_idx").on(table.productId),
}));

export const returns = pgTable("returns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originalTransactionId: varchar("original_transaction_id").notNull().references(() => transactions.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  reason: text("reason"),
  refundAmount: decimal("refund_amount", { precision: 10, scale: 2 }).notNull(),
  refundMethod: text("refund_method").notNull(), // cash, card
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  transactionIdx: index("returns_transaction_idx").on(table.originalTransactionId),
  userIdx: index("returns_user_idx").on(table.userId),
  createdAtIdx: index("returns_created_at_idx").on(table.createdAt),
}));

export const returnItems = pgTable("return_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  returnId: varchar("return_id").notNull().references(() => returns.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
}, (table) => ({
  returnIdx: index("return_items_return_idx").on(table.returnId),
  productIdx: index("return_items_product_idx").on(table.productId),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true, createdAt: true });
export const insertShiftSchema = createInsertSchema(shifts).omit({ id: true, startTime: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertTransactionItemSchema = createInsertSchema(transactionItems).omit({ id: true, transactionId: true });
export const insertReturnSchema = createInsertSchema(returns).omit({ id: true, createdAt: true });
export const insertReturnItemSchema = createInsertSchema(returnItems).omit({ id: true, returnId: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Shift = typeof shifts.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type TransactionItem = typeof transactionItems.$inferSelect;
export type InsertTransactionItem = z.infer<typeof insertTransactionItemSchema>;
export type Return = typeof returns.$inferSelect;
export type InsertReturn = z.infer<typeof insertReturnSchema>;
export type ReturnItem = typeof returnItems.$inferSelect;
export type InsertReturnItem = z.infer<typeof insertReturnItemSchema>;

// Complex types for API responses
export type TransactionWithItems = Transaction & {
  items: (TransactionItem & { product: Product })[];
  customer?: Customer;
};

export type ProductWithCategory = Product & {
  category?: Category;
};

export type ShiftSummary = {
  shift: Shift;
  totalSales: string;
  totalTransactions: number;
  cashSales: string;
  cardSales: string;
};

// Goods Acceptance (Приемка товаров)
export const goodsAcceptance = pgTable("goods_acceptance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  expectedQuantity: integer("expected_quantity").notNull(),
  actualQuantity: integer("actual_quantity").notNull(),
  discrepancy: integer("discrepancy").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, partial, rejected
  supplierInvoice: text("supplier_invoice"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  acceptedBy: varchar("accepted_by").notNull().references(() => users.id),
}, (table) => ({
  productIdx: index("goods_acceptance_product_idx").on(table.productId),
  statusIdx: index("goods_acceptance_status_idx").on(table.status),
  createdAtIdx: index("goods_acceptance_created_at_idx").on(table.createdAt),
}));

// Inventory Audits (Инвентаризация)
export const inventoryAudits = pgTable("inventory_audits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  status: text("status").notNull().default("draft"), // draft, in_progress, completed, cancelled
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  createdBy: varchar("created_by").notNull().references(() => users.id),
}, (table) => ({
  statusIdx: index("inventory_audits_status_idx").on(table.status),
  createdAtIdx: index("inventory_audits_created_at_idx").on(table.createdAt),
}));

export const inventoryAuditItems = pgTable("inventory_audit_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  auditId: varchar("audit_id").notNull().references(() => inventoryAudits.id),
  productId: varchar("product_id").notNull().references(() => products.id),
  expectedQuantity: integer("expected_quantity").notNull(),
  actualQuantity: integer("actual_quantity").notNull(),
  variance: integer("variance").notNull(),
  status: text("status").notNull().default("pending"), // pending, counted, verified
  notes: text("notes"),
}, (table) => ({
  auditIdx: index("inventory_audit_items_audit_idx").on(table.auditId),
  productIdx: index("inventory_audit_items_product_idx").on(table.productId),
}));

// Write-offs (Списания)
export const writeOffs = pgTable("write_offs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  reason: text("reason").notNull(), // expired, damaged, theft, loss, defective, other
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by").notNull().references(() => users.id),
  approved: boolean("approved").notNull().default(false),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
}, (table) => ({
  productIdx: index("write_offs_product_idx").on(table.productId),
  reasonIdx: index("write_offs_reason_idx").on(table.reason),
  createdAtIdx: index("write_offs_created_at_idx").on(table.createdAt),
  approvedIdx: index("write_offs_approved_idx").on(table.approved),
}));

// Audit Logs (Аудит действий)
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: text("action").notNull(), // login, logout, create, update, delete, approve, etc.
  entityType: text("entity_type").notNull(), // product, user, transaction, etc.
  entityId: varchar("entity_id"),
  changes: json("changes"), // JSON with before/after values
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  userIdx: index("audit_logs_user_idx").on(table.userId),
  actionIdx: index("audit_logs_action_idx").on(table.action),
  entityIdx: index("audit_logs_entity_idx").on(table.entityType, table.entityId),
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
}));

// Insert schemas for new tables
export const insertCustomerTierSchema = createInsertSchema(customerTiers).omit({ id: true });
export const insertGoodsAcceptanceSchema = createInsertSchema(goodsAcceptance).omit({ id: true, createdAt: true });
export const insertInventoryAuditSchema = createInsertSchema(inventoryAudits).omit({ id: true, createdAt: true });
export const insertInventoryAuditItemSchema = createInsertSchema(inventoryAuditItems).omit({ id: true });
export const insertWriteOffSchema = createInsertSchema(writeOffs).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });

// Types for new tables
export type GoodsAcceptance = typeof goodsAcceptance.$inferSelect;
export type InsertGoodsAcceptance = z.infer<typeof insertGoodsAcceptanceSchema>;
export type InventoryAudit = typeof inventoryAudits.$inferSelect;
export type InsertInventoryAudit = z.infer<typeof insertInventoryAuditSchema>;
export type InventoryAuditItem = typeof inventoryAuditItems.$inferSelect;
export type InsertInventoryAuditItem = z.infer<typeof insertInventoryAuditItemSchema>;
export type WriteOff = typeof writeOffs.$inferSelect;
export type InsertWriteOff = z.infer<typeof insertWriteOffSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type CustomerTier = typeof customerTiers.$inferSelect;
export type InsertCustomerTier = z.infer<typeof insertCustomerTierSchema>;

// Complex types for new features
export type GoodsAcceptanceWithProduct = GoodsAcceptance & {
  product: ProductWithCategory;
  acceptedByUser: User;
};

export type InventoryAuditWithItems = InventoryAudit & {
  items: (InventoryAuditItem & { product: ProductWithCategory })[];
  createdByUser: User;
  totalItems: number;
  countedItems: number;
  totalVariance: number;
};

export type WriteOffWithProduct = WriteOff & {
  product: ProductWithCategory;
  createdByUser: User;
  approvedByUser?: User;
};

export type CustomerWithTier = Customer & {
  tier?: CustomerTier;
};
