import { drizzle } from "drizzle-orm/neon-serverless";
import { users, categories, products } from "@shared/schema";
import ws from "ws";
import bcrypt from "bcrypt";

const db = drizzle({
  connection: process.env.DATABASE_URL!,
  ws: ws,
});

async function seed() {
  console.log("Seeding database...");

  const existingCategories = await db.select().from(categories);
  if (existingCategories.length > 0) {
    console.log("Database already seeded. Skipping...");
    return;
  }

  const [beverages, pastry, snacks] = await db.insert(categories).values([
    {
      name: "Напитки",
      description: "Горячие и холодные напитки"
    },
    {
      name: "Выпечка",
      description: "Свежая выпечка и десерты"
    },
    {
      name: "Закуски",
      description: "Легкие закуски и снеки"
    }
  ]).returning();

  await db.insert(products).values([
    {
      sku: "ESP001",
      name: "Эспрессо",
      description: "Классический эспрессо",
      price: "120.00",
      stock: 25,
      categoryId: beverages.id,
      isActive: true,
    },
    {
      sku: "CRS001",
      name: "Круассан",
      description: "Французский круассан с маслом",
      price: "180.00",
      stock: 12,
      categoryId: pastry.id,
      isActive: true,
    },
    {
      sku: "JCE001",
      name: "Сок апельсиновый",
      description: "Свежевыжатый апельсиновый сок",
      price: "150.00",
      stock: 8,
      categoryId: beverages.id,
      isActive: true,
    },
    {
      sku: "SND001",
      name: "Сэндвич с курицей",
      description: "Сэндвич с жареной курицей и овощами",
      price: "320.00",
      stock: 6,
      categoryId: snacks.id,
      isActive: true,
    },
    {
      sku: "ICE001",
      name: "Мороженое ванильное",
      description: "Классическое ванильное мороженое",
      price: "95.00",
      stock: 15,
      categoryId: pastry.id,
      isActive: true,
    },
    {
      sku: "WTR001",
      name: "Вода минеральная",
      description: "Минеральная вода без газа",
      price: "60.00",
      stock: 30,
      categoryId: beverages.id,
      isActive: true,
    }
  ]);

  const hashedPassword = await bcrypt.hash("password", 10);
  await db.insert(users).values({
    username: "cashier",
    password: hashedPassword,
    role: "cashier",
    email: "cashier@pos.local"
  });

  console.log("Database seeded successfully!");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error seeding database:", error);
    process.exit(1);
  });
