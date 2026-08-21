import { db } from "../server/db";
import { users, accounts, categories, transactions } from "../server/db/schema";
import { hash } from "bcryptjs";
import { subMonths, addDays, format } from "date-fns";

async function seed() {
  console.log("🌱 Seeding database...");

  // Create demo user
  const passwordHash = await hash("demo123", 10);
  const [user] = await db
    .insert(users)
    .values({
      email: "demo@FinPilot AI.app",
      passwordHash,
      name: "Demo User",
    })
    .returning();

  console.log("✅ Created demo user: demo@FinPilot AI.app / demo123");

  // Create accounts
  const [checkingAccount] = await db
    .insert(accounts)
    .values({
      userId: user.id,
      name: "Checking Account",
      type: "checking",
      balance: "5240.50",
      currency: "USD",
    })
    .returning();

  const [savingsAccount] = await db
    .insert(accounts)
    .values({
      userId: user.id,
      name: "Savings Account",
      type: "savings",
      balance: "12500.00",
      currency: "USD",
    })
    .returning();

  const [creditCard] = await db
    .insert(accounts)
    .values({
      userId: user.id,
      name: "Credit Card",
      type: "credit",
      balance: "-1823.45",
      currency: "USD",
    })
    .returning();

  console.log("✅ Created 3 accounts");

  // Create categories
  const categoryData = [
    // Income
    { name: "Salary", color: "#22c55e", icon: "💰", type: "income" as const },
    { name: "Freelance", color: "#10b981", icon: "💻", type: "income" as const },
    // Expenses
    { name: "Groceries", color: "#ef4444", icon: "🛒", type: "expense" as const },
    { name: "Rent", color: "#f97316", icon: "🏠", type: "expense" as const },
    { name: "Utilities", color: "#f59e0b", icon: "⚡", type: "expense" as const },
    { name: "Transportation", color: "#eab308", icon: "🚗", type: "expense" as const },
    { name: "Dining Out", color: "#84cc16", icon: "🍽️", type: "expense" as const },
    { name: "Entertainment", color: "#06b6d4", icon: "🎬", type: "expense" as const },
    { name: "Shopping", color: "#3b82f6", icon: "🛍️", type: "expense" as const },
    { name: "Healthcare", color: "#6366f1", icon: "🏥", type: "expense" as const },
    { name: "Insurance", color: "#8b5cf6", icon: "🛡️", type: "expense" as const },
    { name: "Subscriptions", color: "#a855f7", icon: "📱", type: "expense" as const },
  ];

  const createdCategories = await db.insert(categories).values(
    categoryData.map((cat) => ({
      userId: user.id,
      ...cat,
    }))
  ).returning();

  console.log("✅ Created 12 categories");

  // Generate 12 months of transactions
  const transactionData: any[] = [];
  const now = new Date();

  // Helper to get random amount
  const randomAmount = (min: number, max: number) =>
    (Math.random() * (max - min) + min).toFixed(2);

  // Helper to get category by name
  const getCategory = (name: string) =>
    createdCategories.find((c) => c.name === name)!;

  // Generate transactions for the past 12 months
  for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
    const monthStart = subMonths(now, monthOffset);

    // Salary (monthly on the 1st)
    transactionData.push({
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: getCategory("Salary").id,
      amount: "4500.00",
      date: addDays(monthStart, 1),
      description: "Monthly Salary",
      isRecurring: true,
    });

    // Rent (monthly on the 5th)
    transactionData.push({
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: getCategory("Rent").id,
      amount: "-1200.00",
      date: addDays(monthStart, 5),
      description: "Monthly Rent Payment",
      isRecurring: true,
    });

    // Utilities (monthly on the 10th)
    transactionData.push({
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: getCategory("Utilities").id,
      amount: `-${randomAmount(80, 150)}`,
      date: addDays(monthStart, 10),
      description: "Electric & Water Bill",
      isRecurring: true,
    });

    // Insurance (monthly on the 15th)
    transactionData.push({
      userId: user.id,
      accountId: checkingAccount.id,
      categoryId: getCategory("Insurance").id,
      amount: "-85.00",
      date: addDays(monthStart, 15),
      description: "Health Insurance Premium",
      isRecurring: true,
    });

    // Subscriptions (various dates)
    transactionData.push(
      {
        userId: user.id,
        accountId: creditCard.id,
        categoryId: getCategory("Subscriptions").id,
        amount: "-15.99",
        date: addDays(monthStart, 3),
        description: "Netflix Subscription",
        isRecurring: true,
      },
      {
        userId: user.id,
        accountId: creditCard.id,
        categoryId: getCategory("Subscriptions").id,
        amount: "-9.99",
        date: addDays(monthStart, 8),
        description: "Spotify Premium",
        isRecurring: true,
      }
    );

    // Random groceries (3-4 times per month)
    const groceryCount = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < groceryCount; i++) {
      transactionData.push({
        userId: user.id,
        accountId: checkingAccount.id,
        categoryId: getCategory("Groceries").id,
        amount: `-${randomAmount(60, 150)}`,
        date: addDays(monthStart, 5 + i * 7),
        description: `Grocery Shopping ${i + 1}`,
        isRecurring: false,
      });
    }

    // Random dining out (5-8 times per month)
    const diningCount = 5 + Math.floor(Math.random() * 4);
    for (let i = 0; i < diningCount; i++) {
      transactionData.push({
        userId: user.id,
        accountId: creditCard.id,
        categoryId: getCategory("Dining Out").id,
        amount: `-${randomAmount(15, 80)}`,
        date: addDays(monthStart, 2 + i * 3),
        description: `Restaurant / Cafe`,
        isRecurring: false,
      });
    }

    // Random transportation (gas, uber, parking)
    const transportCount = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < transportCount; i++) {
      transactionData.push({
        userId: user.id,
        accountId: checkingAccount.id,
        categoryId: getCategory("Transportation").id,
        amount: `-${randomAmount(20, 60)}`,
        date: addDays(monthStart, 4 + i * 8),
        description: `Gas / Uber`,
        isRecurring: false,
      });
    }

    // Occasional entertainment, shopping, healthcare
    if (Math.random() > 0.4) {
      transactionData.push({
        userId: user.id,
        accountId: creditCard.id,
        categoryId: getCategory("Entertainment").id,
        amount: `-${randomAmount(30, 100)}`,
        date: addDays(monthStart, 12),
        description: `Movie / Concert / Event`,
        isRecurring: false,
      });
    }

    if (Math.random() > 0.5) {
      transactionData.push({
        userId: user.id,
        accountId: creditCard.id,
        categoryId: getCategory("Shopping").id,
        amount: `-${randomAmount(50, 200)}`,
        date: addDays(monthStart, 18),
        description: `Online Shopping`,
        isRecurring: false,
      });
    }

    if (Math.random() > 0.7) {
      transactionData.push({
        userId: user.id,
        accountId: checkingAccount.id,
        categoryId: getCategory("Healthcare").id,
        amount: `-${randomAmount(40, 120)}`,
        date: addDays(monthStart, 22),
        description: `Doctor Visit / Pharmacy`,
        isRecurring: false,
      });
    }

    // Occasional freelance income
    if (Math.random() > 0.6) {
      transactionData.push({
        userId: user.id,
        accountId: checkingAccount.id,
        categoryId: getCategory("Freelance").id,
        amount: randomAmount(300, 800),
        date: addDays(monthStart, 25),
        description: `Freelance Project`,
        isRecurring: false,
      });
    }
  }

  // Insert all transactions
  await db.insert(transactions).values(transactionData);

  console.log(`✅ Created ${transactionData.length} transactions`);
  console.log("🎉 Seed complete!");
  console.log("\nDemo login:");
  console.log("  Email: demo@FinPilot AI.app");
  console.log("  Password: demo123");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
