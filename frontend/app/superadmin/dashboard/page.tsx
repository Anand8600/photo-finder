"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Client {
  id: string;
  name: string;
  email: string;
  plan: string;
  is_active: boolean;
  storage_limit_bytes: number;
  storage_used_bytes: number;
  created_at: string;
  last_login_at: string | null;
}

const PLANS = ["free", "basic", "pro", "enterprise"];

const planColors: Record<string, string> = {
  free: "bg-gray-100 text-gray-600",
  basic: "bg-blue-100 text-blue-700",
  pro: "bg-purple-100 text-purple-700",
  enterprise: "bg-yellow-100 text-yellow-700",
};

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function SuperAdminDashboard() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [resetClient, setResetClient] = useState<Client | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [createForm, setCreateForm] = useState({ name: "", email: "", password: "", plan: "free" });
  const [editForm, setEditForm] = useState({ name: "", email: "", plan: "free", is_active: true });
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  function getHeaders() {
    const token = localStorage.getItem("sa_token");
    return { authorization: `Bearer ${token}` };
  }

  useEffect(() => {
    const token = localStorage.getItem("sa_token");
    if (!token) { router.push("/superadmin/login"); return; }
    loadClients();
  }, []);

  async function loadClients() {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/superadmin/clients`, {
        headers: getHeaders()
      });
      setClients(res.data);
    } catch {
      router.push("/superadmin/login");
    } finally {
      setLoading(false);
    }
  }

  async function createClient(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");
    try {
      await axios.post(`${API_BASE}/api/superadmin/clients`,
        createForm, { headers: getHeaders() });
      setShowCreate(false);
      setCreateForm({ name: "", email: "", password: "", plan: "free" });
      loadClients();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      setError(e.response?.data?.detail || "Failed to create client");
    } finally {
      setCreating(false);
    }
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editClient) return;
    setSaving(true);
    try {
      await axios.put(`${API_BASE}/api/superadmin/clients/${editClient.id}`,
        editForm, { headers: getHeaders() });
      setEditClient(null);
      loadClients();
    } catch {
      alert("Failed to update client");
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetClient) return;
    try {
      await axios.put(
        `${API_BASE}/api/superadmin/clients/${resetClient.id}/reset-password`,
        { new_password: newPassword },
        { headers: getHeaders() }
      );
      setResetMsg(`✅ Password reset for ${resetClient.name}`);
      setNewPassword("");
      setTimeout(() => { setResetClient(null); setResetMsg(""); }, 2000);
    } catch {
      setResetMsg("❌ Failed to reset password");
    }
  }

  async function toggleActive(client: Client) {
    try {
      await axios.put(`${API_BASE}/api/superadmin/clients/${client.id}`,
        { is_active: !client.is_active }, { headers: getHeaders() });
      loadClients();
    } catch {
      alert("Failed to update");
    }
  }

  async function deleteClient(client: Client) {
    if (!confirm(`Delete ${client.name}? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API_BASE}/api/superadmin/clients/${client.id}`,
        { headers: getHeaders() });
      loadClients();
    } catch {
      alert("Failed to delete");
    }
  }

  function logout() {
    localStorage.removeItem("sa_token");
    router.push("/superadmin/login");
  }

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b shadow-sm px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🔐</span>
          <div>
            <p className="font-bold text-gray-900">SnapFind Super Admin</p>
            <p className="text-xs text-gray-400">Control Panel</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">{clients.length} clients</span>
          <button onClick={logout} className="text-sm text-red-500 hover:underline">Logout</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Clients", value: clients.length, color: "text-blue-600" },
            { label: "Active", value: clients.filter(c => c.is_active).length, color: "text-green-600" },
            { label: "Pro/Enterprise", value: clients.filter(c => c.plan === "pro" || c.plan === "enterprise").length, color: "text-purple-600" },
            { label: "Free Plan", value: clients.filter(c => c.plan === "free").length, color: "text-gray-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
              <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
              <p className="text-sm text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center mb-4">
          <input type="text" placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-2 border-gray-200 rounded-xl px-4 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-purple-400" />
          <button onClick={() => { setShowCreate(true); setError(""); }}
            className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            + Create Client
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-gray-400">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No clients found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Client", "Plan", "Storage", "Status", "Last Login", "Actions"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-gray-900 text-sm">{client.name}</p>
                        <p className="text-xs text-gray-400">{client.email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${planColors[client.plan] || "bg-gray-100 text-gray-600"}`}>
                          {client.plan}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-500">
                        {formatBytes(client.storage_used_bytes)} / {formatBytes(client.storage_limit_bytes)}
                      </td>
                      <td className="px-4 py-4">
                        <button onClick={() => toggleActive(client)}
                          className={`text-xs px-2 py-1 rounded-full font-semibold ${client.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                          {client.is_active ? "● Active" : "● Disabled"}
                        </button>
                      </td>
                      <td className="px-4 py-4 text-xs text-gray-400">
                        {client.last_login_at ? new Date(client.last_login_at).toLocaleDateString("en-IN") : "Never"}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button onClick={() => { setEditClient(client); setEditForm({ name: client.name, email: client.email, plan: client.plan, is_active: client.is_active }); }}
                            className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium">Edit</button>
                          <button onClick={() => { setResetClient(client); setNewPassword(""); setResetMsg(""); }}
                            className="text-xs px-3 py-1.5 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 font-medium">Reset PW</button>
                          <button onClick={() => deleteClient(client)}
                            className="text-xs px-3 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 font-medium">Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Create New Client</h3>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <form onSubmit={createClient} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                <input type="text" required placeholder="School Name or Person Name"
                  value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email *</label>
                <input type="email" required placeholder="client@school.edu"
                  value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Password *</label>
                <input type="password" required placeholder="Min 6 characters"
                  value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Plan</label>
                <select value={createForm.plan} onChange={(e) => setCreateForm({ ...createForm, plan: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                  {PLANS.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={creating}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                  {creating ? "Creating..." : "Create Client"}
                </button>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Edit — {editClient.name}</h3>
            <form onSubmit={saveEdit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email</label>
                <input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Plan</label>
                <select value={editForm.plan} onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400">
                  {PLANS.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="active" checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="w-4 h-4 accent-purple-600" />
                <label htmlFor="active" className="text-sm text-gray-700">Account Active</label>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => setEditClient(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h3 className="font-bold text-gray-900 text-lg mb-1">Reset Password</h3>
            <p className="text-sm text-gray-500 mb-4">{resetClient.name} — {resetClient.email}</p>
            <form onSubmit={resetPassword} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">New Password *</label>
                <input type="password" required placeholder="Min 6 characters"
                  value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400" />
              </div>
              {resetMsg && <p className="text-sm text-center font-medium">{resetMsg}</p>}
              <div className="flex gap-3 pt-2">
                <button type="submit"
                  className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                  Reset Password
                </button>
                <button type="button" onClick={() => setResetClient(null)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}