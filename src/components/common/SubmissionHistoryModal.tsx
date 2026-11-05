import React from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Star,
  Award,
  Calendar,
  Clock,
  User,
  Check,
  Sparkles,
  FileText,
  Download,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { Pengumpulan, Tugas, SoalTugas } from '../../types';
import { localDB } from '../../lib/supabase';
import { formatSemesterLabel } from '../../lib/kurikulum';
import { evaluateAnswer } from '../teacher/SubmissionGradingModal';

interface SubmissionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  pengumpulan: Pengumpulan;
  tugas?: Tugas;
}

export const SubmissionHistoryModal: React.FC<SubmissionHistoryModalProps> = ({
  isOpen,
  onClose,
  pengumpulan,
  tugas,
}) => {
  if (!isOpen) return null;

  // Find task if not passed directly
  const allTugas = localDB.getTugas();
  const currentTask: Tugas | undefined = tugas || allTugas.find((t) => t.id === pengumpulan.tugas_id);
  const soalList: SoalTugas[] = currentTask?.soal_list || [];
  const answers = pengumpulan.jawaban_teks || {};

  // Compute question evaluations
  let calculatedCorrect = 0;
  let calculatedWrong = 0;
  let totalScoreWeight = 0;
  let earnedScoreWeight = 0;

  const evaluatedQuestions = soalList.map((soal) => {
    const studentAns = answers[soal.id] || '';
    const isCorrect = evaluateAnswer(studentAns, soal.kunci_jawaban, soal.tipe);
    const weight = soal.skor_bobot || Math.round(100 / Math.max(1, soalList.length));
    totalScoreWeight += weight;

    if (isCorrect) {
      calculatedCorrect += 1;
      earnedScoreWeight += weight;
    } else {
      calculatedWrong += 1;
    }

    return {
      ...soal,
      studentAns,
      isCorrect,
      earnedScore: isCorrect ? weight : 0,
    };
  });

  const correctCount = pengumpulan.jumlah_benar ?? calculatedCorrect;
  const wrongCount = pengumpulan.jumlah_salah ?? calculatedWrong;
  const totalQuestions = soalList.length > 0 ? soalList.length : Object.keys(answers).length;
  const score = pengumpulan.nilai ?? (totalScoreWeight > 0 ? Math.round((earnedScoreWeight / totalScoreWeight) * 100) : 100);
  const isApproved = pengumpulan.status === 'sudah_dinilai';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white flex items-center justify-between shadow-md">
          <div className="min-w-0 pr-3">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wider">
                Riwayat Pengerjaan & Pembahasan
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/40 text-blue-100">
                {pengumpulan.mapel_nama || currentTask?.mapel_nama || 'Mata Pelajaran'}
              </span>
            </div>
            <h3 className="font-extrabold text-base sm:text-xl truncate">
              {pengumpulan.tugas_judul || currentTask?.judul || 'Tugas Siswa'}
            </h3>
            <p className="text-xs text-blue-100 mt-0.5 flex items-center gap-1.5">
              <span>Oleh: {pengumpulan.siswa_nama} (NIS: {pengumpulan.siswa_nis})</span>
              {pengumpulan.tingkat_kelas && <span>• Kelas {pengumpulan.tingkat_kelas}</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Summary Score Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50/70 to-slate-50 border border-blue-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Hasil Evaluasi Sistem:
                </span>
                {isApproved ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Check className="w-3 h-3 text-emerald-700" />
                    <span>Disetujui Guru (Approved)</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                    <Clock className="w-3 h-3 text-amber-700" />
                    <span>Nilai Otomatis (Menunggu Approve Guru)</span>
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{correctCount} Soal Benar</span>
                </span>

                {wrongCount > 0 ? (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>{wrongCount} Soal Belum Tepat</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-800">
                    Nilai Sempurna 100%! ⭐
                  </span>
                )}

                <span className="text-xs text-slate-500 font-semibold">
                  dari {totalQuestions} butir soal
                </span>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>
                  Waktu Pengerjaan:{' '}
                  {pengumpulan.submitted_at
                    ? new Date(pengumpulan.submitted_at).toLocaleString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Baru saja'}
                </span>
              </div>
            </div>

            {/* Big Score Box */}
            <div className="text-center sm:text-right shrink-0 bg-white px-5 py-3.5 rounded-2xl border border-blue-200 shadow-xs">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block">
                Nilai Akhir
              </span>
              <div className="text-4xl font-black text-blue-700 leading-tight">
                {score}
                <span className="text-sm text-blue-400 font-bold ml-1">/100</span>
              </div>
              <div className="flex items-center justify-center sm:justify-end gap-1 mt-1">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${
                      s <= (pengumpulan.bintang || 3)
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-slate-200'
                    }`}
                  />
                ))}
                <span className="text-[11px] font-bold text-slate-700 ml-1">
                  {pengumpulan.kategori_nilai || 'Sangat Mahir'}
                </span>
              </div>
            </div>
          </div>

          {/* Teacher Feedback Note (if present) */}
          {pengumpulan.feedback && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Catatan & Masukan Guru:</span>
              </div>
              <p className="italic text-slate-700 leading-relaxed pl-5">
                "{pengumpulan.feedback}"
              </p>
            </div>
          )}

          {/* Attached Photo (if any) */}
          {pengumpulan.file_url && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                📎 Lampiran Foto / Berkas Tugas:
              </span>
              <div className="rounded-xl overflow-hidden border border-slate-200 max-h-56 bg-slate-100 flex items-center justify-center">
                <img
                  src={pengumpulan.file_url}
                  alt="Lembar Tugas Siswa"
                  className="max-h-56 w-auto object-contain mx-auto"
                />
              </div>
            </div>
          )}

          {/* Question Breakdown List */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Rincian Soal & Jawaban Siswa</span>
            </h4>

            {evaluatedQuestions.length > 0 ? (
              evaluatedQuestions.map((q, idx) => (
                <div
                  key={q.id || idx}
                  className={`p-4 rounded-2xl border transition-all space-y-2.5 text-xs ${
                    q.isCorrect
                      ? 'bg-emerald-50/30 border-emerald-300'
                      : 'bg-rose-50/30 border-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-slate-700">
                      Soal No. {q.nomor || idx + 1} ({q.tipe})
                    </span>
                    {q.isCorrect ? (
                      <span className="text-emerald-700 font-extrabold bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Jawabanmu Benar (+{q.earnedScore} Poin)</span>
                      </span>
                    ) : (
                      <span className="text-rose-700 font-extrabold bg-rose-100 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1 text-[11px]">
                        <XCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Belum Tepat (0 Poin)</span>
                      </span>
                    )}
                  </div>

                  <p className="font-bold text-slate-800 text-xs sm:text-sm leading-relaxed">
                    {q.pertanyaan}
                  </p>

                  {/* Options if multiple choice */}
                  {q.pilihan && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                      {q.pilihan.map((opt, optIdx) => {
                        const isStudentPick = q.studentAns === opt;
                        const isAnswerKey =
                          opt.startsWith(q.kunci_jawaban.charAt(0)) ||
                          opt.toLowerCase() === q.kunci_jawaban.toLowerCase();

                        return (
                          <div
                            key={optIdx}
                            className={`p-2.5 rounded-xl border text-[11px] font-semibold flex items-center justify-between ${
                              isStudentPick && isAnswerKey
                                ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-bold'
                                : isStudentPick
                                ? 'bg-rose-100 border-rose-400 text-rose-950 font-bold'
                                : isAnswerKey
                                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 font-bold'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <span>{opt}</span>
                            {isStudentPick && isAnswerKey && (
                              <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-black">
                                ✓ Jawabanmu
                              </span>
                            )}
                            {isStudentPick && !isAnswerKey && (
                              <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-black">
                                ✗ Pilihanmu
                              </span>
                            )}
                            {!isStudentPick && isAnswerKey && (
                              <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-black">
                                Kunci Benar
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* If short answer / essay */}
                  {!q.pilihan && (
                    <div className="space-y-1.5 pt-1">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                        <span className="text-slate-400 block text-[10px] font-bold">Jawaban Siswa:</span>
                        <p className="font-bold text-slate-800">{q.studentAns || '(Tidak dijawab)'}</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                        <span className="text-emerald-700 block text-[10px] font-bold">Kunci Jawaban:</span>
                        <p className="font-bold text-emerald-900">{q.kunci_jawaban}</p>
                      </div>
                    </div>
                  )}

                  {/* Explanation / Pembahasan */}
                  {q.pembahasan && (
                    <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-[11px] leading-relaxed">
                      💡 <strong>Pembahasan:</strong> {q.pembahasan}
                    </div>
                  )}
                </div>
              ))
            ) : Object.keys(answers).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(answers).map(([soalId, ans], idx) => (
                  <div key={soalId} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                    <span className="font-bold text-slate-600">Jawaban No. {idx + 1}</span>
                    <p className="font-bold text-slate-800 bg-white p-2.5 rounded-lg border border-slate-200">
                      {ans}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic text-center py-4">
                Tidak ada data rincian butir soal untuk tugas ini.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Semester: {formatSemesterLabel(pengumpulan.semester)}
          </span>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            Tutup Riwayat
          </button>
        </div>
      </div>
    </div>
  );
};
