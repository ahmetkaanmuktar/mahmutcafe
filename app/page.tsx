"use client";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import AuthForm from "@/components/AuthForm";
import Dashboard from "@/components/Dashboard";

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-cafe-500 text-lg">☕ Yükleniyor...</div>
      </div>
    );
  }

  if (!user) return <AuthForm />;
  return <Dashboard />;
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
