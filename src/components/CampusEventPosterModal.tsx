import React, { useEffect, useState } from 'react';
import {
  X,
  Calendar,
  MapPin,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Plus,
  Edit3,
  Trash2,
  Upload,
  Eye,
  EyeOff,
  Flame,
  Award,
  Loader2,
  Megaphone,
} from 'lucide-react';

export interface EventPoster {
  poster_id: number;
  title: string;
  organizer: string;
  category: string;
  event_date: string;
  venue: string;
  description: string;
  image_url: string;
  registration_link?: string;
  is_active: boolean;
  rsvp_count: number;
  display_order: number;
}

interface CampusEventPosterModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
  initialAdminMode?: boolean;
  onPostersChanged?: () => void;
}

const API_BASE =
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1'
    ? `http://${window.location.hostname}:5001`
    : 'http://localhost:5001';

export function resolvePosterUrl(url?: string): string {
  if (!url) return './posters/ieee-hackathon.jpg';
  if (url.startsWith('/posters/')) {
    return `.${url}`;
  }
  return url;
}

const FALLBACK_POSTERS: EventPoster[] = [
  {
    poster_id: 1,
    title: '24 Hours Hackathon — "Tech For Good"',
    organizer: 'IEEE Student Branch • IEEE Day Celebration',
    category: 'Hackathon',
    event_date: '12 – 13 October 2026 (24 Hours)',
    venue: 'Campus Innovation Hub (Team Size: 3–5 Members)',
    description:
      'Ideate, Innovate, Collaborate & Create Real Impact! Tracks: 1) AI & Smart Campus Solutions, 2) CleanTech & Environmental Sustainability, 3) Healthcare & Assistive Technology. Free Registration for all UG & PG students.',
    image_url: './posters/ieee-hackathon.jpg',
    registration_link: '',
    is_active: true,
    rsvp_count: 48,
    display_order: 1,
  },
  {
    poster_id: 2,
    title: 'AVINYA 2K26 — Dance Club Auditions',
    organizer: 'KLH University • Student Activity Centre (SAC)',
    category: 'Cultural & SAC',
    event_date: 'Auditions: 12th October 2026 (Reg closes 11th Oct)',
    venue: 'SAC Auditorium, KLH Aziz Nagar Campus',
    description:
      'Feel the Beat. Own the Stage! KLH University Student Activity Centre Dance Club invites passionate dancers for Avinya 2K26 auditions. Scan the QR code on the poster or click Register to secure your slot.',
    image_url: './posters/avinya-dance.jpg',
    registration_link: '',
    is_active: true,
    rsvp_count: 64,
    display_order: 2,
  },
  {
    poster_id: 3,
    title: 'IEEE DAY 2026 — Canva Design Workshop',
    organizer: 'KLH Aziz Nagar Campus • IEEE SB KLH',
    category: 'Workshop',
    event_date: '6 October 2026 | 10:00 AM – 12:00 PM',
    venue: 'Open Auditorium, KLH Aziz Nagar Campus',
    description:
      'Together for a Brighter Tomorrow: Innovation • Community • Global Impact. Join our hands-on Canva Workshop to learn, create, and make an impact.',
    image_url: './posters/ieee-canva-workshop.jpg',
    registration_link: '',
    is_active: true,
    rsvp_count: 39,
    display_order: 3,
  },
];

export default function CampusEventPosterModal({
  isOpen,
  onClose,
  isAdmin = false,
  initialAdminMode = false,
  onPostersChanged,
}: CampusEventPosterModalProps) {
  const [posters, setPosters] = useState<EventPoster[]>(FALLBACK_POSTERS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [rsvpedIds, setRsvpedIds] = useState<number[]>([]);
  const [rsvping, setRsvping] = useState(false);

  // Admin management state
  const [adminMode, setAdminMode] = useState(initialAdminMode);
  const [editingPoster, setEditingPoster] = useState<EventPoster | null>(null);
  const [savingPoster, setSavingPoster] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    organizer: 'KLH University',
    category: 'Hackathon',
    event_date: '',
    venue: 'KLH Aziz Nagar Campus',
    description: '',
    image_url: '',
    registration_link: '',
    is_active: true,
    display_order: 1,
  });

  useEffect(() => {
    setAdminMode(initialAdminMode);
  }, [initialAdminMode]);

  useEffect(() => {
    if (isOpen) {
      fetchPosters();
    }
  }, [isOpen, adminMode]);

  async function fetchPosters() {
    try {
      setLoading(true);
      const query = isAdmin ? '' : '?activeOnly=true';
      const res = await fetch(`${API_BASE}/api/event-posters${query}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setPosters(data);
          setCurrentIndex(0);
        } else if (isAdmin && Array.isArray(data)) {
          setPosters(data);
        }
      }
    } catch (err) {
      console.warn('Using fallback event posters:', err);
    } finally {
      setLoading(false);
    }
  }

  const visiblePosters = isAdmin && adminMode ? posters : posters.filter((p) => p.is_active !== false);
  const currentPoster = visiblePosters[currentIndex] || visiblePosters[0] || FALLBACK_POSTERS[0];

  function handlePrev() {
    setCurrentIndex((prev) => (prev === 0 ? visiblePosters.length - 1 : prev - 1));
  }

  function handleNext() {
    setCurrentIndex((prev) => (prev === visiblePosters.length - 1 ? 0 : prev + 1));
  }

  async function handleRsvp(poster: EventPoster) {
    if (rsvpedIds.includes(poster.poster_id)) {
      if (poster.registration_link) {
        window.open(poster.registration_link, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    try {
      setRsvping(true);
      const res = await fetch(`${API_BASE}/api/event-posters/${poster.poster_id}/rsvp`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setPosters((prev) =>
          prev.map((p) => (p.poster_id === poster.poster_id ? { ...p, rsvp_count: data.poster.rsvp_count } : p))
        );
      } else {
        setPosters((prev) =>
          prev.map((p) => (p.poster_id === poster.poster_id ? { ...p, rsvp_count: (p.rsvp_count || 0) + 1 } : p))
        );
      }
      setRsvpedIds((prev) => [...prev, poster.poster_id]);
      if (poster.registration_link) {
        window.open(poster.registration_link, '_blank', 'noopener,noreferrer');
      }
    } catch {
      setRsvpedIds((prev) => [...prev, poster.poster_id]);
    } finally {
      setRsvping(false);
    }
  }

  function startAddNewPoster() {
    setEditingPoster(null);
    setFormData({
      title: '',
      organizer: 'KLH University • Student Activity Centre',
      category: 'Hackathon',
      event_date: '',
      venue: 'KLH Aziz Nagar Campus',
      description: '',
      image_url: '',
      registration_link: '',
      is_active: true,
      display_order: posters.length + 1,
    });
  }

  function startEditPoster(poster: EventPoster) {
    setEditingPoster(poster);
    setFormData({
      title: poster.title,
      organizer: poster.organizer || 'KLH University',
      category: poster.category || 'Hackathon',
      event_date: poster.event_date || '',
      venue: poster.venue || '',
      description: poster.description || '',
      image_url: poster.image_url || '',
      registration_link: poster.registration_link || '',
      is_active: poster.is_active !== false,
      display_order: poster.display_order || 1,
    });
  }

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, image_url: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSavePoster(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.title.trim() || !formData.image_url.trim()) {
      alert('Please provide an Event Title and upload/select a Poster Image.');
      return;
    }

    try {
      setSavingPoster(true);
      const url = editingPoster
        ? `${API_BASE}/api/event-posters/${editingPoster.poster_id}`
        : `${API_BASE}/api/event-posters`;
      const method = editingPoster ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to save poster');
      }

      await fetchPosters();
      onPostersChanged?.();
      startAddNewPoster();
      alert(editingPoster ? 'Event poster updated!' : 'New event poster published to student login popup!');
    } catch (err: any) {
      alert(err.message || 'Failed to save event poster');
    } finally {
      setSavingPoster(false);
    }
  }

  async function handleToggleActive(poster: EventPoster) {
    try {
      const res = await fetch(`${API_BASE}/api/event-posters/${poster.poster_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !poster.is_active }),
      });
      if (res.ok) {
        await fetchPosters();
        onPostersChanged?.();
      }
    } catch (err) {
      console.error('Toggle active error:', err);
    }
  }

  async function handleDeletePoster(posterId: number) {
    if (!window.confirm('Are you sure you want to delete this event poster?')) return;
    try {
      const res = await fetch(`${API_BASE}/api/event-posters/${posterId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchPosters();
        onPostersChanged?.();
      }
    } catch (err) {
      console.error('Delete poster error:', err);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[92vh] rounded-3xl bg-slate-900 border border-slate-700/80 shadow-2xl overflow-hidden flex flex-col text-white">
        {/* Top Gradient Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-amber-400 to-red-600" />

        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-950/90 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-700 to-amber-600 flex items-center justify-center shadow-md">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white">
                  KLH Campus Events & Hackathon Spotlight
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  <Sparkles className="w-3 h-3" /> Live Announcements
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Official Hackathons, Workshops & Student Activity Centre (SAC) Auditions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setAdminMode(!adminMode);
                  if (!adminMode) startAddNewPoster();
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
                  adminMode
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-slate-700'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{adminMode ? 'Preview Student Popup' : 'Manage Posters (Admin)'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-red-600 text-slate-300 hover:text-white transition"
              title="Close Spotlight"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        {adminMode && isAdmin ? (
          /* ==============================================================
             ADMIN POSTER MANAGEMENT STUDIO (ADD / EDIT / TOGGLE / DELETE)
             ============================================================== */
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900">
            {/* Left Column: Add / Edit Form */}
            <div className="lg:col-span-5 rounded-2xl bg-slate-950/90 border border-slate-800 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                  {editingPoster ? <Edit3 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingPoster ? 'Edit Event Poster' : 'Add New Event Poster'}</span>
                </h3>
                {editingPoster && (
                  <button
                    type="button"
                    onClick={startAddNewPoster}
                    className="text-xs text-slate-400 hover:text-white underline"
                  >
                    + Create New Instead
                  </button>
                )}
              </div>

              <form onSubmit={handleSavePoster} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder='e.g. 24 Hours Hackathon — "Tech For Good"'
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:outline-none focus:border-amber-400"
                    >
                      <option value="Hackathon">🏆 Hackathon</option>
                      <option value="Cultural & SAC">🎭 Cultural & SAC</option>
                      <option value="Workshop">💻 Workshop</option>
                      <option value="Tech Fest">🚀 Tech Fest</option>
                      <option value="Placement Drive">💼 Placement Drive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Organizer / Club</label>
                    <input
                      type="text"
                      placeholder="e.g. IEEE Student Branch"
                      value={formData.organizer}
                      onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Event Date & Time</label>
                    <input
                      type="text"
                      placeholder="e.g. 12–13 October 2026"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-300 mb-1">Venue / Location</label>
                    <input
                      type="text"
                      placeholder="e.g. Open Auditorium"
                      value={formData.venue}
                      onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Poster Image (Upload File or URL) *</label>
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer px-3 py-2 rounded-xl bg-red-700 hover:bg-red-600 text-white font-bold flex items-center gap-1.5 shrink-0 transition">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Poster</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    </label>
                    <input
                      type="text"
                      placeholder="or paste image path/URL (/posters/...)"
                      value={formData.image_url}
                      onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[11px] focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  {formData.image_url && (
                    <div className="mt-2 relative h-32 rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                      <img src={resolvePosterUrl(formData.image_url)} alt="Preview" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Description / Highlights</label>
                  <textarea
                    rows={3}
                    placeholder="Key tracks, eligibility, prizes, or audition instructions..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">External Registration Link (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={formData.registration_link}
                    onChange={(e) => setFormData({ ...formData, registration_link: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <label className="flex items-center gap-2 pt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="font-semibold text-slate-200">
                    Show this poster in Student Login Popup
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={savingPoster}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  {savingPoster ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>{editingPoster ? 'Update Event Poster' : 'Publish Event Poster'}</span>
                  )}
                </button>
              </form>
            </div>

            {/* Right Column: Existing Posters List */}
            <div className="lg:col-span-7 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white">
                  All Campus Event Posters ({posters.length})
                </h3>
                <span className="text-xs text-slate-400">
                  Active posters pop up automatically when students log in
                </span>
              </div>

              <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                {posters.map((poster) => (
                  <div
                    key={poster.poster_id}
                    className={`p-3.5 rounded-2xl border transition flex items-center gap-4 ${
                      poster.is_active
                        ? 'bg-slate-950/90 border-slate-800'
                        : 'bg-slate-950/40 border-slate-800/50 opacity-60'
                    }`}
                  >
                    <img
                      src={resolvePosterUrl(poster.image_url)}
                      alt={poster.title}
                      className="w-20 h-24 object-cover rounded-xl border border-slate-700 shrink-0 bg-slate-900"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-md bg-red-950 text-red-300 border border-red-800 text-[10px] font-bold">
                          {poster.category}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            poster.is_active
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {poster.is_active ? 'Active on Login' : 'Hidden'}
                        </span>
                        <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                          <Flame className="w-3 h-3" /> {poster.rsvp_count || 0} Interested
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white truncate mt-1">{poster.title}</h4>
                      <p className="text-xs text-slate-400 truncate">
                        {poster.event_date} • {poster.venue}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(poster)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                        title={poster.is_active ? 'Hide from Login Popup' : 'Show in Login Popup'}
                      >
                        {poster.is_active ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEditPoster(poster)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-amber-300 transition"
                        title="Edit Poster"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePoster(poster.poster_id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-red-600 text-rose-400 hover:text-white transition"
                        title="Delete Poster"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ==============================================================
             STUDENT INTERACTIVE EVENT POSTER SPOTLIGHT CAROUSEL
             ============================================================== */
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 bg-slate-950">
            {/* Left Side: Full High-Res Event Poster Display */}
            <div className="lg:col-span-7 relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 sm:p-6 min-h-[360px] sm:min-h-[500px] border-b lg:border-b-0 lg:border-r border-slate-800">
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              ) : (
                <>
                  <img
                    src={resolvePosterUrl(currentPoster.image_url)}
                    alt={currentPoster.title}
                    className="max-h-[64vh] w-auto max-w-full object-contain rounded-2xl shadow-2xl border border-white/10 transition-all duration-300"
                  />

                  {/* Left / Right Carousel Arrows */}
                  {visiblePosters.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={handlePrev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/90 hover:bg-red-700 text-white border border-slate-700 flex items-center justify-center shadow-xl transition"
                        title="Previous Event Poster"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={handleNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/90 hover:bg-red-700 text-white border border-slate-700 flex items-center justify-center shadow-xl transition"
                        title="Next Event Poster"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Slide Counter Pill */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-950/90 border border-slate-700 text-[11px] font-bold text-amber-300 shadow-lg">
                    Event {currentIndex + 1} of {visiblePosters.length}
                  </div>
                </>
              )}
            </div>

            {/* Right Side: Event Details, Metadata & Registration CTA */}
            <div className="lg:col-span-5 p-6 flex flex-col justify-between bg-slate-900/90">
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-red-950 text-red-300 border border-red-800">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    {currentPoster.category}
                  </span>

                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    {currentPoster.rsvp_count || 42} Students Interested
                  </span>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    {currentPoster.organizer}
                  </p>
                  <h3 className="text-xl sm:text-2xl font-black text-white mt-1 leading-tight">
                    {currentPoster.title}
                  </h3>
                </div>

                <div className="space-y-2.5 rounded-2xl bg-slate-950/80 border border-slate-800 p-4 text-xs">
                  <div className="flex items-center gap-2.5 text-slate-200">
                    <Calendar className="w-4 h-4 text-red-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Date & Schedule</span>
                      <span className="font-bold text-white">{currentPoster.event_date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 text-slate-200 pt-2 border-t border-slate-800/80">
                    <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Venue</span>
                      <span className="font-bold text-white">{currentPoster.venue}</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {currentPoster.description}
                </p>

                {/* Poster Thumbnail Selector Strip */}
                {visiblePosters.length > 1 && (
                  <div className="pt-2">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Featured Campus Events ({visiblePosters.length})
                    </span>
                    <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                      {visiblePosters.map((p, idx) => (
                        <button
                          key={p.poster_id}
                          type="button"
                          onClick={() => setCurrentIndex(idx)}
                          className={`relative rounded-xl overflow-hidden border-2 transition shrink-0 ${
                            idx === currentIndex
                              ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105'
                              : 'border-slate-700 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={resolvePosterUrl(p.image_url)} alt={p.title} className="w-14 h-16 object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Action Buttons */}
              <div className="pt-6 mt-6 border-t border-slate-800 space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleRsvp(currentPoster)}
                  disabled={rsvping}
                  className={`w-full py-3 px-4 rounded-xl font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition ${
                    rsvpedIds.includes(currentPoster.poster_id)
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-gradient-to-r from-red-700 via-red-600 to-amber-600 hover:from-red-600 hover:to-amber-500 text-white'
                  }`}
                >
                  {rsvpedIds.includes(currentPoster.poster_id) ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Registered Interest! See You at the Event</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>I&apos;m Interested / Register for Event</span>
                      {currentPoster.registration_link && <ExternalLink className="w-3.5 h-3.5" />}
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between gap-2">
                  {visiblePosters.length > 1 && (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
                    >
                      Next Event Poster →
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold transition"
                  >
                    Continue to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
