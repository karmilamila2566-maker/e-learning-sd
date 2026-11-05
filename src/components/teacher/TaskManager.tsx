import React, { useState } from 'react';
import { FileCheck, Plus, Sparkles, Trash2, Clock, Calendar, Check, X, Search, Eye } from 'lucide-react';
import { Tugas, Rombel, MataPelajaran } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { localDB } from '../../lib/supabase';
import { AITaskGeneratorModal } from './AITaskGeneratorModal';
import { useRealtimeSubscription } from '../../hooks/useRealtimeData';

interface TaskManagerProps {
  rombels: Rombel[];
  mapels: MataPelajaran[];
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  rombels,
  mapels,
  onShowToast,
}) => {
  const { user } = useAuth();
  const [tugasList, setTugasList] = useState<Tugas[]>(localDB.getTugas());
  const [selectedRombelId, setSelectedRombelId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedTaskQuestions, setSelectedTaskQuestions] = useState<Tugas | null>(null);

  const loadData = () => {
    setTugasList(localDB.getTugas());
  };

  useRealtimeSubscription({
    table: 'tugas',
    onChange: () => loadData(),
  });

  if (!user) return null;

  const handleDelete = (id: string) => {
    if (confirm('Bapak/Ibu yakin ingin menghapus tugas ini? Seluruh data kuis dan pengumpulan siswa akan ikut terhapus.')) {
      const all = localDB.getTugas();
      const updated = all.filter((t) => t.id !== id);
      localDB.saveTugas(updated);
      loadData();
      onShowToast('Tugas berhasil dihapus.', 'info');
    }
  };

  const allowedRombelIds = new Set(rombels.map((r) => r.id));

  const filteredTugas = tugasList.filter((t) => {
    if (user.role === 'GURU' && !allowedRombelIds.has(t.rombel_id)) {
      return false;
    }
    const matchRombel = selectedRombelId === 'all' || t.rombel_id === selectedRombelId;
    const matchSearch =
      t.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.instruksi.toLowerCase().includes(searchQuery.toLowerCase());
    return matchRombel && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Bar with Filter & AI Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedRombelId}
            onChange={(e) => setSelectedRombelId(e.target.value)}
            className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">Semua Kelas Rombel</option>
            {rombels.map((r) => (
              <option key={r.id} value={r.id}>
                Kelas {r.nama} ({r.fase})
              </option>
            ))}
          </select>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari tugas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* AI Generator Action Button */}
        <button
          onClick={() => setIsAIModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Buat Tugas Baru dengan AI</span>
        </button>
      </div>

      {/* Task Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTugas.map((t) => (
          <div
            key={t.id}
            className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                  {t.rombel_nama}
                </span>
                {t.is_ai_generated && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    AI Generated
                  </span>
                )}
              </div>

              <h3 className="font-extrabold text-base text-slate-800 line-clamp-2 mt-1">
                {t.judul}
              </h3>
              <p className="text-xs font-semibold text-blue-600 mt-0.5">{t.mapel_nama}</p>

              <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                {t.instruksi}
              </p>

              <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded-xl">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Tenggat:{' '}
                  {new Date(t.deadline).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setSelectedTaskQuestions(t)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Lihat Soal ({t.soal_list?.length || 0})</span>
              </button>

              <button
                onClick={() => handleDelete(t.id)}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                title="Hapus tugas"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* AI Task Generator Modal */}
      <AITaskGeneratorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        rombels={rombels}
        mapels={mapels}
        onTaskCreated={(newTask) => {
          onShowToast(`Tugas "${newTask.judul}" berhasil dibuat dan dipublikasikan!`, 'success');
          loadData();
        }}
      />

      {/* View Questions Modal */}
      {selectedTaskQuestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-blue-600">
                  {selectedTaskQuestions.mapel_nama} • {selectedTaskQuestions.rombel_nama}
                </span>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-800">
                  {selectedTaskQuestions.judul}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTaskQuestions(null)}
                className="p-2 hover:bg-slate-200/60 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {(!selectedTaskQuestions.soal_list || selectedTaskQuestions.soal_list.length === 0) ? (
                <p className="text-xs text-slate-500 italic text-center py-6">
                  Tidak ada butir soal tersimpan pada tugas ini.
                </p>
              ) : (
                selectedTaskQuestions.soal_list.map((s, idx) => (
                  <div key={s.id || idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                      <span>Soal No. {s.nomor} ({s.tipe})</span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Bobot: {s.skor_bobot} Poin
                      </span>
                    </div>

                    <p className="text-sm font-extrabold text-slate-800">{s.pertanyaan}</p>

                    {s.pilihan && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-xs">
                        {s.pilihan.map((p, optIdx) => (
                          <div
                            key={optIdx}
                            className={`p-2 rounded-xl border ${
                              p.startsWith(s.kunci_jawaban.charAt(0))
                                ? 'bg-emerald-50 border-emerald-300 font-bold text-emerald-900'
                                : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            {p}
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 text-xs text-slate-600 space-y-1">
                      <p>
                        <strong className="text-emerald-800">Kunci Jawaban:</strong> {s.kunci_jawaban}
                      </p>
                      {s.pembahasan && (
                        <p className="italic text-slate-500">
                          <strong>Pembahasan:</strong> {s.pembahasan}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedTaskQuestions(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-white font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Task Generator Modal */}
      {isAIModalOpen && (
        <AITaskGeneratorModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          rombels={rombels}
          mapels={mapels}
          onTaskCreated={(newTask) => {
            loadData();
            setIsAIModalOpen(false);
            onShowToast(`🎉 Tugas "${newTask.judul}" berhasil diterbitkan ke kelas!`, 'success');
          }}
        />
      )}
    </div>
  );
};
