import React, { useEffect, useRef, useState } from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  MonitorUp,
  Hand,
  MessageSquare,
  Users,
  Send,
  CheckCircle2,
  ExternalLink,
  PenTool,
  Trash2,
  PhoneOff,
  Radio,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Award,
  Mail,
  UserPlus,
  Loader2,
  BellRing,
  Copy,
  Check,
} from 'lucide-react';

const API_URL = 'http://localhost:5001';

export interface TeamPeer {
  user_id?: number;
  name: string;
  role: string;
  email?: string;
}

export interface LiveVideoConferenceRoomProps {
  roomName: string;
  title: string;
  subtitle?: string;
  userName: string;
  userEmail: string;
  userRole?: string;
  mode?: 'lecture' | 'huddle';
  peers?: TeamPeer[];
  onLeave?: () => void;
  onLogContribution?: () => void;
}

interface JoinedParticipant {
  name: string;
  email: string;
  role: string;
  camOn: boolean;
  micOn: boolean;
  handRaised: boolean;
  lastSeen: number;
}

interface ChatMessage {
  id: number;
  sender: string;
  role: string;
  text: string;
  time: string;
}

export default function LiveVideoConferenceRoom({
  roomName,
  title,
  subtitle = 'KL EduConnect Encrypted WebRTC Live Session',
  userName,
  userEmail,
  userRole = 'student',
  mode = 'lecture',
  peers = [],
  onLeave,
  onLogContribution,
}: LiveVideoConferenceRoomProps) {
  const [engine, setEngine] = useState<'native' | 'jitsi'>('native');

  // Media states
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenSharing, setScreenSharing] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [activeSidebar, setActiveSidebar] = useState<'chat' | 'participants' | 'invite' | null>('invite');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [floatingReaction, setFloatingReaction] = useState<string | null>(null);
  const [huddleLogged, setHuddleLogged] = useState(false);

  // Real-time joined participants (ONLY people who have actually joined the room!)
  const [joinedOthers, setJoinedOthers] = useState<JoinedParticipant[]>([]);

  // Real-time chat messages (starts empty — no fake messages!)
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Email & Portal Notification Invite State
  const [customInviteEmail, setCustomInviteEmail] = useState('');
  const [customInviteName, setCustomInviteName] = useState('');
  const [invitingKey, setInvitingKey] = useState<string | null>(null);
  const [invitedEmails, setInvitedEmails] = useState<Record<string, boolean>>({});
  const [inviteToast, setInviteToast] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Refs for local video & screen share
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const screenRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#f59e0b');

  // Session duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Real-Time Presence & Chat Sync (ONLY shows users who have actually joined!)
  useEffect(() => {
    let active = true;
    const myKey = (userEmail || userName).trim().toLowerCase();

    async function syncPresence() {
      try {
        const res = await fetch(`${API_URL}/api/live-room/presence`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            room_name: roomName,
            user_name: userName,
            user_email: userEmail,
            user_role: userRole === 'faculty' ? 'Faculty Host' : mode === 'huddle' ? 'Team Member' : 'Student',
            cam_on: camOn,
            mic_on: micOn,
            hand_raised: handRaised,
          }),
        });
        if (!res.ok || !active) return;
        const data = await res.json();
        if (Array.isArray(data.participants)) {
          const others = data.participants.filter(
            (p: JoinedParticipant) => (p.email || p.name || '').trim().toLowerCase() !== myKey
          );
          setJoinedOthers(others);
        }
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      } catch {}
    }

    syncPresence();
    const interval = setInterval(syncPresence, 3000);

    return () => {
      active = false;
      clearInterval(interval);
      fetch(`${API_URL}/api/live-room/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_name: roomName,
          user_name: userName,
          user_email: userEmail,
        }),
      }).catch(() => {});
    };
  }, [roomName, userName, userEmail, userRole, mode, camOn, micOn, handRaised]);

  // Start / Stop Webcam & Microphone via WebRTC
  useEffect(() => {
    if (engine !== 'native') {
      stopAllStreams();
      return;
    }

    async function initMedia() {
      try {
        setCameraError(null);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: any) {
        console.warn('Webcam/Mic access fallback:', err);
        setCameraError('Camera preview in avatar mode (grant browser camera permission for live video)');
      }
    }

    initMedia();

    return () => {
      stopAllStreams();
    };
  }, [engine]);

  function stopAllStreams() {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
  }

  function toggleMic() {
    const next = !micOn;
    setMicOn(next);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = next;
      });
    }
  }

  async function toggleCam() {
    const next = !camOn;
    setCamOn(next);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = next;
      });
    } else if (next) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: micOn });
        localStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraError(null);
      } catch {
        setCameraError('Could not access camera');
      }
    }
  }

  async function toggleScreenShare() {
    if (screenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setScreenSharing(false);
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      screenStreamRef.current = displayStream;
      setScreenSharing(true);
      setTimeout(() => {
        if (screenRef.current) {
          screenRef.current.srcObject = displayStream;
        }
      }, 100);

      displayStream.getVideoTracks()[0].onended = () => {
        setScreenSharing(false);
        screenStreamRef.current = null;
      };
    } catch (err) {
      console.warn('Screen share cancelled or blocked:', err);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const text = chatInput.trim();
    const roleLabel = userRole === 'faculty' ? 'Faculty Host' : mode === 'huddle' ? 'Team Member' : 'Student';
    setChatInput('');

    const optimisticMsg: ChatMessage = {
      id: Date.now(),
      sender: userName,
      role: roleLabel,
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      const res = await fetch(`${API_URL}/api/live-room/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_name: roomName,
          sender: userName,
          role: roleLabel,
          text,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) {
          setMessages(data.messages);
        }
      }
    } catch {}
  }

  // Send real Email + In-App Notification Invite to a team member or custom email
  async function handleSendInvite(targets: { user_id?: number; name: string; email: string }[], keyLabel: string) {
    if (!targets || targets.length === 0) return;
    try {
      setInvitingKey(keyLabel);
      setInviteError(null);
      setInviteToast(null);

      const res = await fetch(`${API_URL}/api/huddle/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_name: roomName,
          room_title: title,
          group_name: title,
          inviter_name: userName,
          inviter_email: userEmail,
          invitees: targets,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const updatedMap = { ...invitedEmails };
        targets.forEach((t) => {
          updatedMap[(t.email || t.name).toLowerCase()] = true;
        });
        setInvitedEmails(updatedMap);
        setInviteToast(
          data.message ||
            `✉️ Email & Portal Notification invite sent to ${targets.map((t) => t.name || t.email).join(', ')}!`
        );
        setTimeout(() => setInviteToast(null), 6000);
      } else {
        setInviteError(data.error || 'Could not send invitation');
      }
    } catch (err: any) {
      setInviteError(err.message || 'Failed to send invite');
    } finally {
      setInvitingKey(null);
    }
  }

  async function handleCustomEmailInvite(e: React.FormEvent) {
    e.preventDefault();
    const raw = customInviteEmail.trim();
    if (!raw) return;
    const email = raw.includes('@') ? raw : `${raw}@klh.edu.in`;
    const name = customInviteName.trim() || raw.split('@')[0];
    await handleSendInvite([{ name, email }], `custom:${email}`);
    setCustomInviteEmail('');
    setCustomInviteName('');
  }

  function handleCopyRoomLink() {
    const url = `https://meet.ffmuc.net/${encodeURIComponent(roomName)}`;
    navigator.clipboard?.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  }

  function triggerReaction(emoji: string) {
    setFloatingReaction(emoji);
    setTimeout(() => setFloatingReaction(null), 2200);
  }

  // Whiteboard drawing handlers
  function startDraw(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = brushColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }

  function endDraw() {
    setIsDrawing(false);
  }

  function clearWhiteboard() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Total active people who have actually joined the call = You (1) + joinedOthers.length
  const totalJoinedCount = 1 + joinedOthers.length;

  // Check if a team member has already joined the live room
  const isPeerJoined = (peer: TeamPeer) => {
    const pEmail = (peer.email || '').trim().toLowerCase();
    const pName = (peer.name || '').trim().toLowerCase();
    return joinedOthers.some(
      (j) =>
        (pEmail && j.email.trim().toLowerCase() === pEmail) ||
        (pName && j.name.trim().toLowerCase() === pName)
    );
  };

  return (
    <div
      ref={containerRef}
      className="rounded-2xl bg-slate-950 border border-slate-800 text-white shadow-2xl overflow-hidden flex flex-col"
    >
      {/* Top Studio Header Bar */}
      <div className="px-4 py-3 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-400 text-[11px] font-black tracking-wider uppercase">
            <Radio className="w-3.5 h-3.5 animate-pulse text-red-500" />
            <span>LIVE {formatTimer(elapsedSeconds)}</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{title}</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3 h-3" /> {totalJoinedCount} Joined
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-mono">{subtitle}</p>
          </div>
        </div>

        {/* Engine Switcher & Actions */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveSidebar('invite')}
            className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite via Email</span>
          </button>

          {mode === 'huddle' && onLogContribution && (
            <button
              type="button"
              onClick={() => {
                onLogContribution();
                setHuddleLogged(true);
              }}
              disabled={huddleLogged}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                huddleLogged
                  ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40'
                  : 'bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white shadow'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{huddleLogged ? '✓ +2 Huddle Pts Logged' : 'Claim +2 Huddle Pts'}</span>
            </button>
          )}

          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setEngine('native')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                engine === 'native'
                  ? 'bg-red-700 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⚡ Instant Studio
            </button>
            <button
              type="button"
              onClick={() => setEngine('jitsi')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                engine === 'jitsi'
                  ? 'bg-red-700 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🌐 Multi-Peer Jitsi
            </button>
          </div>

          <a
            href={`https://meet.ffmuc.net/${encodeURIComponent(roomName)}`}
            target="_blank"
            rel="noreferrer"
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition"
            title="Open room in external browser tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden md:inline">External Tab</span>
          </a>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Invite Toast Notification Banner */}
      {inviteToast && (
        <div className="px-4 py-2.5 bg-emerald-950/90 border-b border-emerald-700/60 text-emerald-200 text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{inviteToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setInviteToast(null)}
            className="text-emerald-400 hover:text-white text-[11px] font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Conference Body */}
      {engine === 'jitsi' ? (
        <div className="w-full bg-slate-950 min-h-[600px]">
          <JitsiMeeting
            domain="meet.ffmuc.net"
            roomName={roomName}
            userInfo={{
              displayName: userName || 'KL EduConnect Member',
              email: userEmail || 'student@klh.edu.in',
            }}
            configOverwrite={{
              startWithAudioMuted: false,
              startWithVideoMuted: false,
              enableWelcomePage: false,
              prejoinPageEnabled: false,
              disableDeepLinking: true,
            }}
            interfaceConfigOverwrite={{
              SHOW_JITSI_WATERMARK: false,
              SHOW_WATERMARK_FOR_GUESTS: false,
            }}
            getIFrameRef={(iframeRef) => {
              iframeRef.style.height = '600px';
              iframeRef.style.width = '100%';
              iframeRef.style.border = '0';
            }}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[560px] bg-slate-950 relative">
          {/* Floating Emoji Reaction */}
          {floatingReaction && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 text-5xl animate-bounce pointer-events-none">
              {floatingReaction}
            </div>
          )}

          {/* Left/Center Video Grid & Whiteboard Stage */}
          <div
            className={`${
              activeSidebar ? 'lg:col-span-8 xl:col-span-8' : 'lg:col-span-12'
            } p-4 flex flex-col justify-between gap-4`}
          >
            {/* Stage Area: Screen Share OR Whiteboard */}
            {screenSharing && (
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-amber-500/60 shadow-lg h-[320px] flex items-center justify-center">
                <video
                  ref={screenRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain bg-black"
                />
                <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow">
                  <MonitorUp className="w-3.5 h-3.5" />
                  <span>You are sharing your screen</span>
                </div>
              </div>
            )}

            {showWhiteboard && (
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border-2 border-purple-500/50 shadow-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5" /> Interactive Lecture & Architecture Whiteboard (Draw with Mouse)
                  </span>
                  <div className="flex items-center gap-2">
                    {['#f59e0b', '#ef4444', '#10b981', '#38bdf8', '#ffffff'].map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setBrushColor(color)}
                        className={`w-5 h-5 rounded-full border-2 ${
                          brushColor === color ? 'border-white scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                    <button
                      type="button"
                      onClick={clearWhiteboard}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Clear
                    </button>
                  </div>
                </div>
                <canvas
                  ref={canvasRef}
                  width={760}
                  height={240}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  className="w-full h-[220px] bg-slate-950 rounded-xl border border-slate-800 cursor-crosshair"
                />
              </div>
            )}

            {/* Video Tiles Grid: ONLY shows people who have actually joined! */}
            <div
              className={`grid gap-4 flex-1 ${
                joinedOthers.length === 0 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'
              }`}
            >
              {/* Tile 1: Local User (Real Live Camera Feed!) */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-red-500/40 min-h-[300px] flex items-center justify-center shadow-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover transform scale-x-[-1] ${
                    camOn && !cameraError ? 'block' : 'hidden'
                  }`}
                />

                {(!camOn || cameraError) && (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-red-700 to-amber-600 flex items-center justify-center text-3xl font-black text-white shadow-xl border-2 border-white/20 mb-3">
                      {userName
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <p className="text-sm font-bold text-white">{userName} (You)</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {cameraError || 'Camera turned off'}
                    </p>
                  </div>
                )}

                {/* Top Badges */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-slate-950/85 border border-white/15 text-[11px] font-bold text-emerald-400">
                    ● Your Live Feed
                  </span>
                  {handRaised && (
                    <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-black flex items-center gap-1 animate-bounce">
                      ✋ Hand Raised
                    </span>
                  )}
                </div>

                {/* If nobody else has joined yet, show subtle floating prompt in top-right */}
                {joinedOthers.length === 0 && (
                  <div className="absolute top-3 right-3">
                    <button
                      type="button"
                      onClick={() => setActiveSidebar('invite')}
                      className="px-3 py-1.5 rounded-full bg-slate-950/85 hover:bg-indigo-600/90 border border-indigo-500/40 text-[11px] font-bold text-indigo-300 hover:text-white flex items-center gap-1.5 transition shadow-lg"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Only you are in the room • Invite Teammates</span>
                    </button>
                  </div>
                )}

                {/* Bottom Nameplate */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/10">
                  <div className="truncate">
                    <span className="text-xs font-bold text-white">{userName} (You)</span>
                    <span className="text-[10px] text-amber-400 block">
                      {userRole === 'faculty' ? 'Professor / Host' : mode === 'huddle' ? 'Team Member (Joined)' : 'Student (Joined)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {micOn ? (
                      <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                        <Mic className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="p-1.5 rounded-lg bg-red-500/20 text-red-400">
                        <MicOff className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Render ONLY Participants Who Have Actually Joined This Room! */}
              {joinedOthers.map((peer, idx) => {
                const gradients = [
                  'from-indigo-900/50 via-slate-900 to-slate-950 border-indigo-500/40',
                  'from-emerald-900/40 via-slate-900 to-slate-950 border-emerald-500/40',
                  'from-purple-900/40 via-slate-900 to-slate-950 border-purple-500/40',
                ];
                const avatarColors = [
                  'from-indigo-600 to-blue-500',
                  'from-emerald-600 to-teal-500',
                  'from-purple-600 to-pink-500',
                ];

                return (
                  <div
                    key={peer.email || peer.name}
                    className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${
                      gradients[idx % gradients.length]
                    } border-2 min-h-[260px] flex flex-col items-center justify-center p-6 shadow-lg`}
                  >
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
                        ● Joined Live
                      </span>
                      {peer.handRaised && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black">
                          ✋ Hand Raised
                        </span>
                      )}
                    </div>

                    <div
                      className={`w-20 h-20 rounded-full bg-gradient-to-tr ${
                        avatarColors[idx % avatarColors.length]
                      } flex items-center justify-center text-2xl font-black text-white shadow-xl border-2 border-white/20`}
                    >
                      {peer.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>

                    <h4 className="text-sm font-bold text-white mt-3 text-center">{peer.name}</h4>
                    <p className="text-xs text-slate-400 text-center">{peer.role}</p>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/75 border border-white/10">
                      <span className="text-xs font-semibold text-slate-200 truncate">{peer.name}</span>
                      {peer.micOn ? (
                        <Mic className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : (
                        <MicOff className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Interactive Control Dock */}
            <div className="p-3 rounded-2xl bg-slate-900/95 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              {/* Left: Mic, Camera, Screen Share, Whiteboard */}
              <div className="flex items-center flex-wrap gap-2">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                    micOn
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {micOn ? <Mic className="w-4 h-4 text-emerald-400" /> : <MicOff className="w-4 h-4" />}
                  <span>{micOn ? 'Mute' : 'Unmute'}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleCam}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                    camOn
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {camOn ? <Video className="w-4 h-4 text-emerald-400" /> : <VideoOff className="w-4 h-4" />}
                  <span>{camOn ? 'Stop Video' : 'Start Video'}</span>
                </button>

                <button
                  type="button"
                  onClick={toggleScreenShare}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                    screenSharing
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  <MonitorUp className="w-4 h-4" />
                  <span>{screenSharing ? 'Stop Sharing' : 'Share Screen'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowWhiteboard(!showWhiteboard)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                    showWhiteboard
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  <PenTool className="w-4 h-4" />
                  <span>Whiteboard</span>
                </button>
              </div>

              {/* Center: Hand Raise & Emoji Reactions */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setHandRaised(!handRaised)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    handRaised
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <Hand className="w-4 h-4" />
                  <span className="hidden sm:inline">{handRaised ? 'Lower Hand' : 'Raise Hand'}</span>
                </button>

                {['👏', '🔥', '💡', '👍'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => triggerReaction(emoji)}
                    className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-sm transition hover:scale-110"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Right: Invite, Chat, Joined Participants & Leave */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSidebar(activeSidebar === 'invite' ? null : 'invite')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    activeSidebar === 'invite'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Invite</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSidebar(activeSidebar === 'chat' ? null : 'chat')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    activeSidebar === 'chat'
                      ? 'bg-red-700 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat ({messages.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSidebar(activeSidebar === 'participants' ? null : 'participants')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                    activeSidebar === 'participants'
                      ? 'bg-red-700 text-white'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Joined ({totalJoinedCount})</span>
                </button>

                {onLeave && (
                  <button
                    type="button"
                    onClick={() => {
                      stopAllStreams();
                      onLeave();
                    }}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
                  >
                    <PhoneOff className="w-4 h-4" />
                    <span>Leave</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Invite Teammates via Email / Live Chat / Joined Participants */}
          {activeSidebar && (
            <div className="lg:col-span-4 xl:col-span-4 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/95 flex flex-col justify-between p-4 max-h-[620px] overflow-y-auto">
              {activeSidebar === 'invite' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Invite via Email & Notification</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Only members who join appear in the video call. Send an instant email & bell alert to invite someone!
                      </p>
                    </div>
                  </div>

                  {/* Team Roster Quick Invite */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        {mode === 'huddle' ? `Your Team Roster (${peers.length})` : `Course Peers (${peers.length})`}
                      </span>
                      {peers.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            handleSendInvite(
                              peers.map((p) => ({
                                user_id: p.user_id,
                                name: p.name,
                                email: p.email || '',
                              })),
                              'all-team'
                            )
                          }
                          disabled={invitingKey === 'all-team'}
                          className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                        >
                          {invitingKey === 'all-team' ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <BellRing className="w-3 h-3" />
                          )}
                          <span>Invite All ({peers.length})</span>
                        </button>
                      )}
                    </div>

                    {peers.length === 0 ? (
                      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-center space-y-1">
                        <p className="text-xs font-semibold text-slate-300">
                          No other members added to this team yet.
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Use the form below to invite any classmate or faculty member by Email or Roll Number!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                        {peers.map((peer) => {
                          const key = (peer.email || peer.name).toLowerCase();
                          const isInvited = invitedEmails[key];
                          const alreadyInCall = isPeerJoined(peer);

                          return (
                            <div
                              key={key}
                              className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-white truncate">{peer.name}</p>
                                <p className="text-[10px] text-slate-400 truncate">
                                  {peer.role} {peer.email ? `• ${peer.email}` : ''}
                                </p>
                              </div>

                              {alreadyInCall ? (
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold shrink-0">
                                  ● In Call
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSendInvite(
                                      [
                                        {
                                          user_id: peer.user_id,
                                          name: peer.name,
                                          email: peer.email || '',
                                        },
                                      ],
                                      key
                                    )
                                  }
                                  disabled={invitingKey === key}
                                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 transition ${
                                    isInvited
                                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow'
                                  }`}
                                >
                                  {invitingKey === key ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : isInvited ? (
                                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Mail className="w-3 h-3" />
                                  )}
                                  <span>{isInvited ? 'Sent Again' : 'Send Invite'}</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Invite Anyone by Email or Roll Number */}
                  <form
                    onSubmit={handleCustomEmailInvite}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5"
                  >
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
                      Invite Any Student / Faculty by Email or Roll No
                    </label>
                    <input
                      type="text"
                      value={customInviteName}
                      onChange={(e) => setCustomInviteName(e.target.value)}
                      placeholder="Recipient Name (optional, e.g. Varshini)"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={customInviteEmail}
                        onChange={(e) => setCustomInviteEmail(e.target.value)}
                        placeholder="Email or Roll No (e.g. 2510030162@klh.edu.in)"
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        type="submit"
                        disabled={invitingKey?.startsWith('custom:') || !customInviteEmail.trim()}
                        className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition disabled:opacity-50 shrink-0"
                      >
                        {invitingKey?.startsWith('custom:') ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>Invite</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500">
                      Dispatches both an official Gmail invitation with the room link and an in-app bell notification.
                    </p>
                  </form>

                  {inviteError && (
                    <div className="p-2.5 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs">
                      {inviteError}
                    </div>
                  )}

                  {/* Shareable Direct Room Link */}
                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">
                        Direct Room ID
                      </span>
                      <span className="text-xs font-mono text-amber-400 truncate block">{roomName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyRoomLink}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold flex items-center gap-1 shrink-0"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied!' : 'Copy Link'}</span>
                    </button>
                  </div>
                </div>
              ) : activeSidebar === 'chat' ? (
                <>
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-red-400" />
                        <span>{mode === 'huddle' ? 'Team Huddle Chat' : 'Live Classroom Q&A'}</span>
                      </h4>
                      <span className="text-[10px] text-emerald-400 font-bold">● Live Synced</span>
                    </div>

                    <div className="space-y-3 overflow-y-auto max-h-[410px] pr-1">
                      {messages.length === 0 ? (
                        <div className="py-12 px-4 text-center space-y-2">
                          <MessageSquare className="w-7 h-7 text-slate-600 mx-auto" />
                          <p className="text-xs font-semibold text-slate-400">No messages in this session yet</p>
                          <p className="text-[11px] text-slate-500">
                            Messages sent here are shared live with everyone who joins this room.
                          </p>
                        </div>
                      ) : (
                        messages.map((m) => (
                          <div
                            key={m.id}
                            className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800/80 space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-amber-400">{m.sender}</span>
                              <span className="text-[9px] text-slate-500">{m.time}</span>
                            </div>
                            <p className="text-xs text-slate-200 leading-relaxed">{m.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <form onSubmit={handleSendMessage} className="mt-3 pt-3 border-t border-slate-800 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a message to the room..."
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="submit"
                      className="p-2 rounded-xl bg-red-700 hover:bg-red-600 text-white transition"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Joined Participants ({totalJoinedCount})</span>
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {/* Always show current user who has joined */}
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-emerald-500/30 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-white">{userName} (You)</p>
                        <p className="text-[10px] text-emerald-400">Joined • Camera & Audio Active</p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>

                    {/* Show ONLY other users who have actually joined */}
                    {joinedOthers.length === 0 ? (
                      <div className="p-4 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center space-y-2">
                        <p className="text-xs text-slate-400">
                          No other participants have joined the room yet.
                        </p>
                        <button
                          type="button"
                          onClick={() => setActiveSidebar('invite')}
                          className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold inline-flex items-center gap-1.5 transition"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Invite Teammates via Email</span>
                        </button>
                      </div>
                    ) : (
                      joinedOthers.map((peer) => (
                        <div
                          key={peer.email || peer.name}
                          className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-xs font-semibold text-slate-200">{peer.name}</p>
                            <p className="text-[10px] text-emerald-400">{peer.role} • Joined Live</p>
                          </div>
                          {peer.micOn ? (
                            <Mic className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <MicOff className="w-3.5 h-3.5 text-red-400" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
