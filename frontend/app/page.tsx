"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// ============================================================
// CHANGE THESE WHEN READY — all contact details in one place
// ============================================================
// const WHATSAPP_NUMBER = "919876543210"; // UNCOMMENT when ready: remove + and spaces
// const DISPLAY_PHONE = "+91 98765 43210"; // UNCOMMENT when ready: display format
const DISPLAY_EMAIL = "hello@snapfind.in"; // Change to your real email
// const INSTAGRAM_HANDLE = "@snapfind.in"; // UNCOMMENT when ready
// const INSTAGRAM_URL = "https://instagram.com/snapfind.in"; // UNCOMMENT when ready
const FORMSPREE_ENDPOINT = "https://formspree.io/f/xqenknoz";
// ============================================================

export default function Homepage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", message: "", type: "School / College"
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        setSubmitError("Something went wrong. Please email us directly.");
      }
    } catch {
      setSubmitError("Could not send. Please email us directly.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* NAVBAR */}
      <nav className="fixed top-0 w-full bg-white/90 backdrop-blur-md z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📸</span>
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              SnapFind
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#how" className="hover:text-purple-600 transition-colors">How it Works</a>
            <a href="#pricing" className="hover:text-purple-600 transition-colors">Pricing</a>
            <a href="#contact" className="hover:text-purple-600 transition-colors">Contact</a>
          </div>
          <button
            onClick={() => router.push("/login")}
            className="px-5 py-2 rounded-xl text-white text-sm font-semibold shadow-md transition-all hover:shadow-lg hover:scale-105"
            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            Admin Login
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-32 pb-24 px-6 text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)" }}>
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full text-purple-200 text-sm mb-6 border border-white/20">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            AI-Powered • Made for India • No App Required
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
            Your Face.<br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Your Photos.
            </span><br />
            Instantly.
          </h1>
          <p className="text-xl text-purple-200 mb-4 max-w-2xl mx-auto">
            Upload event photos once. Guests take a selfie. AI finds their photos in seconds.
          </p>
          <p className="text-purple-300 text-sm mb-10">
            Perfect for schools • weddings • corporate events • farewell parties
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#contact"
              className="px-8 py-4 rounded-2xl text-white font-bold text-lg shadow-2xl transition-all hover:scale-105"
              style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
              Get Started Free →
            </a>
            <a href="#how"
              className="px-8 py-4 rounded-2xl text-white font-semibold text-lg border border-white/30 hover:bg-white/10 transition-all">
              See How It Works
            </a>
          </div>
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto mt-16">
            {[
              { value: "< 5 sec", label: "To find your photos" },
              { value: "99%+", label: "AI accuracy" },
              { value: "₹0", label: "App download needed" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-black text-white">{s.value}</p>
                <p className="text-purple-300 text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">How SnapFind Works</h2>
            <p className="text-gray-500 text-lg">Three steps. Zero confusion. Works on any phone.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: "📤", title: "Admin Uploads Photos", desc: "Photographer or school staff uploads all event photos in one go. Our AI automatically detects and indexes every face in the background.", color: "from-purple-500 to-indigo-500" },
              { step: "02", icon: "📷", title: "Guest Takes a Selfie", desc: "Guest scans the QR code or opens the event link. Takes a quick selfie using their phone camera. No app download. No login required.", color: "from-pink-500 to-rose-500" },
              { step: "03", icon: "🎉", title: "AI Finds Their Photos", desc: "Our AI compares the selfie against all event photos and returns only the photos with that person — in under 5 seconds.", color: "from-green-500 to-emerald-500" },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white text-xs font-black mb-4`}>
                  {item.step}
                </div>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT'S FOR */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Built for Every Event</h2>
            <p className="text-gray-500 text-lg">From small school functions to large corporate events</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "🏫", title: "Schools & Colleges", desc: "Annual days, farewell parties, sports days. Students find their photos instantly without bothering staff.", tag: "Most Popular" },
              { icon: "💍", title: "Weddings", desc: "400 guests, 1200 photos. Each family finds only their photos. No WhatsApp chaos, no privacy issues.", tag: "" },
              { icon: "🏢", title: "Corporate Events", desc: "Annual days, team outings, conferences. Employees download photos for LinkedIn and ID cards.", tag: "" },
              { icon: "🎓", title: "Graduation Ceremonies", desc: "Every student gets their proud moment photos automatically. Parents love it.", tag: "" },
              { icon: "🎉", title: "Birthday & Private Parties", desc: "Private galleries with access control. Only invited guests can find their photos.", tag: "" },
              { icon: "📸", title: "Photography Studios", desc: "Deliver photos professionally. Clients find their shots instantly. Look premium, charge more.", tag: "" },
            ].map((item) => (
              <div key={item.title} className="relative p-6 rounded-2xl border border-gray-100 hover:border-purple-200 hover:shadow-md transition-all">
                {item.tag && (
                  <span className="absolute -top-3 left-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    {item.tag}
                  </span>
                )}
                <div className="text-4xl mb-3">{item.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY SNAPFIND */}
      <section className="py-24 px-6"
        style={{ background: "linear-gradient(135deg, #0f0c29 0%, #302b63 100%)" }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-white mb-4">Why Not WhatsApp or Google Drive?</h2>
            <p className="text-purple-300 text-lg">The old way vs the SnapFind way</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
              <h3 className="text-red-400 font-bold text-lg mb-6">❌ The Old Way</h3>
              <div className="space-y-4">
                {[
                  "300 people scrolling through 1000 photos",
                  "Staff spend 2-3 days manually sorting photos",
                  "Zero privacy — everyone sees everyone's photos",
                  "WhatsApp groups get flooded and ignored",
                  "Google Drive folders with no search",
                  "Professional tools cost ₹50,000+/month",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                    <p className="text-purple-200 text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/10 border border-purple-400/30 rounded-3xl p-8">
              <h3 className="text-green-400 font-bold text-lg mb-6">✅ The SnapFind Way</h3>
              <div className="space-y-4">
                {[
                  "Find all your photos in under 5 seconds",
                  "AI indexes everything automatically — zero staff effort",
                  "Private galleries — guests see only their photos",
                  "One QR code — works on any smartphone",
                  "AI face search — no scrolling needed",
                  "Starting at ₹1,999/year — affordable for schools",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                    <p className="text-white text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Simple, Honest Pricing</h2>
            <p className="text-gray-500 text-lg">No hidden fees. No per-search charges. Pay once, use all year.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Free Trial", price: "₹0", period: "2 events", desc: "Try before you buy", features: ["2 events", "100 photos/event", "500MB storage", "Email support"], cta: "Start Free", highlight: false },
              { name: "Basic", price: "₹1,999", period: "/year", desc: "Perfect for schools & photographers", features: ["12 events/year", "500 photos/event", "5GB storage", "WhatsApp support", "QR code sharing"], cta: "Get Started", highlight: true },
              { name: "Pro", price: "₹4,999", period: "/year", desc: "For studios & frequent events", features: ["Unlimited events", "3,000 photos/event", "20GB storage", "Priority support", "Analytics dashboard"], cta: "Go Pro", highlight: false },
            ].map((plan) => (
              <div key={plan.name}
                className={`rounded-3xl p-8 ${plan.highlight ? "text-white shadow-2xl scale-105" : "bg-white border border-gray-100 shadow-sm"}`}
                style={plan.highlight ? { background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" } : {}}>
                <p className={`text-sm font-semibold mb-1 ${plan.highlight ? "text-purple-200" : "text-purple-600"}`}>{plan.name}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-4xl font-black ${plan.highlight ? "text-white" : "text-gray-900"}`}>{plan.price}</span>
                  <span className={`text-sm mb-1 ${plan.highlight ? "text-purple-200" : "text-gray-400"}`}>{plan.period}</span>
                </div>
                <p className={`text-sm mb-6 ${plan.highlight ? "text-purple-200" : "text-gray-400"}`}>{plan.desc}</p>
                <div className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <div key={f} className="flex items-center gap-2">
                      <span className={plan.highlight ? "text-green-300" : "text-green-500"}>✓</span>
                      <span className={`text-sm ${plan.highlight ? "text-white" : "text-gray-600"}`}>{f}</span>
                    </div>
                  ))}
                </div>
                <a href="#contact"
                  className={`block w-full text-center py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105 ${plan.highlight ? "bg-white text-purple-600" : "text-white"}`}
                  style={!plan.highlight ? { background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" } : {}}>
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-4">Get In Touch</h2>
            <p className="text-gray-500 text-lg">Send us your query — we will get back to you as soon as possible.</p>
          </div>

          {/* ============================================================ */}
          {/* CONTACT BUTTONS — uncomment when you have real details ready  */}
          {/* ============================================================ */}
          {/*
          <div className="grid grid-cols-2 gap-4 mb-8">
            <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi, I'm interested in SnapFind for my event`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl border-2 border-green-200 bg-green-50 hover:bg-green-100 transition-all">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">WhatsApp Us</p>
                <p className="text-sm font-bold text-gray-800">{DISPLAY_PHONE}</p>
              </div>
            </a>
            <a href={`mailto:${DISPLAY_EMAIL}`}
              className="flex items-center gap-3 p-4 rounded-2xl border-2 border-purple-200 bg-purple-50 hover:bg-purple-100 transition-all">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Email Us</p>
                <p className="text-sm font-bold text-gray-800">{DISPLAY_EMAIL}</p>
              </div>
            </a>
          </div>
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-gray-400 text-sm">or fill the form</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
          */}
          {/* ============================================================ */}

          {submitted ? (
            <div className="text-center py-16 bg-gray-50 rounded-3xl border border-gray-100">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">We received your message!</h3>
              <p className="text-gray-500">Our team will review your query and get back to you as soon as possible.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 bg-gray-50 p-8 rounded-3xl border border-gray-100">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name *</label>
                  <input type="text" required placeholder="Rahul Sharma"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 placeholder-gray-400" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">WhatsApp Number *</label>
                  <input type="tel" required placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 placeholder-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
                <input type="email" required placeholder="rahul@school.edu"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 placeholder-gray-400" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">I am a *</label>
                <select value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900">
                  {["School / College", "Photographer", "Wedding Planner", "Corporate / HR", "Other"].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Your Message</label>
                <textarea rows={4} placeholder="Tell us about your event or ask any question..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-900 placeholder-gray-400 resize-none" />
              </div>
              {submitError && (
                <p className="text-red-500 text-sm text-center">{submitError}</p>
              )}
              <button type="submit" disabled={submitting}
                className="w-full py-4 rounded-xl text-white font-bold text-base transition-all hover:scale-105 shadow-lg disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                {submitting ? "Sending..." : "Send Message →"}
              </button>
              <p className="text-center text-xs text-gray-400">
                No spam • We read every message
              </p>
            </form>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "linear-gradient(135deg, #0f0c29 0%, #302b63 100%)" }}
        className="py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 mb-10">

            {/* Brand */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">📸</span>
                <span className="text-xl font-bold text-white">SnapFind</span>
              </div>
              <p className="text-purple-300 text-sm leading-relaxed">
                AI-powered photo discovery for schools, weddings and corporate events across India.
              </p>
              <p className="text-purple-400 text-xs mt-3">Made in India 🇮🇳</p>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-white font-bold mb-4">Contact Us</h4>
              <div className="space-y-3">
                {/* ============================================================ */}
                {/* UNCOMMENT BELOW when WhatsApp number is ready                 */}
                {/* ============================================================ */}
                {/*
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors text-sm">
                  <span className="text-green-400">💬</span>
                  WhatsApp: {DISPLAY_PHONE}
                </a>
                */}
                <a href={`mailto:${DISPLAY_EMAIL}`}
                  className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors text-sm">
                  <span>✉️</span>
                  {DISPLAY_EMAIL}
                </a>
                {/* ============================================================ */}
                {/* UNCOMMENT BELOW when Instagram is ready                       */}
                {/* ============================================================ */}
                {/*
                <a href={INSTAGRAM_URL}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors text-sm">
                  <span>📸</span>
                  Instagram: {INSTAGRAM_HANDLE}
                </a>
                */}
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h4 className="text-white font-bold mb-4">Quick Links</h4>
              <div className="space-y-2">
                {[
                  { label: "How it Works", href: "#how" },
                  { label: "Pricing", href: "#pricing" },
                  { label: "Contact Us", href: "#contact" },
                  { label: "Admin Login", href: "/login" },
                ].map((link) => (
                  <a key={link.label} href={link.href}
                    className="block text-purple-300 hover:text-white transition-colors text-sm">
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-purple-400 text-sm">© 2026 SnapFind. All rights reserved.</p>
            <p className="text-purple-500 text-xs">
              Your selfie is never stored • All data encrypted • Privacy first
            </p>
          </div>
        </div>
      </footer>

      {/* ============================================================ */}
      {/* FLOATING WHATSAPP BUTTON — uncomment when number is ready    */}
      {/* ============================================================ */}
      {/*
      <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi, I'm interested in SnapFind`}
        target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-2xl hover:bg-green-600 transition-all hover:scale-110 z-50">
        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
      */}
      {/* ============================================================ */}

    </div>
  );
}