"use client";

import { useState } from "react";
import { MENU_ITEMS } from "@/lib/menu";
import type { MenuItemId } from "@/lib/menu";
import type { AccountType } from "@/lib/types";
import { apiFetch } from "@/lib/api";

interface QuickAddProps {
  accountType: AccountType;
  groupId: string | null;
  onAdded: () => void;
}

export default function QuickAdd({ accountType, groupId, onAdded }: QuickAddProps) {
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState("");
  const [showExtra, setShowExtra] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const addItem = async (itemId: MenuItemId) => {
    if (accountType === "group" && !groupId) {
      setError("Önce bir grup seçin");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await apiFetch("/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          itemId,
          quantity,
          customPrice: itemId === "ekstra" ? Number(customPrice) : undefined,
          accountType,
          groupId: accountType === "group" ? groupId : null,
        }),
      });
      setQuantity(1);
      setCustomPrice("");
      setShowExtra(false);
      onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eklenemedi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="font-semibold text-cafe-800 mb-3">Hızlı Ekle</h2>

      <div className="flex items-center gap-3 mb-4">
        <label className="text-sm text-cafe-600">Adet:</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-8 h-8 rounded-lg bg-cafe-100 text-cafe-700 font-bold hover:bg-cafe-200"
          >
            −
          </button>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-16 text-center font-semibold border border-cafe-200 rounded-md py-1 focus:outline-none focus:ring-2 focus:ring-cafe-400"
            min="1"
          />
          <button
            type="button"
            onClick={() => setQuantity(quantity + 1)}
            className="w-8 h-8 rounded-lg bg-cafe-100 text-cafe-700 font-bold hover:bg-cafe-200"
          >
            +
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {MENU_ITEMS.filter((m) => m.id !== "ekstra").map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={loading}
            onClick={() => addItem(item.id)}
            className="flex flex-col items-center gap-1 p-4 rounded-xl bg-cafe-50 hover:bg-cafe-100 border border-cafe-100 transition-colors disabled:opacity-50 active:scale-[0.97]"
          >
            <span className="text-2xl">{item.emoji}</span>
            <span className="font-medium text-cafe-800">{item.name}</span>
            <span className="text-sm text-cafe-500">{item.price} TL</span>
          </button>
        ))}
      </div>

      {!showExtra ? (
        <button
          type="button"
          onClick={() => setShowExtra(true)}
          className="w-full mt-3 p-3 rounded-xl border-2 border-dashed border-cafe-200 text-cafe-500 hover:border-cafe-400 hover:text-cafe-600 transition-colors"
        >
          ✨ Ekstra (kendi fiyatını gir)
        </button>
      ) : (
        <div className="mt-3 p-3 rounded-xl bg-cafe-50 border border-cafe-100">
          <p className="text-sm font-medium text-cafe-700 mb-2">✨ Ekstra</p>
          <div className="flex gap-2">
            <input
              type="number"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              placeholder="Fiyat (TL)"
              min="1"
              className="flex-1 px-3 py-2 rounded-lg border border-cafe-200 focus:outline-none focus:ring-2 focus:ring-cafe-400"
            />
            <button
              type="button"
              disabled={loading || !customPrice}
              onClick={() => addItem("ekstra")}
              className="btn-primary disabled:opacity-50"
            >
              Ekle
            </button>
            <button
              type="button"
              onClick={() => setShowExtra(false)}
              className="btn-secondary"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
}
