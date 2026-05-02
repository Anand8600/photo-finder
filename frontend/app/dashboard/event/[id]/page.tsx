"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import API from "@/lib/api";

interface EventDetail {
  id: string; name: string; access_token: string;
  total_photos: number; indexed_photos: number;
  total_faces: number; indexing_status: string; is_active: boolean;
}
interface Photo {
  id: string; filename: string; status: string; face_count: number; file_size_bytes: number;
}
interface Progress {
  total: number; done: number; failed: number; pending: number; total_faces: number;
}

export default function EventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const fileRef = useRef<HTMLInputElement>(null);

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadResult, setUploadResult] = useState("");
  const [activeTab, setActiveTab] = useState<"overview"|"photos">("overview");
  const [deletingId, setDeletingId] = useState<string|null>(null);

  useEffect(() => {
    if (!localStorage.getItem("token")) { router.push("/login"); return; }
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [evRes, phRes, prRes] = await Promise.all([
        API.get(`/api/admin/events/${eventId}`),
        API.get(`/api/admin/events/${eventId}/photos`),
        API.get(`/api/admin/events/${eventId}/progress`),
      ]);
      setEvent(evRes.data);
      setPhotos(phRes.data);
      setProgress(prRes.data);
    } catch { router.push("/dashboard"); }
  }

  async function uploadPhotos(files: FileList) {
    setUploading(true); setUploadResult("");
    let total = 0;
    const arr = Array.from(files);
    for (let i = 0; i < arr.length; i += 5) {
      const batch = arr.slice(i, i + 5);
      const form = new FormData();
      batch.forEach((f) => form.append("files", f));
      try {
        const res = await API.post(`/api/admin/events/${eventId}/photos`, form, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        total += res.data.uploaded;
      } catch {}
    }
    setUploadResult(`✅ Uploaded ${total} of ${files.length} photos`);
    setUploading(false);
    loadAll();
  }

  async function deletePhoto(photoId: string) {
    if (!confirm("Delete this photo?")) return;
    setDeletingId(photoId);
    try {
      await API.delete(`/api/admin/events/${eventId}/photos/${photoId}`);
      setPhotos((p) => p.filter((x) => x.id !== photoId));
    } catch { alert("Failed to delete"); }
    finally { setDeletingId(null); }
  }

  async function startProcessing() {
    setProcessing(true);
    try {
      await API.post(`/api/admin/events/${eventId}/process`);
      const interval = setInterval(async () => {
        const res = await API.get(`/api/admin/events/${eventId}/progress`);
        setProgress(res.data);
        if (res.data.pending === 0 && res.data.processing === 0) {
          clearInterval(interval); setProcessing(false); loadAll();
        }
      }, 3000);
    } catch { setProcessing(false); }
  }

  async function toggleEvent() {
    try {
      await API.put(`/api/admin/events/${eventId}/toggle`);
      loadAll();
    } catch { alert("Failed to toggle event"); }
  }

  async function deleteEvent() {
    if (!confirm(`Delete "${event?.name}"? This will delete all photos and cannot be undone.`)) return;
    try {
      await API.delete(`/api/admin/events/${eventId}`);
      router.push("/dashboard");
    } catch { alert("Failed to delete event"); }
  }

  function copyLink() {
    navigator.clipboard.writeText(`http://localhost:3000/e/${event?.access_token}`);
    alert("✅ Link copied!");
  }

  const statusBadge = (s: string) =>
    s === "done" ? "bg-green-100 text-green-700" :
    s === "processing" ? "bg-yellow-100 text-yellow-700" :
    s === "failed" ? "bg-red-100 text-red-600" :
    "bg-gray-100 text-gray-500";

  if (!event) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-400">Loading...</p>
    </div>
  );

  const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <button onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1 text-purple-600 font-medium hover:underline text-sm">
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">📸</span>
          <span className="font-bold text-gray-800">{event.name}</span>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full font-semibold ${event.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
          {event.is_active ? "● Active" : "● Disabled"}
        </span>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b px-6">
        <div className="flex gap-0 max-w-5xl mx-auto">
          {(["overview", "photos"] as const).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-6 py-3.5 text-sm font-semibold capitalize border-b-2 transition-colors ${activeTab === tab ? "border-purple-600 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
              {tab === "overview" ? "⚙️ Overview" : `🖼️ Photos (${photos.length})`}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: "Total Photos", value: event.total_photos, icon: "🖼️" },
                { label: "Indexed", value: event.indexed_photos, icon: "✅" },
                { label: "Faces Found", value: event.total_faces, icon: "👤" },
              ].map((s) => (
                <div key={s.label} className="bg-white rounded-2xl shadow-sm p-5 text-center border border-gray-100">
                  <div className="text-3xl mb-2">{s.icon}</div>
                  <p className="text-3xl font-bold text-purple-600">{s.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Share */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-1">🔗 Share with Guests</h3>
              <p className="text-sm text-gray-400 mb-3">Send this link — guests scan selfie to find their photos</p>
              <div className="flex gap-2">
                <input readOnly value={`http://localhost:3000/e/${event.access_token}`}
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-600"/>
                <button onClick={copyLink}
                  className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"}}>
                  Copy
                </button>
              </div>
            </div>

            {/* Upload */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-1">📤 Upload Photos</h3>
              <p className="text-sm text-gray-400 mb-4">Select multiple photos — uploaded in batches of 5</p>
              <input ref={fileRef} type="file" multiple accept="image/*" className="hidden"
                onChange={(e) => e.target.files && uploadPhotos(e.target.files)} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full border-2 border-dashed border-purple-300 rounded-xl py-10 text-purple-600 font-medium hover:bg-purple-50 disabled:opacity-50 transition-colors text-center">
                {uploading ? (
                  <span className="flex flex-col items-center gap-2">
                    <span className="animate-pulse text-3xl">⏳</span>
                    Uploading...
                  </span>
                ) : (
                  <span className="flex flex-col items-center gap-2">
                    <span className="text-3xl">📂</span>
                    Click to select photos
                  </span>
                )}
              </button>
              {uploadResult && <p className="mt-3 text-sm text-green-600 font-medium">{uploadResult}</p>}
            </div>

            {/* AI Processing */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-1">🤖 AI Face Indexing</h3>
              <p className="text-sm text-gray-400 mb-4">Run AI to detect and index all faces in uploaded photos</p>
              {progress && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Done: {progress.done} / {progress.total}</span>
                    <span>{pct}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className="h-3 rounded-full transition-all duration-500"
                      style={{width: `${pct}%`, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"}} />
                  </div>
                  <div className="flex gap-4 mt-2 text-xs text-gray-400">
                    <span>👤 {progress.total_faces} faces found</span>
                    {progress.failed > 0 && <span className="text-red-500">❌ {progress.failed} failed</span>}
                  </div>
                </div>
              )}
              <button onClick={startProcessing} disabled={processing || event.total_photos === 0}
                className="px-6 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50 transition-all"
                style={{background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"}}>
                {processing ? "⏳ Processing..." : "▶ Start AI Indexing"}
              </button>
            </div>

            {/* Event Controls */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-1">⚙️ Event Controls</h3>
              <p className="text-sm text-gray-400 mb-4">Manage access and delete this event</p>
              <div className="flex gap-3 flex-wrap">
                <button onClick={toggleEvent}
                  className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    event.is_active
                      ? "bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100"
                      : "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
                  }`}>
                  {event.is_active ? "🔒 Disable Public Access" : "🔓 Enable Public Access"}
                </button>
                <button onClick={deleteEvent}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all">
                  🗑️ Delete This Event
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "photos" && (
          <div>
            {photos.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                <div className="text-5xl mb-3">🖼️</div>
                <p className="text-gray-400">No photos uploaded yet</p>
                <button onClick={() => setActiveTab("overview")}
                  className="mt-4 text-purple-600 text-sm hover:underline">
                  Go to Overview to upload
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="relative bg-gray-100 h-36">
                      <img
                        src={`http://localhost:8000/api/admin/events/${eventId}/photos/${photo.id}/thumbnail`}
                        alt={photo.filename}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                      <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(photo.status)}`}>
                        {photo.status}
                      </span>
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-600 truncate font-medium">{photo.filename}</p>
                      <p className="text-xs text-gray-400 mt-0.5">👤 {photo.face_count} face{photo.face_count !== 1 ? "s" : ""}</p>
                      <button
                        onClick={() => deletePhoto(photo.id)}
                        disabled={deletingId === photo.id}
                        className="mt-2 w-full text-xs py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 font-medium transition-colors disabled:opacity-50">
                        {deletingId === photo.id ? "Deleting..." : "🗑 Delete"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}