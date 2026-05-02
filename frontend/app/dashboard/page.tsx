"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import API from "@/lib/api";

interface Event {
  id: string;
  name: string;
  event_date: string;
  access_token: string;
  is_active: boolean;
  total_photos: number;
  indexed_photos: number;
  indexing_status: string;
}

interface StorageInfo {
  used: number;
  limit: number;
  plan: string;
  name: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 MB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

const planColors: Record<string, string> = {
  free: "bg-gray-100 text-gray-600",
  basic: "bg-blue-100 text-blue-700",
  pro: "bg-purple-100 text-purple-700",
  enterprise: "bg-yellow-100 text-yellow-700",
};

export default function Dashboard() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDate, setNewDate] = useState("");
  const [loading, setLoading] = useState(false);

  const inputClass = "w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400 bg-white text-gray-900 placeholder-gray-400";

  useEffect(() => {
    if (!localStorage.getItem("token")) { router.push("/login"); return; }
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [evRes, meRes] = await Promise.all([
        API.get("/api/admin/events"),
        API.get("/api/auth/me"),
      ]);
      setEvents(evRes.data);
      setStorageInfo({
        used: meRes.data.storage_used_bytes,
        limit: meRes.data.storage_limit_bytes,
        plan: meRes.data.plan,
        name: meRes.data.name,
      });
    } catch {
      router.push("/login");
    }
  }

  async function createEvent(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post("/api/admin/events", { name: newName, event_date: newDate || null });
      setShowCreate(false);
      setNewName("");
      setNewDate("");
      loadAll();
    } catch {
      alert("Failed to create event");
    } finally {
      setLoading(false);
    }
  }

  const statusColor = (s: string) =>
    s === "done" ? "bg-green-100 text-green-700" :
    s === "processing" ? "bg-yellow-100 text-yellow-700" :
    "bg-gray-100 text-gray-500";

  const storagePercent = storageInfo
    ? Math.min((storageInfo.used / storageInfo.limit) * 100, 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Navbar */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📸</span>
          <span className="font-bold text-gray-800 text-lg">SnapFind</span>
        </div>
        <div className="flex items-center gap-4">
          {storageInfo && (
            <span className="text-sm text-gray-500">
              👋 <span className="font-medium text-gray-700">{storageInfo.name}</span>
            </span>
          )}
          <button
            onClick={() => { localStorage.clear(); router.push("/login"); }}
            className="text-sm bg-red-50 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-100 font-medium">
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* Storage Bar */}
        {storageInfo && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">💾</span>
                <span className="font-semibold text-gray-700 text-sm">Storage</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${planColors[storageInfo.plan] || "bg-gray-100 text-gray-600"}`}>
                  {storageInfo.plan} plan
                </span>
              </div>
              <span className="text-sm text-gray-500 font-medium">
                {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.limit)}
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  storagePercent > 90 ? "bg-red-500" :
                  storagePercent > 70 ? "bg-yellow-500" :
                  "bg-purple-500"
                }`}
                style={{ width: `${storagePercent}%` }}
              />
            </div>
            {storagePercent > 80 && (
              <p className="text-xs text-yellow-600 mt-2 font-medium">
                ⚠️ Storage almost full. Contact support to upgrade your plan.
              </p>
            )}
            {storagePercent === 0 && (
              <p className="text-xs text-gray-400 mt-1">No storage used yet</p>
            )}
          </div>
        )}

        {/* Header Row */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Your Events</h2>
            <p className="text-gray-500 text-sm mt-1">
              {events.length} event{events.length !== 1 ? "s" : ""} created
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-semibold shadow-md transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            + New Event
          </button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-purple-100">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">✨ Create New Event</h3>
            <form onSubmit={createEvent} className="space-y-3">
              <input
                type="text"
                placeholder="Event name — e.g. Annual Day 2026"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className={inputClass}
                required
              />
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className={inputClass}
              />
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={loading}
                  className="px-6 py-2.5 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                  {loading ? "Creating..." : "Create Event"}
                </button>
                <button type="button" onClick={() => setShowCreate(false)}
                  className="px-6 py-2.5 rounded-xl bg-gray-100 text-gray-600 font-semibold text-sm hover:bg-gray-200">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Events List */}
        {events.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
            <div className="text-6xl mb-4">📁</div>
            <p className="text-gray-500 text-lg">No events yet</p>
            <p className="text-gray-400 text-sm mt-1">Click "+ New Event" to get started</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {events.map((event) => (
              <div key={event.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex justify-between items-center hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                    style={{ background: "linear-gradient(135deg, #667eea22 0%, #764ba222 100%)" }}>
                    🎪
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800">{event.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-gray-400">{event.event_date}</span>
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-500">{event.total_photos} photos</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(event.indexing_status)}`}>
                        {event.indexing_status}
                      </span>
                      {!event.is_active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">
                          disabled
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => router.push(`/dashboard/event/${event.id}`)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 transition-colors whitespace-nowrap">
                  Manage →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}