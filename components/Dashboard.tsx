"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import type { AccountType } from "@/lib/types";
import QuickAdd from "./QuickAdd";
import TransactionList from "./TransactionList";
import GroupManager from "./GroupManager";

interface Transaction {
  id: string;
  username: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: string;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [accountType, setAccountType] = useState<AccountType>("group");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<"home" | "groups">("home");

  const loadTransactions = useCallback(async () => {
    try {
      let url = "/api/transactions";
      if (accountType === "personal") {
        url += "?personal=true";
      } else if (selectedGroupId) {
        url += `?groupId=${selectedGroupId}`;
      } else {
        return;
      }

      const data = await apiFetch<{ transactions: Transaction[]; total: number }>(url);
      setTransactions(data.transactions);
      setTotal(data.total);
    } catch {
      /* ignore */
    }
  }, [accountType, selectedGroupId]);

  useEffect(() => {
    loadTransactions();
    const interval = setInterval(loadTransactions, 10000);
    return () => clearInterval(interval);
  }, [loadTransactions]);

  const handleDelete = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    const deleted = transactions.find((t) => t.id === id);
    if (deleted) setTotal((prev) => prev - deleted.totalPrice);
  };

  return (
    <div className="min-h-screen pb-20">
      <header className="bg-cafe-accent text-white px-4 py-4 sticky top-0 z-10 shadow-md">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-lg font-bold">☕ Mahmud Cafe</h1>
            <p className="text-cafe-200 text-sm">@{user?.username}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="text-cafe-200 hover:text-white text-sm"
          >
            Çıkış
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-4">
        {activeTab === "home" && (
          <>
            <div className="card">
              <p className="text-sm text-cafe-text mb-2">Hesaba yaz:</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAccountType("group")}
                  className={`flex-1 py-2.5 rounded-xl font-medium transition-colors ${
                    accountType === "group"
                      ? "bg-cafe-accent text-white"
                      : "bg-cafe-border text-cafe-text"
                  }`}
                >
                  👥 Grup Hesabı
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("personal")}
                  className={`flex-1 py-2.5 rounded-xl font-medium transition-colors ${
                    accountType === "personal"
                      ? "bg-cafe-accent text-white"
                      : "bg-cafe-border text-cafe-text"
                  }`}
                >
                  👤 Kendi Hesabım
                </button>
              </div>
              {accountType === "group" && !selectedGroupId && (
                <p className="text-amber-600 text-sm mt-2">
                  Grup sekmesinden bir grup seç veya oluştur
                </p>
              )}
            </div>

            <QuickAdd
              accountType={accountType}
              groupId={selectedGroupId}
              onAdded={loadTransactions}
            />

            <TransactionList
              transactions={transactions}
              total={total}
              onDelete={handleDelete}
              currentUsername={user?.username}
            />
          </>
        )}

        {activeTab === "groups" && (
          <GroupManager
            selectedGroupId={selectedGroupId}
            onGroupChange={setSelectedGroupId}
          />
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-cafe-card border-t border-cafe-border shadow-lg">
        <div className="max-w-lg mx-auto flex">
          <button
            type="button"
            onClick={() => setActiveTab("home")}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
              activeTab === "home"
                ? "text-cafe-text border-t-2 border-cafe-600"
                : "text-cafe-textMuted"
            }`}
          >
            🏠 Ana Sayfa
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("groups")}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
              activeTab === "groups"
                ? "text-cafe-text border-t-2 border-cafe-600"
                : "text-cafe-textMuted"
            }`}
          >
            👥 Gruplar
          </button>
        </div>
      </nav>
    </div>
  );
}
