import { PrismaClient, CategoryType } from "@prisma/client";

const prisma = new PrismaClient();

const defaultCategories = [
  // Income
  { name: "Salary", icon: "briefcase", color: "#10b981", type: CategoryType.INCOME },
  { name: "Freelance", icon: "laptop", color: "#3b82f6", type: CategoryType.INCOME },
  { name: "Investment", icon: "trending-up", color: "#8b5cf6", type: CategoryType.INCOME },
  { name: "Gift", icon: "gift", color: "#f59e0b", type: CategoryType.INCOME },
  { name: "Other Income", icon: "plus-circle", color: "#6b7280", type: CategoryType.INCOME },
  // Expense
  { name: "Food & Dining", icon: "utensils", color: "#ef4444", type: CategoryType.EXPENSE },
  { name: "Transportation", icon: "car", color: "#f97316", type: CategoryType.EXPENSE },
  { name: "Shopping", icon: "shopping-bag", color: "#ec4899", type: CategoryType.EXPENSE },
  { name: "Entertainment", icon: "film", color: "#a855f7", type: CategoryType.EXPENSE },
  { name: "Healthcare", icon: "heart", color: "#14b8a6", type: CategoryType.EXPENSE },
  { name: "Education", icon: "book", color: "#3b82f6", type: CategoryType.EXPENSE },
  { name: "Housing", icon: "home", color: "#6366f1", type: CategoryType.EXPENSE },
  { name: "Utilities", icon: "zap", color: "#eab308", type: CategoryType.EXPENSE },
  { name: "Subscriptions", icon: "repeat", color: "#8b5cf6", type: CategoryType.EXPENSE },
  { name: "Other", icon: "tag", color: "#6b7280", type: CategoryType.EXPENSE },
];

async function main() {
  console.log("Seeding default categories...");
  for (const cat of defaultCategories) {
    await prisma.category.upsert({
      where: { id: `default-${cat.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `default-${cat.name.toLowerCase().replace(/\s+/g, "-")}`,
        ...cat,
        isDefault: true,
      },
    });
  }
  console.log("Seeding complete.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
