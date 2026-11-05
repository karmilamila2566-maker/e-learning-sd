import React, { useState } from 'react';
import {
  Award,
  Star,
  FileCheck,
  TrendingUp,
  Filter,
  Printer,
  Download,
  Calendar,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
} from 'lucide-react';
import { Pengumpulan, Tugas, MataPelajaran, UserProfile } from '../../types';
import { downloadCSV, formatSemesterLabel, getSemesterFromDate } from '../../lib/kurikulum';

interface StudentGradeRecapProps {
  user: UserProfile;
  pengumpulanList: Pengumpulan[];
  tugasList: Tugas[];
  mapelList: MataPelajaran[];
  onOpenTaskReview: (tugas: Tugas, sub: Pengumpulan) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const StudentGradeRecap: React.FC<StudentGradeRecapProps> = ({
  user,
  pengumpulanList,
  tugasList,
  mapelList,
  onOpenTaskReview,
  onShowToast,
}) => {
  // Semester filter: 'all' | '1' | '2'
  const [selectedSemester, setSelectedSemester] = useState<string>('all');
  // Mapel filter: 'all' | mapelId
  const [selectedMapelId, setSelectedMapelId] = useState<string>('all');

  // Filter only submissions of this student
  const studentSubs = pengumpulanList.filter((p) => p.siswa_id === user.id);

  // Helper to resolve semester for a submission
  const resolveSemester = (sub: Pengumpulan): 1 | 2 => {
    if (sub.semester === 1 || sub.semester === 2) return sub.semester;
    const relatedTask = tugasList.find((t) => t.id === sub.tugas_id);
    if (relatedTask?.semester === 1 || relatedTask?.semester === 2) {
      return relatedTask.semester;
    }
    return getSemesterFromDate(sub.submitted_at || sub.created_at || relatedTask?.created_at);
  };

  // Helper to resolve mapel for a submission
  const resolveMapel = (sub: Pengumpulan): { id: string; nama: string } => {
    if (sub.mapel_id && sub.mapel_nama) {
      return { id: sub.mapel_id, nama: sub.mapel_nama };
    }
    const relatedTask = tugasList.find((t) => t.id === sub.tugas_id);
    if (relatedTask?.mapel_id && relatedTask?.mapel_nama) {
      return { id: relatedTask.mapel_id, nama: relatedTask.mapel_nama };
    }
    return { id: 'mpl-lain', nama: sub.mapel_nama || 'Mata Pelajaran SD' };
  };

  // Filtered by semester and mapel
  const filteredSubs = studentSubs.filter((sub) => {
    const sem = resolveSemester(sub);
    const mapel = resolveMapel(sub);

    const matchSem = selectedSemester === 'all' || String(sem) === selectedSemester;
    const matchMapel = selectedMapelId === 'all' || mapel.id === selectedMapelId;
    return matchSem && matchMapel;
  });

  // Calculate statistics
  const gradedSubs = filteredSubs.filter(
    (s) => s.nilai !== null && s.nilai !== undefined
  );
  const totalNilai = gradedSubs.reduce((acc, curr) => acc + (curr.nilai || 0), 0);
  const avgNilai = gradedSubs.length > 0 ? Math.round(totalNilai / gradedSubs.length) : 0;
  const totalBintang = gradedSubs.reduce((acc, curr) => acc + (curr.bintang || 0), 0);

  // Overall predicate
  let predikatUmum = 'Belum Ada Nilai';
  if (gradedSubs.length > 0) {
    if (avgNilai >= 90) predikatUmum = 'Sangat Mahir 🌟';
    else if (avgNilai >= 75) predikatUmum = 'Sudah Berkembang 👏';
    else if (avgNilai >= 60) predikatUmum = 'Cukup Berkembang 👍';
    else predikatUmum = 'Perlu Bimbingan 💪';
  }

  // Export CSV
  const handleExportCSV = () => {
    if (filteredSubs.length === 0) {
      alert('Belum ada data nilai tugas untuk semester yang dipilih.');
      return;
    }

    const headers = [
      'Nama Siswa',
      'NIS',
      'Kelas',
      'Mata Pelajaran',
      'Semester',
      'Judul Tugas',
      'Nilai Angka',
      'Predikat Capaian',
      'Bintang',
      'Feedback Guru',
      'Waktu Kumpul',
    ];

    const rows = filteredSubs.map((sub) => {
      const sem = resolveSemester(sub);
      const mapel = resolveMapel(sub);
      return [
        user.nama,
        user.nis_nip,
        user.rombel_nama || `Kelas ${user.tingkat_kelas}`,
        mapel.nama,
        formatSemesterLabel(sem),
        sub.tugas_judul || 'Tugas Siswa',
        sub.nilai ?? 'Menunggu Nilai',
        sub.kategori_nilai || '-',
        sub.bintang ? `${sub.bintang} Bintang` : '-',
        sub.feedback || '-',
        sub.submitted_at ? new Date(sub.submitted_at).toLocaleString('id-ID') : '-',
      ];
    });

    const semLabel = selectedSemester === 'all' ? 'Semua_Semester' : `Semester_${selectedSemester}`;
    const filename = `Rapor_Nilai_${user.nama.replace(/\s+/g, '_')}_${semLabel}.csv`;
    downloadCSV(filename, headers, rows);
    onShowToast(`File ${filename} berhasil diunduh!`, 'success');
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Filter Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
              Buku Nilai & Rapor Siswa
            </span>
            <span className="text-xs font-bold text-slate-400">
              {user.rombel_nama || `Kelas ${user.tingkat_kelas}`} • Tahun Ajaran 2024/2025
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-black text-slate-800 mt-1">
            Rekap Capaian & Nilai Tugas Semester
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pantau seluruh tugas dan kuis yang telah kamu kumpulkan, nilai hasil evaluasi, dan catatan dari guru per semester.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 text-xs font-bold text-slate-700 hover:text-blue-600 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Unduh CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Rapor Nilai</span>
          </button>
        </div>
      </div>

      {/* Semester & Subject Filter Controls */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Semester Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setSelectedSemester('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedSemester === 'all'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Semua Semester</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSemester('1')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedSemester === '1'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Semester 1 (Ganjil)</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedSemester('2')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedSemester === '2'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Semester 2 (Genap)</span>
            </button>
          </div>

          {/* Mapel Filter Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedMapelId}
              onChange={(e) => setSelectedMapelId(e.target.value)}
              className="px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="all">Semua Mata Pelajaran</option>
              {mapelList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nama}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              Rata-Rata Nilai
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-blue-600">
            {gradedSubs.length > 0 ? avgNilai : '-'}
            <span className="text-xs font-bold text-slate-400 ml-1">/100</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Dari {gradedSubs.length} tugas yang dinilai
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              Total Bintang
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-500 flex items-center gap-1">
            <span>{totalBintang}</span>
            <Star className="w-5 h-5 fill-amber-400" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Prestasi semester ini
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              Tugas Dikumpulkan
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">
            {filteredSubs.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {gradedSubs.length} sudah dinilai guru
          </p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase">
              Predikat Capaian
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-purple-700 truncate">
            {predikatUmum}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Standar Kurikulum Merdeka
          </p>
        </div>
      </div>

      {/* Grade List / Table */}
      {filteredSubs.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-xs">
          <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-700 text-base">Belum Ada Pengumpulan Tugas</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {selectedSemester === 'all'
              ? 'Kamu belum memiliki tugas yang dikumpulkan. Buka tab "Tugas & Kuis" untuk mulai belajar!'
              : `Belum ada tugas yang dikumpulkan pada ${formatSemesterLabel(Number(selectedSemester) as 1 | 2)}.`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-extrabold text-slate-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Daftar Nilai Tugas & Masukan Guru ({filteredSubs.length})</span>
            </h3>
            <span className="text-xs text-slate-400 font-medium">
              {selectedSemester === 'all' ? 'Semua Semester' : formatSemesterLabel(Number(selectedSemester) as 1 | 2)}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredSubs.map((sub) => {
              const sem = resolveSemester(sub);
              const mapel = resolveMapel(sub);
              const relatedTask = tugasList.find((t) => t.id === sub.tugas_id);

              return (
                <div
                  key={sub.id}
                  className="p-5 sm:p-6 hover:bg-slate-50/70 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                        {mapel.nama}
                      </span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600">
                        {formatSemesterLabel(sem)}
                      </span>
                      {sub.submitted_at && (
                        <span className="text-[11px] text-slate-400">
                          Dikumpulkan: {new Date(sub.submitted_at).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-black text-slate-800 leading-snug">
                      {sub.tugas_judul || relatedTask?.judul || 'Tugas Siswa'}
                    </h4>

                    {/* Teacher Feedback / Notes */}
                    {sub.feedback ? (
                      <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 mt-2 max-w-2xl">
                        <span className="font-extrabold text-emerald-800 block mb-0.5">
                          Masukan & Apresiasi Guru:
                        </span>
                        <p className="italic">"{sub.feedback}"</p>
                      </div>
                    ) : (
                      <p className="text-xs text-amber-600 font-medium italic mt-1">
                        ⏳ Tugas telah dikumpulkan dan nilai otomatis masuk. Menunggu persetujuan (approve) resmi guru.
                      </p>
                    )}
                  </div>

                  {/* Score & Action Button */}
                  <div className="flex items-center gap-4 shrink-0 self-end md:self-center">
                    {sub.nilai !== null && sub.nilai !== undefined ? (
                      <div className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-2xl font-black text-blue-600">{sub.nilai}</span>
                          <span className="text-xs font-bold text-slate-400">/100</span>
                        </div>
                        <div className="flex items-center justify-end gap-1 text-xs font-bold text-amber-500">
                          {sub.bintang && (
                            <>
                              <span>{sub.bintang}</span>
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            </>
                          )}
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 ml-1">
                            {sub.kategori_nilai || 'Tercapai'}
                          </span>
                        </div>
                        <div className="mt-1">
                          {sub.status === 'sudah_dinilai' || sub.is_approved ? (
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Disetujui Guru ✓
                            </span>
                          ) : (
                            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              Nilai Otomatis (Menunggu Approve)
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="text-xs font-bold px-3 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                          Terkumpul
                        </span>
                        <p className="text-[10px] text-slate-400 mt-1">Menunggu Nilai</p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenTaskReview(relatedTask || {
                        id: sub.tugas_id,
                        rombel_id: user.rombel_id || '',
                        mapel_id: sub.mapel_id || '',
                        guru_id: '',
                        judul: sub.tugas_judul || 'Tugas Siswa',
                        instruksi: '',
                        deadline: '',
                        nilai_maksimal: 100,
                        tipe_pengumpulan: 'in_app',
                        is_ai_generated: false,
                        created_at: sub.created_at || new Date().toISOString(),
                      }, sub)}
                      className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer border border-blue-200 shadow-2xs"
                      title="Buka riwayat pengerjaan dan kunci pembahasan soal tugas ini"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-600" />
                      <span>Riwayat Pengerjaan</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
