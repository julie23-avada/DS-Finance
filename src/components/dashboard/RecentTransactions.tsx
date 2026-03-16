import { Transaction } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-900">Recent Transactions</h3>
        <Link href="/transactions" className="text-sm text-violet-600 hover:underline font-medium">
          View all
        </Link>
      </div>

      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-gray-400 text-sm">No transactions yet</p>
          <Link href="/transactions" className="mt-2 text-violet-600 text-sm hover:underline">
            Add your first transaction
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50">
          {transactions.map((tx) => (
            <li key={tx.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  tx.type === "INCOME"
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-red-100 text-red-500"
                }`}
              >
                {tx.type === "INCOME" ? (
                  <ArrowDownLeft className="w-4 h-4" />
                ) : (
                  <ArrowUpRight className="w-4 h-4" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {tx.description || tx.category?.name || "Transaction"}
                </p>
                <p className="text-xs text-gray-500">
                  {tx.category?.name} · {formatDate(tx.date)}
                </p>
              </div>

              <span
                className={`text-sm font-semibold tabular-nums shrink-0 ${
                  tx.type === "INCOME" ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {tx.type === "INCOME" ? "+" : "-"}
                {formatCurrency(tx.amount)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
