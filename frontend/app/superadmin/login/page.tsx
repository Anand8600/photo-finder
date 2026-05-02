"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SuperAdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post(`${API_BASE}/api/superadmin/login`, {
        email, password
      });
      localStorage.setItem("sa_token", res.data.token);
      router.push("/superadmin/dashboard");
    } catch {
      setError("Invalid super admin credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)" }}>
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-4xl mb-2">🔐</p>
          <h1 className="text-2xl font-bold text-white">Super Admin</h1>
          <p className="text-purple-300 text-sm mt-1">SnapFind Control Panel</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1">Email</label>
            <input type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="admin@snapfind.in" />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-200 mb-1">Password</label>
            <input type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
              placeholder="••••••••" />
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            {loading ? "Logging in..." : "Login as Super Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}