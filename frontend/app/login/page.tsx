"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import API from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await API.post("/api/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("name", res.data.name);
      router.push("/dashboard");
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 text-sm bg-white text-gray-900 placeholder-gray-400";

  return (
    <div className="min-h-screen flex"
      style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>

      {/* Left Panel */}
      <div className="hidden lg:flex flex-1 flex-col justify-center px-16 text-white">
        <div className="text-6xl mb-6">📸</div>
        <h1 className="text-5xl font-bold mb-4">SnapFind</h1>
        <p className="text-xl text-purple-200 mb-8">AI-powered event photo discovery</p>
        <div className="space-y-4">
          {[
            { icon: "🤖", text: "AI finds faces in seconds" },
            { icon: "🔒", text: "Private — only you see your photos" },
            { icon: "📱", text: "No app needed — works in browser" },
            { icon: "⚡", text: "Upload 500 photos, index in minutes" },
          ].map((f) => (
            <div key={f.text} className="flex items-center gap-3 text-purple-100">
              <span className="text-2xl">{f.icon}</span>
              <span>{f.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">

          <div className="text-center mb-8">
            <div className="text-4xl mb-2">📸</div>
            <h1 className="text-2xl font-bold text-gray-800">Admin Login</h1>
            <p className="text-gray-400 text-sm mt-1">SnapFind Dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <input type="password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••" required />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm">
                ⚠️ {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl text-white font-bold text-sm shadow-lg disabled:opacity-50 transition-all active:scale-95"
              style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
              {loading ? "Logging in..." : "Login to Dashboard"}
            </button>
          </form>

          <div className="text-center mt-4">
            <button type="button" onClick={() => setShowForgot(true)}
              className="text-sm text-purple-600 hover:underline font-medium">
              Forgot Password?
            </button>
          </div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Forgot Password?</h3>
            <p className="text-gray-500 text-sm mb-4">
              Contact our support team and we will reset your password for you.
            </p>
            <div className="space-y-3 bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2">
                <span>✉️</span>
                <a href="mailto:hello@snapfind.in"
                  className="text-purple-600 text-sm font-medium hover:underline">
                  hello@snapfind.in
                </a>
              </div>
              {/*
              <div className="flex items-center gap-2">
                <span>📞</span>
                <a href="tel:+919876543210"
                  className="text-purple-600 text-sm font-medium hover:underline">
                  +91 98765 43210
                </a>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">💬</span>
                <a href="https://wa.me/919876543210"
                  target="_blank" rel="noopener noreferrer"
                  className="text-green-600 text-sm font-medium hover:underline">
                  WhatsApp Us
                </a>
              </div>
              */}
            </div>
            <button onClick={() => setShowForgot(false)}
              className="w-full py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}