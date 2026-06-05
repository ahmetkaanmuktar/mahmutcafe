"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function AuthForm() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        await login(username, password);
      } else {
        await register(username, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">☕</div>
          <h1 className="text-2xl font-bold text-cafe-800">Mahmud Cafe</h1>
          <p className="text-cafe-500 text-sm mt-1">Hesap takip uygulaması</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-cafe-700 mb-1">
              Kullanıcı Adı
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-cafe-200 focus:outline-none focus:ring-2 focus:ring-cafe-400"
              placeholder="kullaniciadi"
              autoComplete="username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-cafe-700 mb-1">
              Şifre
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-cafe-200 focus:outline-none focus:ring-2 focus:ring-cafe-400"
              placeholder="••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading
              ? "Bekleyin..."
              : mode === "login"
              ? "Giriş Yap"
              : "Kayıt Ol"}
          </button>
        </form>

        <p className="text-center text-sm text-cafe-500 mt-4">
          {mode === "login" ? "Hesabın yok mu?" : "Zaten üye misin?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            className="text-cafe-600 font-medium hover:underline"
          >
            {mode === "login" ? "Kayıt Ol" : "Giriş Yap"}
          </button>
        </p>

        <p className="text-center text-xs text-cafe-400 mt-3">
          Bir kez giriş yap, hep hatırlasın ☕
        </p>
      </div>
    </div>
  );
}
