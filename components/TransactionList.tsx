"use client";

import { apiFetch } from "@/lib/api";

interface Transaction {
  id: string;
  username: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  groupId: string | null;
  createdAt: string;
}

interface TransactionListProps {
  transactions: Transaction[];
  total: number;
  onDelete?: (id: string) => void;
  currentUsername?: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();

  const time = d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  if (isToday) return `Bugün ${time}`;
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TransactionList({
  transactions,
  total,
  onDelete,
  currentUsername,
}: TransactionListProps) {
  const handleDelete = async (id: string) => {
    if (!confirm("Bu kaydı silmek istiyor musun?")) return;
    try {
      await apiFetch("/api/transactions", {
        method: "DELETE",
        body: JSON.stringify({ transactionId: id }),
      });
      onDelete?.(id);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Silinemedi");
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-3">
        <h2 className="font-semibold text-cafe-text">Hesap</h2>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-cafe-text">{total} TL</span>
          {transactions.length > 0 && (
            <button
              onClick={async () => {
                if (confirm("Tüm hesabı sıfırlamak (ödemek) istediğinize emin misiniz? Bu işlem geri alınamaz.")) {
                  try {
                    const firstTx = transactions[0];
                    await apiFetch("/api/transactions/clear", {
                      method: "POST",
                      body: JSON.stringify({
                        groupId: firstTx.groupId,
                        personal: firstTx.groupId === null,
                      }),
                    });
                    // Reload the page to reset state (or we could pass an onClear callback)
                    window.location.reload();
                  } catch (err) {
                    alert(err instanceof Error ? err.message : "Hesap sıfırlanamadı");
                  }
                }
              }}
              className="text-xs bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded-lg font-semibold transition-colors"
            >
              Hesabı Sıfırla
            </button>
          )}
        </div>
      </div>

      {transactions.length === 0 ? (
        <p className="text-cafe-textMuted text-sm text-center py-6">
          Henüz kayıt yok. Bir şeyler ekle! ☕
        </p>
      ) : (
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {transactions.map((tx) => (
            <li
              key={tx.id}
              className="flex items-center justify-between p-3 rounded-xl bg-cafe-surface group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-cafe-text">
                    {tx.quantity}x {tx.itemName}
                  </span>
                  <span className="text-cafe-textMuted text-sm">@{tx.username}</span>
                </div>
                <p className="text-xs text-cafe-textMuted mt-0.5">
                  {formatDate(tx.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-cafe-text">{tx.totalPrice} TL</span>
                {onDelete && tx.username === currentUsername && (
                  <button
                    type="button"
                    onClick={() => handleDelete(tx.id)}
                    className="text-red-400 hover:text-red-600 p-2 -mr-2 rounded-full hover:bg-red-50 transition-colors"
                    title="Sil"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
