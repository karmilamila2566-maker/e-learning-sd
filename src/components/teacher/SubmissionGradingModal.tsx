import React, { useState, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  Star,
  Check,
  X,
  Award,
  MessageSquare,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Download,
  ExternalLink,
  Maximize2,
  HelpCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Pengumpulan, Tugas, SoalTugas } from '../../types';
import { localDB } from '../../lib/supabase';
import { getBintangFromNilai, getDeskripsiNilai } from '../../lib/kurikulum';

interface SubmissionGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  pengumpulan: Pengumpulan;
  onGraded: () => void;
}

/**
 * Normalizes and accurately evaluates a student's answer against the answer key.
 * Handles option letters (A, B, C, D), case-insensitivity, and substring matching.
 */
export function evaluateAnswer(
  studentAns: string | undefined,
  correctAns: string | undefined,
  _tipe?: string
): boolean {
  if (!studentAns || !correctAns) return false;
  const sAns = studentAns.trim();
  const cAns = correctAns.trim();

  // 1. Exact match (case insensitive)
  if (sAns.toLowerCase() === cAns.toLowerCase()) return true;

  // 2. Letter option match for multiple choice (e.g. "C. Jupiter" vs "C" or "C. Jupiter")
  const sLetter = sAns.match(/^([A-D])(\.|\s|$)/i)?.[1]?.toUpperCase();
  const cLetter = cAns.match(/^([A-D])(\.|\s|$)/i)?.[1]?.toUpperCase();
  if (sLetter && cLetter && sLetter === cLetter) {
    return true;
  }

  // 3. Substring / Clean comparison without prefix
  const cleanStudent = sAns.toLowerCase().replace(/^[a-d][.\s-]*/i, '').trim();
  const cleanCorrect = cAns.toLowerCase().replace(/^[a-d][.\s-]*/i, '').trim();
  if (
    cleanStudent &&
    cleanCorrect &&
    (cleanStudent === cleanCorrect ||
      cleanCorrect.includes(cleanStudent) ||
      cleanStudent.includes(cleanCorrect))
  ) {
    return true;
  }

  // 4. Normalized alphanumeric comparison
  const normStudent = sAns.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normCorrect = cAns.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normStudent.length > 0 && normStudent === normCorrect) {
    return true;
  }

  return false;
}

export interface EvaluatedQuestion extends SoalTugas {
  studentAns: string;
  isCorrect: boolean;
  earnedScore: number;
}

/**
 * Computes automatic score, correct count, and wrong count based on answer key.
 */
export function computeAutoGrade(pengumpulan: Pengumpulan, relatedTask?: Tugas) {
  const soalList = relatedTask?.soal_list || [];
  const answers = pengumpulan.jawaban_teks || {};

  if (soalList.length > 0) {
    let totalWeight = 0;
    let earnedWeight = 0;
    let correctCount = 0;
    let wrongCount = 0;

    const evaluatedQuestions: EvaluatedQuestion[] = soalList.map((soal) => {
      const studentAns = answers[soal.id] || '';
      const isCorrect = evaluateAnswer(studentAns, soal.kunci_jawaban, soal.tipe);
      const weight = soal.skor_bobot || Math.round(100 / Math.max(1, soalList.length));
      totalWeight += weight;

      if (isCorrect) {
        earnedWeight += weight;
        correctCount += 1;
      } else {
        wrongCount += 1;
      }

      return {
        ...soal,
        studentAns,
        isCorrect,
        earnedScore: isCorrect ? weight : 0,
      };
    });

    const calculatedScore =
      totalWeight > 0 ? Math.min(100, Math.round((earnedWeight / totalWeight) * 100)) : 100;

    return {
      totalQuestions: soalList.length,
      correctCount,
      wrongCount,
      calculatedScore,
      evaluatedQuestions,
      hasQuestions: true,
    };
  }

  // Fallback if jawaban_teks has entries without soalList definition
  const entries = Object.entries(answers);
  if (entries.length > 0) {
    return {
      totalQuestions: entries.length,
      correctCount: entries.length,
      wrongCount: 0,
      calculatedScore: 100,
      evaluatedQuestions: [],
      hasQuestions: true,
    };
  }

  // Fallback for file/photo homework
  return {
    totalQuestions: 0,
    correctCount: 0,
    wrongCount: 0,
    calculatedScore: pengumpulan.nilai ?? 95,
    evaluatedQuestions: [],
    hasQuestions: false,
  };
}

export const SubmissionGradingModal: React.FC<SubmissionGradingModalProps> = ({
  isOpen,
  onClose,
  pengumpulan,
  onGraded,
}) => {
  if (!isOpen) return null;

  // Find corresponding task to display question contexts and answer keys
  const allTugas = localDB.getTugas();
  const relatedTask: Tugas | undefined = allTugas.find((t) => t.id === pengumpulan.tugas_id);

  // Compute auto grade from questions & keys
  const autoGrade = useMemo(
    () => computeAutoGrade(pengumpulan, relatedTask),
    [pengumpulan, relatedTask]
  );

  // Initial score is automatically taken from the auto-calculated score
  const initialScore =
    pengumpulan.nilai !== null && pengumpulan.nilai !== undefined
      ? pengumpulan.nilai
      : autoGrade.calculatedScore;

  const [nilai, setNilai] = useState<number>(initialScore);
  const [showManualOverride, setShowManualOverride] = useState(false);
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);

  // Construct positive auto feedback based on results
  const defaultFeedback = useMemo(() => {
    if (pengumpulan.feedback) return pengumpulan.feedback;
    if (autoGrade.hasQuestions) {
      if (autoGrade.calculatedScore === 100) {
        return `Luar biasa, nilai sempurna! Semua ${autoGrade.totalQuestions} soal dijawab dengan benar dan teliti. Pertahankan prestasimu, anak hebat!`;
      }
      if (autoGrade.calculatedScore >= 80) {
        return `Kerja sangat bagus! ${autoGrade.correctCount} dari ${autoGrade.totalQuestions} soal dijawab dengan tepat. Terus pertahankan semangat belajarmu!`;
      }
      if (autoGrade.calculatedScore >= 60) {
        return `Usaha yang baik! ${autoGrade.correctCount} soal berhasil dijawab benar. Jangan lupa pelajari kembali kunci jawaban untuk soal yang belum tepat ya!`;
      }
      return `Tetap semangat belajar! Silakan pelajari kembali materi dan jangan ragu untuk bertanya pada bapak/ibu guru. Kamu pasti bisa lebih baik lagi!`;
    }
    return 'Pekerjaan tugas telah diperiksa dengan baik. Terima kasih atas usaha belajarmu!';
  }, [pengumpulan.feedback, autoGrade]);

  const [feedback, setFeedback] = useState<string>(defaultFeedback);

  const deskripsi = getDeskripsiNilai(nilai);
  const bintang = getBintangFromNilai(nilai);

  const handleScoreChange = (newVal: number) => {
    const val = Math.max(0, Math.min(100, newVal));
    setNilai(val);
    const desc = getDeskripsiNilai(val);
    setFeedback(desc.penjelasan);
  };

  const handleApproveAndSave = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    const all = localDB.getPengumpulan();
    const updated = all.map((p) => {
      if (p.id === pengumpulan.id) {
        return {
          ...p,
          nilai,
          kategori_nilai: deskripsi.kategori,
          bintang,
          feedback: feedback.trim(),
          status: 'sudah_dinilai' as const,
          is_approved: true,
          jumlah_benar: autoGrade.correctCount,
          jumlah_salah: autoGrade.wrongCount,
          total_soal: autoGrade.totalQuestions,
          graded_at: new Date().toISOString(),
        };
      }
      return p;
    });

    localDB.savePengumpulan(updated);

    // Update student total stars in their profile
    if (bintang > (pengumpulan.bintang || 0)) {
      const allProfiles = localDB.getProfiles();
      const diff = bintang - (pengumpulan.bintang || 0);
      const updatedProfiles = allProfiles.map((prof) => {
        if (prof.id === pengumpulan.siswa_id) {
          return {
            ...prof,
            total_bintang: (prof.total_bintang || 0) + diff,
          };
        }
        return prof;
      });
      localDB.saveProfiles(updatedProfiles);
    }

    // Notify student real-time
    const allNotifs = localDB.getNotifikasi();
    allNotifs.unshift({
      id: `notif-${Date.now()}-${pengumpulan.siswa_id}`,
      user_id: pengumpulan.siswa_id,
      judul: `Nilai Tugas Disetujui Guru: ${pengumpulan.tugas_judul || 'Tugas'} ⭐`,
      pesan: `Ibu/Bapak Guru telah menyetujui tugasmu dengan skor ${nilai} (${deskripsi.kategori}). "${feedback.trim()}"`,
      link: '/tugas',
      tipe: 'nilai_keluar',
      dibaca: false,
      created_at: new Date().toISOString(),
    });
    localDB.saveNotifikasi(allNotifs);

    onGraded();
    onClose();
  };

  const isImageFile =
    pengumpulan.file_url &&
    (pengumpulan.file_url.startsWith('data:image') ||
      pengumpulan.file_url.endsWith('.jpg') ||
      pengumpulan.file_url.endsWith('.png') ||
      pengumpulan.file_url.endsWith('.jpeg'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between shadow-md">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-white/20 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Persetujuan & Penilaian Guru (Approve)</span>
            </div>
            <h3 className="font-extrabold text-base sm:text-xl leading-tight">{pengumpulan.siswa_nama}</h3>
            <p className="text-xs text-emerald-100 mt-0.5">
              NIS: {pengumpulan.siswa_nis} {pengumpulan.tingkat_kelas ? `• Kelas ${pengumpulan.tingkat_kelas}` : ''} • {pengumpulan.mapel_nama || 'Mata Pelajaran'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* ============================================================== */}
          {/* 1. AUTO-CORRECTION SUMMARY BANNER (GURU HANYA PERLU APPROVE) */}
          {/* ============================================================== */}
          <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 rounded-2xl border border-emerald-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                  Koreksi Otomatis Sistem BelajarYuk
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Nilai otomatis dihitung sesuai kunci jawaban benar & salah. Guru hanya perlu meninjau dan menekan tombol <strong>Setujui (Approve)</strong>.
              </p>
              {autoGrade.hasQuestions && (
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    <span>{autoGrade.correctCount} Benar</span>
                  </span>
                  {autoGrade.wrongCount > 0 ? (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 flex items-center gap-1">
                      <X className="w-3 h-3" />
                      <span>{autoGrade.wrongCount} Salah</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                      Semua Jawaban Tepat! ⭐
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-slate-500">
                    dari {autoGrade.totalQuestions} soal
                  </span>
                </div>
              )}
            </div>

            {/* Big Auto-Score Badge */}
            <div className="text-center sm:text-right shrink-0 bg-white px-4 py-2.5 rounded-2xl border border-emerald-200 shadow-xs">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                Skor Otomatis
              </span>
              <span className="text-3xl font-black text-emerald-600 leading-tight">
                {nilai}
              </span>
              <span className="text-[10px] font-bold text-slate-500 block">
                / 100 ({deskripsi.kategori})
              </span>
            </div>
          </div>

          {/* Task Info Pill */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
            <div>
              <span className="text-slate-400 font-semibold uppercase text-[10px]">Tugas:</span>
              <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm mt-0.5">
                {pengumpulan.tugas_judul}
              </h4>
            </div>
            {pengumpulan.submitted_at && (
              <span className="text-[11px] text-slate-500 font-medium">
                Dikumpulkan: {new Date(pengumpulan.submitted_at).toLocaleString('id-ID')}
              </span>
            )}
          </div>

          {/* ============================================================== */}
          {/* 2. QUESTION-BY-QUESTION BREAKDOWN (BENAR VS SALAH) */}
          {/* ============================================================== */}
          <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50/50 space-y-3">
            <h5 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Rincian Hasil Pengerjaan Siswa</span>
            </h5>

            {autoGrade.evaluatedQuestions.length > 0 ? (
              <div className="space-y-3">
                {autoGrade.evaluatedQuestions.map((q) => (
                  <div
                    key={q.id}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2 text-xs ${
                      q.isCorrect
                        ? 'bg-emerald-50/40 border-emerald-300'
                        : 'bg-rose-50/40 border-rose-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-600">Soal No. {q.nomor}</span>
                      {q.isCorrect ? (
                        <span className="text-emerald-700 font-extrabold bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 text-[11px]">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Jawaban Tepat ✓ (+{q.skor_bobot} Poin)</span>
                        </span>
                      ) : (
                        <span className="text-rose-700 font-extrabold bg-rose-100 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 text-[11px]">
                          <X className="w-3.5 h-3.5 text-rose-600" />
                          <span>Kurang Tepat ✗ (0 Poin)</span>
                        </span>
                      )}
                    </div>

                    <p className="font-semibold text-slate-800 text-xs sm:text-sm leading-relaxed">
                      {q.pertanyaan}
                    </p>

                    <div className="space-y-1 pt-1">
                      <div
                        className={`p-2 rounded-xl border font-bold flex items-center justify-between ${
                          q.isCorrect
                            ? 'bg-white border-emerald-200 text-emerald-900'
                            : 'bg-white border-rose-200 text-rose-900'
                        }`}
                      >
                        <span>
                          Jawaban Siswa: <span className="font-black">{q.studentAns || '(Tidak dijawab)'}</span>
                        </span>
                        {q.isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                      </div>

                      {!q.isCorrect && (
                        <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-bold">
                          Kunci Jawaban yang Benar: <span className="font-black">{q.kunci_jawaban}</span>
                        </div>
                      )}

                      {q.pembahasan && (
                        <p className="text-[11px] text-slate-500 italic pt-0.5">
                          💡 Pembahasan: {q.pembahasan}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : pengumpulan.jawaban_teks && Object.keys(pengumpulan.jawaban_teks).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(pengumpulan.jawaban_teks).map(([soalId, ans], idx) => (
                  <div key={soalId} className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-500">Soal No. {idx + 1}</span>
                    <p className="font-bold text-slate-900 bg-slate-50 p-2 rounded-lg">
                      Jawaban Siswa: <span className="text-blue-700">{ans}</span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Siswa mengumpulkan berkas/lembar tugas tanpa kuis pilihan ganda.
              </p>
            )}

            {/* Optional Photo or Document Attachment */}
            {pengumpulan.file_url && (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-[11px] font-bold text-slate-600 block mb-2">
                  📎 Lampiran Berkas / Lembar Tugas (Opsional):
                </span>

                {isImageFile ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-60 group">
                    <img
                      src={pengumpulan.file_url}
                      alt="Foto Pekerjaan Siswa"
                      className="w-full h-auto max-h-60 object-contain mx-auto"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsPhotoLightboxOpen(true)}
                        className="px-2.5 py-1 rounded-xl bg-black/70 hover:bg-black/90 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Perbesar Foto</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-amber-600" />
                      <span className="text-xs font-bold text-slate-800">
                        {pengumpulan.file_nama || 'Berkas_Tugas_Siswa.pdf'}
                      </span>
                    </div>
                    <a
                      href={pengumpulan.file_url}
                      download={pengumpulan.file_nama || 'Berkas_Tugas.pdf'}
                      className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Unduh</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Student Note */}
            {pengumpulan.catatan_siswa && (
              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-800">
                <strong>Catatan Siswa:</strong> "{pengumpulan.catatan_siswa}"
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* 3. CAPAIAN & BINTANG SISWA */}
          {/* ============================================================== */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Predikat Capaian Kurikulum Merdeka:
              </span>
              <span className="text-xs font-black px-3 py-1 rounded-full bg-white text-emerald-700 shadow-xs border border-emerald-200">
                {deskripsi.kategori}
              </span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-slate-600">Apresiasi Bintang Pembelajaran:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-4 h-4 ${
                      s <= bintang ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                    }`}
                  />
                ))}
                <span className="text-xs font-bold text-slate-700 ml-1">({bintang} Bintang)</span>
              </div>
            </div>
          </div>

          {/* Feedback textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Catatan & Masukan Positif Guru (Otomatis dibuatkan, dapat diedit):
            </label>
            <textarea
              rows={2}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Berikan kata-kata motivasi dan apresiasi membangun..."
              className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          {/* ============================================================== */}
          {/* 4. OPTIONAL MANUAL OVERRIDE (JIKA GURU INGIN TAMBAH POIN) */}
          {/* ============================================================== */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowManualOverride(!showManualOverride)}
              className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-600 transition cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-slate-500" />
                <span>Sesuaikan Nilai Secara Manual (Opsional)</span>
              </div>
              {showManualOverride ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showManualOverride && (
              <div className="p-4 bg-white border-t border-slate-200 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">Ubah skor jika ada nilai bonus:</span>
                  <span className="text-xl font-black text-blue-600">{nilai}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={nilai}
                  onChange={(e) => handleScoreChange(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />

                <div className="flex items-center gap-1.5 pt-1">
                  {[
                    { val: 100, label: '100' },
                    { val: 90, label: '90' },
                    { val: 80, label: '80' },
                    { val: 70, label: '70' },
                    { val: autoGrade.calculatedScore, label: `Kembalikan Otomatis (${autoGrade.calculatedScore})` },
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleScoreChange(item.val)}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition ${
                        nilai === item.val
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-600 hover:bg-white transition cursor-pointer"
          >
            Batal
          </button>

          {/* Primary Action Button: Guru Hanya Approve! */}
          <button
            onClick={handleApproveAndSave}
            className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-emerald-500/25 transition cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>Setujui & Kirim Nilai ({nilai})</span>
          </button>
        </div>
      </div>

      {/* Lightbox Modal for Student Photo */}
      {isPhotoLightboxOpen && pengumpulan.file_url && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="max-w-4xl w-full flex items-center justify-between text-white mb-3">
            <p className="text-sm font-bold">Foto Tugas: {pengumpulan.siswa_nama}</p>
            <button
              onClick={() => setIsPhotoLightboxOpen(false)}
              className="p-1.5 rounded-full hover:bg-white/20 transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <img
            src={pengumpulan.file_url}
            alt="Foto Tugas Siswa"
            className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
