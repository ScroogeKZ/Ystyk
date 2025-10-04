import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import express from "express";
import passport from "passport";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";
import rateLimit from "express-rate-limit";
import { storage } from "./storage";
import { insertProductSchema, insertCustomerSchema, insertTransactionSchema, insertTransactionItemSchema, insertReturnSchema, insertReturnItemSchema, insertShiftSchema, type User } from "@shared/schema";
import { z } from "zod";

// Type for authenticated user (without password)
export type AuthUser = Omit<User, 'password'>;

// Type for authenticated requests
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

// Authentication middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Необходима авторизация" });
}

// Role-based authorization middleware
function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated() && req.user && (req.user as AuthUser).role === role) {
      return next();
    }
    res.status(403).json({ message: "Недостаточно прав доступа" });
  };
}

// Rate limiting for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 5, // максимум 5 попыток с одного IP
  message: 'Слишком много попыток входа. Пожалуйста, попробуйте позже.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "attached_assets", "products");

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage_config,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены (jpeg, jpg, png, gif, webp)'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes (public)
  app.post("/api/auth/login", loginLimiter, (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Ошибка авторизации" });
      }
      req.logIn(user, (err) => {
        if (err) {
          return next(err);
        }
        const { password, ...userWithoutPassword } = user;
        return res.json({ user: userWithoutPassword });
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Ошибка при выходе" });
      }
      res.json({ message: "Успешный выход" });
    });
  });

  app.get("/api/auth/session", (req, res) => {
    if (req.isAuthenticated() && req.user) {
      return res.json({ user: req.user as AuthUser });
    }
    res.status(401).json({ message: "Не авторизован" });
  });

  // User management routes (admin only)
  app.get("/api/users", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/users", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const { username, password, role, email } = req.body;
      
      if (!username || !password || !role) {
        return res.status(400).json({ message: "Необходимы username, password и role" });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        username,
        password: hashedPassword,
        role,
        email: email || null
      });
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/users/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const { id } = req.params;
      const { username, password, role, email } = req.body;
      
      const updates: any = {};
      if (username) updates.username = username;
      if (role) updates.role = role;
      if (email !== undefined) updates.email = email;
      if (password) {
        updates.password = await bcrypt.hash(password, 10);
      }
      
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireRole('admin'), async (req, res) => {
    try {
      const { id } = req.params;
      const currentUser = req.user as AuthUser;
      
      // Prevent deleting yourself
      if (currentUser.id === id) {
        return res.status(400).json({ message: "Нельзя удалить свой аккаунт" });
      }
      
      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "Пользователь не найден" });
      }
      
      res.json({ message: "Пользователь удален" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // All routes below require authentication
  // Products
  app.get("/api/products", requireAuth, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/products/expiring", requireAuth, async (req, res) => {
    try {
      const daysThreshold = parseInt(req.query.days as string) || 7;
      const expiringProducts = await storage.getExpiringProducts(daysThreshold);
      res.json(expiringProducts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/products", requireAuth, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, updates);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/products/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteProduct(id);
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Product Image Upload
  app.post("/api/products/upload-image", requireAuth, upload.single('image'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }
      
      // Return the relative URL path for the uploaded image
      const imageUrl = `/api/assets/products/${req.file.filename}`;
      res.json({ imageUrl });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Serve uploaded product images
  app.use("/api/assets/products", express.static(path.join(process.cwd(), "attached_assets", "products")));

  // Categories
  app.get("/api/categories", requireAuth, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Customers
  app.get("/api/customers", requireAuth, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/customers", requireAuth, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      res.json(customer);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/customers/phone/:phone", requireAuth, async (req, res) => {
    try {
      const { phone } = req.params;
      const customer = await storage.getCustomerByPhone(phone);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Shifts
  app.get("/api/shifts/current/:userId", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const shift = await storage.getCurrentShift(userId);
      res.json(shift);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/shifts", requireAuth, async (req, res) => {
    try {
      const shiftData = insertShiftSchema.parse(req.body);
      const shift = await storage.createShift(shiftData);
      res.json(shift);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/shifts/:id/close", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const closeShiftSchema = z.object({
        endingCash: z.number().min(0, "Конечная сумма не может быть отрицательной")
      });
      const { endingCash } = closeShiftSchema.parse(req.body);
      const shift = await storage.closeShift(id, endingCash);
      if (!shift) {
        return res.status(404).json({ message: "Shift not found" });
      }
      res.json(shift);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/shifts/:id/summary", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const summary = await storage.getShiftSummary(id);
      if (!summary) {
        return res.status(404).json({ message: "Shift not found" });
      }
      res.json(summary);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Transactions
  app.get("/api/transactions", requireAuth, async (req, res) => {
    try {
      const { shiftId } = req.query;
      const transactions = await storage.getTransactions(shiftId as string);
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/transactions/receipt/:receiptNumber", requireAuth, async (req, res) => {
    try {
      const { receiptNumber } = req.params;
      const transaction = await storage.getTransactionByReceiptNumber(receiptNumber);
      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(transaction);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/transactions", requireAuth, async (req, res) => {
    try {
      const { transaction, items } = req.body;
      const transactionData = insertTransactionSchema.parse(transaction);
      const itemsData = z.array(insertTransactionItemSchema).parse(items);
      
      const result = await storage.createTransaction(transactionData, itemsData);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Returns
  app.get("/api/returns", requireAuth, async (req, res) => {
    try {
      const returns = await storage.getReturns();
      res.json(returns);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/returns", requireAuth, async (req, res) => {
    try {
      const { returnData, items } = req.body;
      const returnInfo = insertReturnSchema.parse(returnData);
      const itemsData = z.array(insertReturnItemSchema).parse(items);
      
      const result = await storage.createReturn(returnInfo, itemsData);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Analytics
  app.get("/api/analytics/daily/:date", requireAuth, async (req, res) => {
    try {
      const { date } = req.params;
      const targetDate = new Date(date);
      const analytics = await storage.getDailySales(targetDate);
      res.json(analytics);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/analytics/top-products", requireAuth, async (req, res) => {
    try {
      const { limit = 10 } = req.query;
      const topProducts = await storage.getTopProducts(parseInt(limit as string));
      res.json(topProducts);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
