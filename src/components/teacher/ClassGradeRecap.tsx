import React, { useState, useEffect } from 'react';
import { Download, Star, Award, Search, Filter } from 'lucide-react';
import { Rombel, Tugas, Pengumpulan, UserProfile } from '../../types';
import { localDB } from '../../lib/supabase';
import { downloadCSV } from '../../lib/kurikulum';
import { SubmissionGradingModal, computeAutoGrade } from './SubmissionGradingModal';
import { SubmissionHistoryModal } from '../common/SubmissionHistoryModal';
import { getBintangFromNilai, getDeskripsiNilai } from '../../lib/kurikulum';
import confetti from 'canvas-confetti';
import { Check, Eye } from 'lucide-react';
import { useRealtimeSubscription } from '../../hooks/useRealtimeData';

interface ClassGradeRecapProps {
  rombels: Rombel[];
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ClassGradeRecap: React.FC<ClassGradeRecapProps> = ({ rombels, onShowToast }) => {
  const [selectedRombelId, setSelectedRombelId] = useState<string>(rombels[0]?.id || '');
  const [pengumpulanList, setPengumpulanList] = useState<Pengumpulan[]>(localDB.getPengumpulan());
  const [selectedSubForGrading, setSelectedSubForGrading] = useState<Pengumpulan | null>(null);
  const [selectedSubForHistory, setSelectedSubForHistory] = useState<Pengumpulan | null>(null);

  const loadData = () => {
    setPengumpulanList(localDB.getPengumpulan());
  };

  useEffect(() => {
    if ((!selectedRombelId || !rombels.some((r) => r.id === selectedRombelId)) && rombels.length > 0) {
      setSelectedRombelId(rombels[0].id);
    }
  }, [rombels, selectedRombelId]);

  useRealtimeSubscription({
    table: 'pengumpulan',
    onChange: () => loadData(),
  });

  const currentRombel = rombels.find((r) => r.id === selectedRombelId) || rombels[0];
  const allTugas = localDB.getTugas().filter((t) => t.rombel_id === selectedRombelId);
  const allProfiles = localDB.getProfiles();
  const classStudents = allProfiles.filter(
    (p) => p.role === 'SISWA' && p.rombel_id === selectedRombelId
  );

  const filteredPengumpulan = pengumpulanList.filter((p) => {
    return classStudents.some((st) => st.id === p.siswa_id);
  });

  const handleExportCSV = () => {
    if (filteredPengumpulan.length === 0) {
      alert('Belum ada data nilai pengumpulan pada kelas ini.');
      return;
    }

    const headers = [
      'Nama Siswa',
      'NIS',
      'Judul Tugas',
      'Nilai',
      'Predikat Kurikulum',
      'Bintang',
      'Feedback Guru',
      'Status',
      'Waktu Kumpul',
    ];

    const rows = filteredPengumpulan.map((p) => [
      p.siswa_nama || '-',
      p.siswa_nis || '-',
      p.tugas_judul || '-',
      p.nilai ?? '-',
      p.kategori_nilai || '-',
      p.bintang ?? '-',
      p.feedback || '-',
      p.status,
      p.submitted_at ? new Date(p.submitted_at).toLocaleString('id-ID') : '-',
    ]);

    const filename = `Rekap_Nilai_Kelas_${currentRombel?.nama || 'SD'}_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadCSV(filename, headers, rows);
    onShowToast(`File ${filename} berhasil diunduh!`, 'success');
  };

  const handleQuickApprove = (sub: Pengumpulan) => {
    const relatedTask = allTugas.find((t) => t.id === sub.tugas_id);
    const auto = computeAutoGrade(sub, relatedTask);
    const finalScore = auto.calculatedScore;
    const deskripsi = getDeskripsiNilai(finalScore);
    const bintang = getBintangFromNilai(finalScore);
    const feedback = auto.hasQuestions
      ? auto.calculatedScore === 100
        ? `Luar biasa, nilai sempurna! Semua ${auto.totalQuestions} soal dijawab dengan benar dan teliti. Pertahankan prestasimu!`
        : `Kerja sangat bagus! ${auto.correctCount} dari ${auto.totalQuestions} soal dijawab dengan tepat. Terus pertahankan prestasimu!`
      : 'Pekerjaan tugas telah diperiksa dan disetujui bapak/ibu guru.';

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    const all = localDB.getPengumpulan();
    const updated = all.map((p) => {
      if (p.id === sub.id) {
        return {
          ...p,
          nilai: finalScore,
          kategori_nilai: deskripsi.kategori,
          bintang,
          feedback,
          status: 'sudah_dinilai' as const,
          is_approved: true,
          jumlah_benar: auto.correctCount,
          jumlah_salah: auto.wrongCount,
          total_soal: auto.totalQuestions,
          graded_at: new Date().toISOString(),
        };
      }
      return p;
    });

    localDB.savePengumpulan(updated);

    // Update student stars
    const allProfiles = localDB.getProfiles();
    const updatedProfiles = allProfiles.map((prof) => {
      if (prof.id === sub.siswa_id) {
        return {
          ...prof,
          total_bintang: (prof.total_bintang || 0) + bintang,
        };
      }
      return prof;
    });
    localDB.saveProfiles(updatedProfiles);

    // Notify student
    const allNotifs = localDB.getNotifikasi();
    allNotifs.unshift({
      id: `notif-${Date.now()}-${sub.siswa_id}`,
      user_id: sub.siswa_id,
      judul: `Nilai Tugas Disetujui Guru: ${sub.tugas_judul || 'Tugas'} ⭐`,
      pesan: `Ibu/Bapak Guru telah menyetujui tugasmu dengan skor ${finalScore} (${deskripsi.kategori}). "${feedback}"`,
      link: '/tugas',
      tipe: 'nilai_keluar',
      dibaca: false,
      created_at: new Date().toISOString(),
    });
    localDB.saveNotifikasi(allNotifs);

    onShowToast(`Nilai ${sub.siswa_nama} (${finalScore}) berhasil disetujui (Approved)!`, 'success');
    loadData();
  };

  return (
    <div className="space-y-6">
      {/* Top Filter & Export Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <select
            value={selectedRombelId}
            onChange={(e) => setSelectedRombelId(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {rombels.map((r) => (
              <option key={r.id} value={r.id}>
                Kelas {r.nama} ({r.fase})
              </option>
            ))}
          </select>
          <span className="text-xs text-slate-500 font-bold">
            {classStudents.length} Siswa Terdaftar
          </span>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
        >
          <Download className="w-4 h-4" />
          <span>Ekspor Rekap Nilai ke CSV</span>
        </button>
      </div>

      {/* Recap Table */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase tracking-wider font-extrabold">
              <tr>
                <th className="px-5 py-4">Siswa</th>
                <th className="px-5 py-4">NIS</th>
                <th className="px-5 py-4">Judul Tugas</th>
                <th className="px-5 py-4 text-center">Nilai</th>
                <th className="px-5 py-4">Predikat Capaian</th>
                <th className="px-5 py-4 text-center">Bintang</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Aksi Penilaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPengumpulan.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                    Belum ada pengumpulan tugas dari siswa kelas ini.
                  </td>
                </tr>
              ) : (
                filteredPengumpulan.map((p) => {
                  const relatedTask = allTugas.find((t) => t.id === p.tugas_id);
                  const auto = computeAutoGrade(p, relatedTask);
                  const effectiveScore = p.nilai !== null && p.nilai !== undefined ? p.nilai : auto.calculatedScore;
                  const isApproved = p.status === 'sudah_dinilai' || p.is_approved;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-4 font-bold text-slate-800">{p.siswa_nama}</td>
                      <td className="px-5 py-4 text-slate-500 font-semibold">{p.siswa_nis}</td>
                      <td className="px-5 py-4 text-slate-700 font-medium max-w-[200px] truncate">
                        {p.tugas_judul}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="font-black text-sm text-blue-600">
                          {effectiveScore}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {p.kategori_nilai || getDeskripsiNilai(effectiveScore).kategori}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="inline-flex items-center gap-0.5 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          {p.bintang ?? getBintangFromNilai(effectiveScore)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {isApproved ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                            Disetujui Guru ✓
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold border border-amber-200">
                            Menunggu Approve Guru
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isApproved && (
                            <button
                              onClick={() => handleQuickApprove(p)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold transition text-xs shadow-xs flex items-center gap-1 cursor-pointer"
                              title="Setujui (Approve) langsung nilai otomatis ini"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve ({effectiveScore})</span>
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedSubForHistory(p)}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition text-xs cursor-pointer border border-blue-200"
                            title="Buka rincian soal dan riwayat jawaban siswa"
                          >
                            Riwayat
                          </button>
                          <button
                            onClick={() => setSelectedSubForGrading(p)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition text-xs cursor-pointer"
                            title="Tinjau atau sesuaikan nilai secara manual"
                          >
                            Tinjau
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grading Modal */}
      {selectedSubForGrading && (
        <SubmissionGradingModal
          isOpen={Boolean(selectedSubForGrading)}
          onClose={() => setSelectedSubForGrading(null)}
          pengumpulan={selectedSubForGrading}
          onGraded={() => {
            onShowToast('Nilai dan masukan berhasil tersimpan!', 'success');
            loadData();
          }}
        />
      )}

      {/* Riwayat Pengerjaan Modal */}
      {selectedSubForHistory && (
        <SubmissionHistoryModal
          isOpen={Boolean(selectedSubForHistory)}
          onClose={() => setSelectedSubForHistory(null)}
          pengumpulan={selectedSubForHistory}
          tugas={allTugas.find((t) => t.id === selectedSubForHistory.tugas_id)}
        />
      )}
    </div>
  );
};
