import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  CheckCircle,
  Video,
  FileText,
  Star,
  X,
  Sparkles,
  Compass,
  Download,
  Image as ImageIcon,
  Maximize2,
  Minimize2,
  FileCheck,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Eye,
  FileSpreadsheet,
  AlertCircle,
  Check,
} from 'lucide-react';
import { MateriPembelajaran } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../lib/supabase';

interface MaterialViewerProps {
  isOpen: boolean;
  onClose: () => void;
  materi: MateriPembelajaran;
  onCompleted: () => void;
}

export const MaterialViewer: React.FC<MaterialViewerProps> = ({
  isOpen,
  onClose,
  materi,
  onCompleted,
}) => {
  const { user } = useAuth();
  const [isCompleted, setIsCompleted] = useState(materi.selesai_oleh_siswa || false);
  const [isImageLightboxOpen, setIsImageLightboxOpen] = useState(false);
  const [isDocReaderOpen, setIsDocReaderOpen] = useState(false);
  const [isDocFullscreen, setIsDocFullscreen] = useState(false);
  const [docTab, setDocTab] = useState<'dokumen' | 'panduan'>('dokumen');
  const [docBlobUrl, setDocBlobUrl] = useState<string>('');
  const [imgZoom, setImgZoom] = useState(100);
  const [textSize, setTextSize] = useState<'normal' | 'large' | 'huge'>('large');

  // Convert data URL to Blob URL for clean, fast, and sandboxed-safe PDF/document rendering
  useEffect(() => {
    if (!materi.file_url) {
      setDocBlobUrl('');
      return;
    }

    if (materi.file_url.startsWith('data:')) {
      try {
        const parts = materi.file_url.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';

        let byteArray: Uint8Array;
        if (parts[0].includes(';base64')) {
          const b64 = parts[1] || '';
          const binaryString = atob(b64);
          byteArray = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            byteArray[i] = binaryString.charCodeAt(i);
          }
        } else {
          const decoded = decodeURIComponent(parts[1] || '');
          byteArray = new TextEncoder().encode(decoded);
        }

        const blob = new Blob([byteArray.buffer as ArrayBuffer], { type: mime });
        const objectUrl = URL.createObjectURL(blob);
        setDocBlobUrl(objectUrl);

        return () => {
          URL.revokeObjectURL(objectUrl);
        };
      } catch (err) {
        console.warn('Gagal membuat Blob URL dokumen, menggunakan URL asli:', err);
        setDocBlobUrl(materi.file_url);
      }
    } else {
      setDocBlobUrl(materi.file_url);
    }
  }, [materi.file_url]);

  // Decode text content for plain text or simulated LKPD files
  const decodedTextContent = useMemo(() => {
    if (!materi.file_url) return '';
    try {
      if (materi.file_url.startsWith('data:text/plain;charset=utf-8,')) {
        return decodeURIComponent(materi.file_url.replace('data:text/plain;charset=utf-8,', ''));
      }
      if (materi.file_url.startsWith('data:text/') && materi.file_url.includes(';base64,')) {
        return atob(materi.file_url.split(';base64,')[1]);
      }
      if (materi.file_url.startsWith('data:text/')) {
        return decodeURIComponent(materi.file_url.split(',')[1] || '');
      }
    } catch {
      // fallback
    }
    return '';
  }, [materi.file_url]);

  if (!isOpen || !user) return null;

  const fileExt = (materi.file_nama || '').split('.').pop()?.toLowerCase() || '';
  const isPdf =
    materi.file_url?.startsWith('data:application/pdf') ||
    fileExt === 'pdf' ||
    materi.file_url?.toLowerCase().endsWith('.pdf');
  const isImageDoc =
    materi.file_url?.startsWith('data:image/') ||
    ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(fileExt);
  const isTextDoc =
    materi.file_url?.startsWith('data:text/') ||
    ['txt', 'md', 'csv'].includes(fileExt) ||
    Boolean(decodedTextContent);
  const isOfficeDoc = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(fileExt);

  const handleMarkComplete = () => {
    if (isCompleted) return;

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.7 },
    });

    setIsCompleted(true);

    // Save completed progress
    const allMateri = localDB.getMateri();
    const updated = allMateri.map((m) => {
      if (m.id === materi.id) {
        return { ...m, selesai_oleh_siswa: true };
      }
      return m;
    });
    localDB.saveMateri(updated);

    // Give 2 stars for completing a lesson!
    const allProfiles = localDB.getProfiles();
    const updatedProfiles = allProfiles.map((p) => {
      if (p.id === user.id) {
        return {
          ...p,
          total_bintang: (p.total_bintang || 0) + 2,
        };
      }
      return p;
    });
    localDB.saveProfiles(updatedProfiles);

    // Add notification
    const allNotifs = localDB.getNotifikasi();
    allNotifs.unshift({
      id: `notif-${Date.now()}`,
      user_id: user.id,
      judul: 'Hebat! Materi Selesai Dipelajari ⭐⭐',
      pesan: `Kamu telah menyelesaikan materi "${materi.judul}" dan mendapatkan 2 Bintang belajar!`,
      tipe: 'materi_baru',
      dibaca: false,
      created_at: new Date().toISOString(),
    });
    localDB.saveNotifikasi(allNotifs);

    onCompleted();
  };

  const isLowerGrade = (user.tingkat_kelas || 1) <= 3;

  // Handle document download
  const handleDownloadDoc = () => {
    if (!materi.file_url) return;
    const link = document.createElement('a');
    link.href = docBlobUrl || materi.file_url;
    link.download = materi.file_nama || `Dokumen_${materi.judul.replace(/\s+/g, '_')}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Open document in a new tab for reading or printing
  const handleOpenDocInNewTab = () => {
    const targetUrl = docBlobUrl || materi.file_url;
    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Handle image download
  const handleDownloadImage = () => {
    if (!materi.gambar_url) return;
    const link = document.createElement('a');
    link.href = materi.gambar_url;
    link.download = `Ilustrasi_${materi.judul.replace(/\s+/g, '_')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white flex items-center justify-between">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                {materi.mapel_nama || 'Mata Pelajaran'}
              </span>
              <span className="text-xs font-semibold text-emerald-100">
                Topik: {materi.topik}
              </span>
            </div>
            <h3 className="font-extrabold text-base sm:text-xl truncate mt-1">{materi.judul}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* CP & TP Kurikulum Merdeka Card */}
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-xs uppercase tracking-wider">
              <Compass className="w-4 h-4 text-emerald-600" />
              Tujuan Pembelajaran (Kurikulum Merdeka)
            </div>
            <div className="space-y-2 text-xs sm:text-sm text-slate-700">
              <p>
                <strong className="text-emerald-900">Capaian (CP):</strong> {materi.capaian_pembelajaran}
              </p>
              <p>
                <strong className="text-emerald-900">Tujuan (TP):</strong> {materi.tujuan_pembelajaran}
              </p>
            </div>
          </div>

          {/* ============================================================== */}
          {/* 1. GAMBAR & INFOGRAFIS DISPLAY */}
          {/* ============================================================== */}
          {materi.gambar_url && (
            <div className="rounded-3xl overflow-hidden border border-slate-200 bg-slate-50 shadow-xs">
              <div className="relative group overflow-hidden bg-slate-900 max-h-80 flex items-center justify-center">
                <img
                  src={materi.gambar_url}
                  alt={materi.judul}
                  className="w-full h-auto max-h-80 object-contain mx-auto"
                />
                {/* Overlay actions */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={() => setIsImageLightboxOpen(true)}
                    className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-xs shadow-md cursor-pointer"
                    title="Perbesar gambar"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDownloadImage}
                    className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white transition backdrop-blur-xs shadow-md cursor-pointer"
                    title="Unduh gambar"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {materi.gambar_caption && (
                <div className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2 text-xs text-slate-600">
                  <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-medium italic">{materi.gambar_caption}</span>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* 2. DOKUMEN / LKPD DISPLAY & DIRECT READER */}
          {/* ============================================================== */}
          {materi.file_url && (
            <div className="rounded-3xl border border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/50 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/25">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-200/70 px-2.5 py-0.5 rounded-full mb-1">
                    <FileCheck className="w-3.5 h-3.5 text-amber-700" />
                    <span>Dokumen / LKPD Siap Dibaca Langsung</span>
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm sm:text-base leading-tight truncate">
                    {materi.file_nama || 'Lembar_Kerja_Peserta_Didik.pdf'}
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Ukuran: {materi.file_ukuran || '250 KB'} • Klik tombol untuk membaca langsung di layar
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setDocTab('dokumen');
                    setIsDocReaderOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs sm:text-sm transition flex items-center gap-2 shadow-md shadow-amber-500/25 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Baca Dokumen Langsung</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadDoc}
                  className="px-3.5 py-2.5 rounded-2xl bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="Unduh file ke perangkat"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh File</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 3. VIDEO PEMBELAJARAN */}
          {/* ============================================================== */}
          {(materi.tipe_konten === 'video' || materi.video_url) && (
            <div className="rounded-3xl overflow-hidden border border-slate-200 bg-slate-900 p-2 sm:p-4 text-center text-white">
              <div className="aspect-video bg-slate-800 rounded-2xl flex flex-col items-center justify-center p-4">
                <Video className="w-12 h-12 text-blue-400 mb-2 animate-pulse" />
                <h4 className="font-bold text-sm text-slate-200">Video Pembelajaran Interaktif</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Materi video interaktif untuk menemani belajar anak SD
                </p>
                {materi.video_url && (
                  <a
                    href={materi.video_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-1.5 transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Tonton Video di Tab Baru</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* 4. PENJELASAN TEKS / CERITA MATERI */}
          {/* ============================================================== */}
          <div className="bg-slate-50 rounded-3xl p-5 sm:p-6 border border-slate-200/80">
            <h4 className="font-extrabold text-slate-800 text-base mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" />
              Penjelasan Materi Pembelajaran
            </h4>
            <p
              className={`text-slate-700 leading-relaxed whitespace-pre-line ${
                isLowerGrade ? 'text-base sm:text-lg' : 'text-sm sm:text-base'
              }`}
            >
              {materi.deskripsi}
            </p>
          </div>

          {/* Teacher guidance info */}
          <div className="text-xs text-slate-500 italic">
            Diajarkan oleh: <span className="font-bold text-slate-700">{materi.guru_nama || 'Bapak/Ibu Guru'}</span>
          </div>
        </div>

        {/* Footer with Complete Button */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Selesaikan materi untuk mendapatkan 2 Bintang!</span>
          </div>

          <button
            onClick={handleMarkComplete}
            disabled={isCompleted}
            className={`px-6 py-3 rounded-2xl font-extrabold text-xs sm:text-sm transition flex items-center gap-2 shadow-md cursor-pointer ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-default shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{isCompleted ? 'Sudah Selesai Dipelajari ✓' : 'Tandai Selesai Belajar'}</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* IMAGE LIGHTBOX MODAL */}
      {/* ==================================================================== */}
      {isImageLightboxOpen && materi.gambar_url && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="max-w-4xl w-full flex items-center justify-between text-white mb-3">
            <p className="text-sm font-bold truncate">{materi.gambar_caption || materi.judul}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadImage}
                className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh</span>
              </button>
              <button
                onClick={() => setIsImageLightboxOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 transition cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          <img
            src={materi.gambar_url}
            alt={materi.judul}
            className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}

      {/* ==================================================================== */}
      {/* DOCUMENT / LKPD DIRECT IN-APP READER MODAL */}
      {/* ==================================================================== */}
      {isDocReaderOpen && (
        <div className="fixed inset-0 z-60 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
          <div
            className={`bg-white rounded-3xl flex flex-col shadow-2xl overflow-hidden border border-slate-200 transition-all duration-200 ${
              isDocFullscreen
                ? 'fixed inset-2 sm:inset-4 z-70 w-auto h-auto max-w-none max-h-none'
                : 'max-w-5xl w-full h-[88vh] max-h-[92vh]'
            }`}
          >
            {/* Top Bar Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 shadow-md">
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold text-amber-100 uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                    Pembaca Lembar Kerja Peserta Didik (LKPD)
                  </span>
                  <span className="text-[10px] text-amber-100/90 font-medium hidden sm:inline">
                    {materi.file_ukuran || 'Dokumen Asli'}
                  </span>
                </div>
                <h4 className="font-extrabold text-sm sm:text-base truncate mt-1">
                  {materi.file_nama || 'Materi_Pembelajaran.pdf'}
                </h4>
              </div>

              {/* Reader Action Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 self-end sm:self-auto">
                {/* Open in New Tab Button */}
                <button
                  type="button"
                  onClick={handleOpenDocInNewTab}
                  className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer backdrop-blur-xs"
                  title="Buka dokumen di tab baru untuk membaca atau mencetak"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Buka Tab Baru</span>
                </button>

                {/* Fullscreen Toggle */}
                <button
                  type="button"
                  onClick={() => setIsDocFullscreen(!isDocFullscreen)}
                  className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer backdrop-blur-xs"
                  title={isDocFullscreen ? 'Perkecil tampilan' : 'Layar penuh'}
                >
                  {isDocFullscreen ? (
                    <>
                      <Minimize2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Kecilkan</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Layar Penuh</span>
                    </>
                  )}
                </button>

                {/* Direct Download */}
                <button
                  type="button"
                  onClick={handleDownloadDoc}
                  className="p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-white text-amber-900 hover:bg-amber-50 font-extrabold text-xs transition flex items-center gap-1 cursor-pointer shadow-xs"
                  title="Unduh dokumen asli ke HP / Komputer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-700" />
                  <span className="hidden sm:inline">Unduh</span>
                </button>

                {/* Close Reader */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDocReaderOpen(false);
                    setIsDocFullscreen(false);
                  }}
                  className="p-1.5 hover:bg-white/20 rounded-full text-white/90 hover:text-white transition cursor-pointer"
                  title="Tutup pembaca dokumen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-Header: Mode Switcher Tabs */}
            <div className="bg-amber-50/80 border-b border-amber-200/80 px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDocTab('dokumen')}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                    docTab === 'dokumen'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-amber-100/70 border border-amber-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Dokumen Asli ({fileExt ? `.${fileExt}` : 'File'})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDocTab('panduan')}
                  className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                    docTab === 'panduan'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-amber-100/70 border border-amber-200'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Petunjuk & Ringkasan Guru</span>
                </button>
              </div>

              {/* Extra controls for text / image documents */}
              {docTab === 'dokumen' && isImageDoc && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-600 mr-1">Zoom:</span>
                  <button
                    type="button"
                    onClick={() => setImgZoom((z) => Math.max(50, z - 25))}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
                    title="Perkecil"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-xs font-mono font-bold text-slate-700 w-10 text-center">
                    {imgZoom}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setImgZoom((z) => Math.min(250, z + 25))}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700"
                    title="Perbesar"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setImgZoom(100)}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 ml-1"
                    title="Reset Ukuran"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {docTab === 'dokumen' && isTextDoc && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-600 mr-1">Ukuran Huruf:</span>
                  {(['normal', 'large', 'huge'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setTextSize(sz)}
                      className={`px-2 py-0.5 rounded-lg text-xs font-bold transition ${
                        textSize === sz
                          ? 'bg-amber-600 text-white'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {sz === 'normal' ? 'A' : sz === 'large' ? 'A+' : 'A++'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Main Reading Canvas */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-100/70 flex flex-col">
              {docTab === 'dokumen' ? (
                /* TAB 1: DIRECT DOCUMENT DISPLAY (PDF / Image / Text / Word) */
                <div className="flex-1 flex flex-col w-full h-full min-h-[460px]">
                  {/* CASE A: PDF DOCUMENT */}
                  {isPdf && (
                    <div className="flex-1 flex flex-col w-full h-full min-h-[500px] bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-inner relative">
                      <object
                        data={docBlobUrl || materi.file_url}
                        type="application/pdf"
                        className="w-full flex-1 min-h-[500px] h-full border-0 rounded-2xl"
                      >
                        <iframe
                          src={`${docBlobUrl || materi.file_url}#toolbar=1&navpanes=1`}
                          className="w-full flex-1 min-h-[500px] h-full border-0 rounded-2xl bg-white"
                          title={materi.file_nama || 'Dokumen Materi Belajar PDF'}
                        >
                          {/* Fallback card if browser plugin blocks iframe */}
                          <div className="p-8 text-center bg-white rounded-2xl h-full flex flex-col items-center justify-center space-y-4">
                            <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-md">
                              <FileText className="w-8 h-8" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-slate-800 text-base">
                                Dokumen PDF: {materi.file_nama || 'Materi Belajar Siswa'}
                              </h4>
                              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                                Dokumen PDF siap dibaca. Jika browser tidak menampilkan halaman di dalam kotak, kamu dapat membukanya langsung di tab baru atau mengunduhnya.
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center justify-center gap-3">
                              <button
                                onClick={handleOpenDocInNewTab}
                                className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20"
                              >
                                <ExternalLink className="w-4 h-4" />
                                <span>Buka PDF di Tab Baru</span>
                              </button>
                              <button
                                onClick={handleDownloadDoc}
                                className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2"
                              >
                                <Download className="w-4 h-4" />
                                <span>Unduh Berkas Asli</span>
                              </button>
                            </div>
                          </div>
                        </iframe>
                      </object>
                    </div>
                  )}

                  {/* CASE B: IMAGE DOCUMENT (Scanned Worksheet, Textbook page, etc.) */}
                  {isImageDoc && (
                    <div className="flex-1 flex flex-col items-center justify-center bg-slate-900 rounded-2xl p-4 overflow-auto min-h-[480px]">
                      <img
                        src={docBlobUrl || materi.file_url}
                        alt={materi.file_nama || 'Dokumen Gambar LKPD'}
                        style={{
                          transform: `scale(${imgZoom / 100})`,
                          transformOrigin: 'center center',
                        }}
                        className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-2xl transition-transform duration-150"
                      />
                    </div>
                  )}

                  {/* CASE C: TEXT / DECODED LKPD */}
                  {isTextDoc && (
                    <div className="flex-1 bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm overflow-y-auto">
                      <div className="max-w-3xl mx-auto space-y-4">
                        <div className="border-b pb-4 border-slate-200 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                              Isi Teks Lembar Kerja Peserta Didik
                            </span>
                            <h3 className="font-extrabold text-base sm:text-xl text-slate-800 mt-1">
                              {materi.file_nama || materi.judul}
                            </h3>
                          </div>
                        </div>

                        <div
                          className={`text-slate-800 leading-relaxed whitespace-pre-wrap ${
                            textSize === 'huge'
                              ? 'text-lg sm:text-xl'
                              : textSize === 'large'
                              ? 'text-base sm:text-lg'
                              : 'text-sm sm:text-base'
                          }`}
                        >
                          {decodedTextContent || materi.deskripsi}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CASE D: WORD / PPT / SPREADSHEET (.docx, .pptx, etc.) */}
                  {isOfficeDoc && (
                    <div className="flex-1 bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center space-y-4 min-h-[420px]">
                      <div className="w-16 h-16 rounded-3xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-md">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div className="max-w-md">
                        <h4 className="font-extrabold text-slate-800 text-base sm:text-lg">
                          {materi.file_nama || 'Dokumen_Pembelajaran.docx'}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                          Berkas ini berupa dokumen Microsoft Word / Dokumen Pembelajaran. Siswa dapat mengunduh dokumen asli untuk dibaca di laptop/HP atau membaca rangkuman LKPD di tab sebelah.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={handleDownloadDoc}
                          className="px-5 py-2.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-amber-500/20 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>Unduh & Buka Dokumen Asli</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDocTab('panduan')}
                          className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 cursor-pointer"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Lihat Panduan & Ringkasan Materi</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* TAB 2: PANDUAN AKTIVITAS & RINGKASAN GURU */
                <div className="flex-1 overflow-y-auto space-y-4">
                  <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-slate-200 space-y-5 font-sans">
                    <div className="text-center border-b pb-4 border-slate-200">
                      <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full mb-2">
                        <Compass className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Panduan Kurikulum Merdeka</span>
                      </div>
                      <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 uppercase">
                        LEMBAR KERJA PESERTA DIDIK (LKPD)
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {materi.rombel_nama || 'Kelas SD'} • {materi.mapel_nama}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs sm:text-sm">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Materi</span>
                        <strong className="text-slate-800">{materi.judul}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Topik Bahasan</span>
                        <strong className="text-blue-700">{materi.topik}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Guru Pengajar</span>
                        <strong className="text-slate-800">{materi.guru_nama || 'Bapak/Ibu Guru'}</strong>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs sm:text-sm text-slate-700">
                      <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
                        <p>
                          <strong className="text-emerald-900">Capaian Pembelajaran (CP):</strong>{' '}
                          {materi.capaian_pembelajaran}
                        </p>
                        <p>
                          <strong className="text-emerald-900">Tujuan Pembelajaran (TP):</strong>{' '}
                          {materi.tujuan_pembelajaran}
                        </p>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <h5 className="font-extrabold text-slate-900 mb-1.5">Uraian Materi:</h5>
                        <p className="leading-relaxed whitespace-pre-line text-slate-600">
                          {materi.deskripsi}
                        </p>
                      </div>
                    </div>

                    <div className="border-t pt-4 border-slate-100 space-y-2 text-xs sm:text-sm text-slate-700">
                      <h5 className="font-extrabold text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Petunjuk Aktivitas Belajar Siswa:</span>
                      </h5>
                      <ol className="list-decimal pl-5 space-y-2 leading-relaxed text-slate-600">
                        <li>Bacalah dokumen materi atau LKPD pada tab <strong>"Dokumen Asli"</strong> di atas.</li>
                        <li>Amati gambar, tabel, atau bagan yang telah disiapkan oleh bapak/ibu guru.</li>
                        <li>Diskusikan bersama teman sekelas atau orang tua jika ada hal yang belum dipahami.</li>
                        <li>Catat poin-poin penting pada buku catatanmu dan kerjakan kuis/tugas latihan setelahnya!</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Footer Actions */}
            <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Dokumen resmi pembelajaran BelajarYuk SD</span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline font-mono text-[11px] text-slate-400">
                  {materi.file_nama}
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleDownloadDoc}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh Dokumen Asli</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDocReaderOpen(false);
                    setIsDocFullscreen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  Tutup Pembaca
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

