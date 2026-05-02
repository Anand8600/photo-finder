"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface MatchedPhoto {
  photo_id: string;
  filename: string;
  score: number;
  thumbnail_url: string;
  download_url: string;
}

interface EventInfo {
  name: string;
  event_date: string;
  total_photos: number;
  is_ready: boolean;
}

export default function EventSearchPage() {
  const params = useParams();
  const token = params.token as string;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [photos, setPhotos] = useState<MatchedPhoto[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    axios
      .get(`${API_BASE}/e/${token}`)
      .then((r) => setEventInfo(r.data))
      .catch(() => setNotFound(true));
  }, [token]);

  useEffect(() => {
    return () => { stopCamera(); };
  }, []);

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraOn(false);
  }

  async function startCamera() {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current!.play();
          } catch (e) {
            console.error("Play failed:", e);
          }
        };
      }
      setCameraOn(true);
    } catch (err) {
      console.error("Camera error:", err);
      setCameraError("Camera access denied. Please allow camera permission and try again.");
    }
  }

  const doCapture = useCallback(async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.save();
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();

    stopCamera();
    setSearching(true);
    setSearched(false);
    setPhotos([]);
    setError("");

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setError("Failed to capture. Please try again.");
        setSearching(false);
        return;
      }

      const formData = new FormData();
      formData.append("selfie", blob, "selfie.jpg");

      try {
        const res = await axios.post(
          `${API_BASE}/api/search/${token}`,
          formData
        );
        setPhotos(res.data.photos);
      } catch (e: unknown) {
        const err = e as { response?: { data?: { detail?: string } } };
        setError(err.response?.data?.detail || "Something went wrong. Please try again.");
      } finally {
        setSearching(false);
        setSearched(true);
      }
    }, "image/jpeg", 0.95);
  }, [token]);

  function startCountdown() {
    if (countdown > 0) return;
    let c = 3;
    setCountdown(c);
    const interval = setInterval(() => {
      c -= 1;
      setCountdown(c);
      if (c <= 0) {
        clearInterval(interval);
        setCountdown(0);
        doCapture();
      }
    }, 1000);
  }

  function resetSearch() {
    setSearched(false);
    setPhotos([]);
    setError("");
    setCountdown(0);
  }

  if (notFound) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-5xl mb-4">🔒</p>
        <p className="text-gray-600 text-lg">This gallery is not available.</p>
        <p className="text-gray-400 text-sm mt-2">Contact the organizer for access.</p>
      </div>
    </div>
  );

  if (!eventInfo) return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)" }}>
      <p className="text-white opacity-60">Loading event...</p>
    </div>
  );

  return (
    <div className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #0f0c29, #302b63, #24243e)" }}>

      <div className="text-center px-6 pt-10 pb-6">
        <p className="text-4xl mb-2">📸</p>
        <h1 className="text-2xl font-bold text-white">{eventInfo.name}</h1>
        <p className="text-purple-300 mt-1 text-sm">
          {eventInfo.event_date} &bull; {eventInfo.total_photos} photos
        </p>
      </div>

      <div className="max-w-md mx-auto px-5 pb-12">

        {searching && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4 animate-pulse">🔍</div>
            <p className="text-white text-xl font-semibold">Finding your photos...</p>
            <p className="text-purple-300 text-sm mt-2 animate-pulse">
              AI is scanning {eventInfo.total_photos} photos
            </p>
          </div>
        )}

        {!searching && !searched && (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <p className="text-white text-lg font-semibold text-center mb-1">
              Find Your Photos Instantly
            </p>
            <p className="text-purple-200 text-sm text-center mb-5">
              Look into the camera — our AI will find all photos with you
            </p>

            {cameraOn && (
              <div className="relative mb-4 rounded-xl overflow-hidden bg-black"
                style={{ minHeight: "240px" }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-xl"
                  style={{ display: "block", minHeight: "200px", background: "#000" }}
                />
                {countdown > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                    <span className="text-white font-bold"
                      style={{ fontSize: "96px", lineHeight: 1 }}>
                      {countdown}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div style={{
                    width: "150px",
                    height: "195px",
                    borderRadius: "50%",
                    border: "3px solid rgba(255,255,255,0.8)",
                    boxShadow: "0 0 0 9999px rgba(0,0,0,0.3)"
                  }} />
                </div>
              </div>
            )}

            <canvas ref={canvasRef} style={{ display: "none" }} />

            {cameraError && (
              <p className="text-red-400 text-sm text-center mb-3">{cameraError}</p>
            )}

            {!cameraOn ? (
              <button onClick={startCamera}
                className="w-full py-4 rounded-xl text-white font-semibold text-lg"
                style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                📷 Open Camera
              </button>
            ) : (
              <div className="flex gap-3">
                <button
                  onClick={startCountdown}
                  disabled={countdown > 0}
                  className="flex-1 py-3 rounded-xl text-white font-semibold disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                  {countdown > 0 ? `📸 Taking in ${countdown}...` : "📸 Take Selfie"}
                </button>
                <button onClick={stopCamera}
                  className="px-4 py-3 rounded-xl bg-white/20 text-white font-bold">
                  ✕
                </button>
              </div>
            )}

            <p className="text-purple-400 text-xs text-center mt-4">
              Your selfie is never stored • Used only for search
            </p>
          </div>
        )}

        {!searching && searched && (
          <div>
            {error ? (
              <div className="bg-red-500/20 border border-red-400/30 rounded-2xl p-6 text-center mb-4">
                <p className="text-3xl mb-2">😕</p>
                <p className="text-red-300 font-medium">{error}</p>
                <button onClick={resetSearch}
                  className="mt-4 px-6 py-2 rounded-xl bg-white/10 text-white text-sm">
                  Try Again
                </button>
              </div>
            ) : photos.length === 0 ? (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center border border-white/20">
                <p className="text-4xl mb-3">😔</p>
                <p className="text-white font-semibold text-lg">No photos found</p>
                <p className="text-purple-300 text-sm mt-2">
                  Look directly at camera in good lighting and try again
                </p>
                <button onClick={resetSearch}
                  className="mt-5 px-6 py-2 rounded-xl text-white text-sm font-medium"
                  style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                  Try Again
                </button>
              </div>
            ) : (
              <div>
                <div className="text-center mb-5">
                  <p className="text-white text-xl font-bold">
                    🎉 Found {photos.length} photo{photos.length > 1 ? "s" : ""} with you!
                  </p>
                  <p className="text-purple-300 text-sm mt-1">Tap download to save</p>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {photos.map((photo) => (
                    <div key={photo.photo_id}
                      className="rounded-xl overflow-hidden border border-white/20">
                      <img src={photo.thumbnail_url} alt={photo.filename}
                        className="w-full h-44 object-cover" />
                      <div className="p-2 bg-white/10">
                        <a href={photo.download_url} download
                          className="block w-full text-center py-2 rounded-lg text-white text-sm font-medium"
                          style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                          ⬇ Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={resetSearch}
                  className="w-full py-3 rounded-xl border border-purple-300/40 text-purple-200 font-medium">
                  🔄 Search Again
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-purple-500 text-xs mt-8">
          Powered by Photo Finder AI
        </p>
      </div>
    </div>
  );
}