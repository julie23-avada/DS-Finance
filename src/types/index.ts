export type TransactionType = "INCOME" | "EXPENSE";
export type CategoryType = "INCOME" | "EXPENSE";
export type WalletRole = "OWNER" | "ADMIN" | "MEMBER";

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
  userId?: string | null;
  isDefault: boolean;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  description?: string | null;
  date: string;
  notes?: string | null;
  createdAt: string;
  userId: string;
  categoryId?: string | null;
  category?: Category | null;
  walletId?: string | null;
}

export interface Budget {
  id: string;
  amount: number;
  spent: number;
  month: number;
  year: number;
  userId: string;
  categoryId: string;
  category: Category;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string | null;
  icon: string;
  color: string;
  description?: string | null;
  userId: string;
  createdAt: string;
}

export interface Wallet {
  id: string;
  name: string;
  description?: string | null;
  balance: number;
  currency: string;
  icon: string;
  color: string;
  members: WalletMember[];
}

export interface WalletMember {
  id: string;
  role: WalletRole;
  userId: string;
  walletId: string;
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  };
}

export interface DashboardStats {
  monthlyIncome: number;
  monthlyExpenses: number;
  balance: number;
  recentTransactions: Transaction[];
  spendingByCategory: { categoryId: string; name: string; color: string; total: number }[];
}
