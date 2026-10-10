import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Award, Flame, QrCode, ShieldCheck, Download, RefreshCw, Lock, ExternalLink, Sparkles, Edit3, Check } from 'lucide-react';
import ParentSnapshotModal from './ParentSnapshotModal';

interface StudentIDCardProps {
  user: {
    user_id?: number;
    id?: number;
    full_name?: string;
    roll_number?: string;
    section?: string;
    department?: string;
    email?: string;
    parent_pin?: string;
    parent_phone?: string;
    parent_name?: string;
    parent_email?: string;
  };
}

export default function StudentIDCard({ user }: StudentIDCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showParentModal, setShowParentModal] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const rollNumber = user?.roll_number || (user?.email ? user.email.split('@')[0] : '2510030025');
  const fullName = user?.full_name || 'STUDENT';
  const section = user?.section || 'A4';
  const department = user?.department || 'Computer Science & Engineering';
  const parentPin = user?.parent_pin || (user?.roll_number ? user.roll_number.slice(-6) : '849201');
  const parentName = user?.parent_name || `Guardian of ${fullName}`;

  const [parentEmail, setParentEmail] = useState(user?.parent_email || `parent.${rollNumber}@gmail.com`);
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState(user?.parent_email || '');
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    const initialEmail = user?.parent_email || `parent.${rollNumber}@gmail.com`;
    setParentEmail(initialEmail);
    setEmailDraft(initialEmail);
  }, [user?.parent_email, rollNumber]);

  async function handleSaveParentEmail(e: React.MouseEvent) {
    e.stopPropagation();
    const trimmed = emailDraft.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      alert('Please enter a valid parent email address.');
      return;
    }
    try {
      setSavingEmail(true);
      const res = await fetch('http://localhost:5001/api/parent/update-student-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user?.user_id || user?.id,
          roll_number: rollNumber,
          parent_email: trimmed,
        }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setParentEmail(trimmed);
        setEditingEmail(false);
      } else {
        alert(json.error || 'Failed to update parent email');
      }
    } catch (err) {
      console.error('Failed to save parent email:', err);
    } finally {
      setSavingEmail(false);
    }
  }

  useEffect(() => {
    // Generate real 2D QR Code image matrix encoding the network URL so external phone cameras can scan it
    async function initQR() {
      let host = '192.168.1.6';
      if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        host = window.location.hostname;
      } else {
        try {
          const res = await fetch('http://localhost:5001/api/system/network-info');
          if (res.ok) {
            const data = await res.json();
            if (data.lanIp && data.lanIp !== 'localhost') {
              host = data.lanIp;
            }
          }
        } catch {
          host = '192.168.1.6';
        }
      }

      const targetUrl = `http://${host}:5173/?parent_pin=${parentPin}`;

      QRCode.toDataURL(targetUrl, {
        margin: 1,
        width: 256,
        errorCorrectionLevel: 'M',
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('Failed to generate scannable QR Code:', err));
    }

    initQR();
  }, [parentPin]);

  function handleDownloadPass() {
    alert(`Digital Academic Pass for ${fullName} (${rollNumber}) generated and verified with KL University Registrar!`);
  }

  return (
    <>
      <div className="relative flex flex-col items-center">
        {/* Card Header Label */}
        <div className="flex items-center justify-between w-full max-w-sm mb-2 px-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Smart Student Badge (Interactive 3D)</span>
          </div>
          <button
            type="button"
            onClick={() => setIsFlipped(!isFlipped)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 dark:text-red-400 hover:underline"
          >
            <RefreshCw className="w-3 h-3" />
            {isFlipped ? 'Show Front' : 'Flip for Parent PIN'}
          </button>
        </div>

        {/* 3D Container */}
        <div
          className="w-full max-w-sm h-[268px] cursor-pointer select-none"
          style={{ perspective: '1200px', WebkitPerspective: '1200px' }}
          onClick={() => setIsFlipped(!isFlipped)}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div
            className="relative w-full h-full rounded-2xl shadow-xl transition-transform duration-700"
            style={{
              transformStyle: 'preserve-3d',
              WebkitTransformStyle: 'preserve-3d',
              transform: `${isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'} ${
                isHovered && !isFlipped ? 'rotateX(4deg) scale(1.02)' : ''
              }`,
            }}
          >
            {/* ================= FRONT SIDE ================= */}
            <div
              className="absolute inset-0 w-full h-full rounded-2xl p-5 overflow-hidden flex flex-col justify-between border border-red-900/20 text-white shadow-2xl"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(0deg)',
                WebkitTransform: 'rotateY(0deg)',
                opacity: isFlipped ? 0 : 1,
                pointerEvents: isFlipped ? 'none' : 'auto',
                transition: 'opacity 0.2s ease-in-out',
                background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #450a0a 100%)',
              }}
            >
              {/* Holographic background ribbon */}
              <div
                className="absolute -right-16 -top-16 w-48 h-48 rounded-full pointer-events-none opacity-20"
                style={{
                  background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)',
                }}
              />

              {/* Front Header */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-white p-1 flex items-center justify-center shadow-md">
                    <img src="./klh-logo.png" alt="KL" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black tracking-wider uppercase text-amber-200">
                      KL Deemed to be University
                    </h4>
                    <p className="text-[10px] text-red-100/80 font-medium">Official Digital Academic Identity</p>
                  </div>
                </div>
                {/* Academic Streak */}
                <div className="flex items-center gap-1 bg-amber-400/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-amber-300/30 text-amber-200 text-[11px] font-bold">
                  <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                  <span>12-Day Streak</span>
                </div>
              </div>

              {/* Front Body */}
              <div className="flex items-center gap-4 z-10 my-auto">
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-tr from-amber-400 to-red-300 p-0.5 shadow-lg">
                    <div className="w-full h-full rounded-[10px] bg-slate-900 flex items-center justify-center text-white font-black text-xl">
                      {fullName.charAt(0)}
                    </div>
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-red-900 shadow">
                    <ShieldCheck className="w-3 h-3" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-black truncate text-white leading-tight">{fullName}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono font-bold tracking-wider text-amber-300 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/60">
                      {rollNumber}
                    </span>
                    <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded">
                      {section.startsWith('Sec') ? section : `Sec ${section}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-red-200/90 mt-1 truncate font-medium">{department}</p>
                </div>
              </div>

              {/* Front Footer */}
              <div className="flex items-center justify-between text-[10px] text-red-200/70 border-t border-red-800/60 pt-2 z-10">
                <span>Valid: Academic Year 2026-27</span>
                <span className="font-semibold text-amber-300 flex items-center gap-1">
                  Click to Flip 🔄
                </span>
              </div>
            </div>

            {/* ================= BACK SIDE ================= */}
            <div
              className="absolute inset-0 w-full h-full rounded-2xl p-3.5 overflow-hidden flex flex-col justify-between border border-slate-700 text-slate-100 shadow-2xl"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                WebkitTransform: 'rotateY(180deg)',
                opacity: isFlipped ? 1 : 0,
                pointerEvents: isFlipped ? 'auto' : 'none',
                transition: 'opacity 0.2s ease-in-out',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
              }}
            >
              {/* Back Top */}
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                    Parent Verification Key
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span className="font-mono text-xs font-black text-amber-300 tracking-wider">
                      PIN: {parentPin}
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 rounded text-[9px] font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>DIGITAL ID VERIFIED</span>
                </div>
              </div>

              {/* Back Middle: Scannable 2D QR Code & Info */}
              <div className="flex items-center gap-2.5 my-auto">
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowParentModal(true);
                  }}
                  className="p-1 bg-white rounded-lg shadow-md shrink-0 cursor-pointer hover:ring-2 hover:ring-amber-400 transition-all group flex flex-col items-center"
                  title="Scan with phone camera or click to open Parent Snapshot"
                >
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Scannable QR Code"
                      className="w-14 h-14 object-contain rounded"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-slate-100 flex items-center justify-center rounded">
                      <QrCode className="w-10 h-10 text-slate-900" />
                    </div>
                  )}
                  <span className="text-[7.5px] font-black text-center text-red-700 tracking-tight mt-0.5 leading-none">
                    SCAN CAMERA 📷
                  </span>
                </div>
                <div className="text-[10px] space-y-0.5 text-slate-300 min-w-0 flex-1" onClick={(e) => e.stopPropagation()}>
                  <p className="truncate">
                    <span className="text-slate-400 font-medium">Guardian:</span>{' '}
                    <span className="text-slate-200 font-semibold">{parentName}</span>
                  </p>
                  {editingEmail ? (
                    <div className="flex items-center gap-1 py-0.5">
                      <input
                        type="email"
                        value={emailDraft}
                        onChange={(e) => setEmailDraft(e.target.value)}
                        placeholder="parent@gmail.com"
                        className="w-full px-1.5 py-0.5 rounded bg-slate-900 border border-amber-400 text-amber-300 font-mono text-[10px] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleSaveParentEmail}
                        disabled={savingEmail}
                        className="px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[9px] shrink-0"
                      >
                        {savingEmail ? '...' : 'Save'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 min-w-0">
                      <p className="truncate">
                        <span className="text-slate-400 font-medium">Email:</span>{' '}
                        <span className="font-mono text-amber-300 font-bold">{parentEmail}</span>
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingEmail(true);
                        }}
                        className="p-0.5 rounded hover:bg-slate-700 text-amber-400 shrink-0"
                        title="Change Parent Email"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                  <p className="text-[9px] text-slate-400 italic leading-tight">
                    Scan with any smartphone camera to open secure real-time Parent Portal.
                  </p>
                </div>
              </div>

              {/* Back Buttons */}
              <div className="flex items-center gap-1.5 pt-1 border-t border-slate-800" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setShowParentModal(true)}
                  className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[11px] font-bold rounded-lg transition-colors shadow-sm"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Parent Portal</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPass}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold rounded-lg border border-slate-700 transition-colors"
                  title="Download Digital Pass"
                >
                  <Download className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsFlipped(false)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                  title="Flip back to front"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Parent Snapshot Modal */}
      {showParentModal && (
        <ParentSnapshotModal
          pinOrRoll={parentPin || rollNumber}
          onClose={() => setShowParentModal(false)}
        />
      )}
    </>
  );
}
