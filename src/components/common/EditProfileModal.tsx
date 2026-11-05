import React, { useState, useRef } from 'react';
import {
  Palette,
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Sparkles,
  Camera,
  Trash2,
  Star,
  Layers,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  THEME_PRESETS,
  WALLPAPER_PRESETS,
  AVATAR_PRESETS,
} from '../../lib/themeHelper';
import { compressImageFile } from '../../lib/fileHelper';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (msg: string) => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, updateUserProfile } = useAuth();

  const [nama, setNama] = useState(user?.nama || '');
  const [bio, setBio] = useState(
    user?.bio || 'Rajin belajar demi masa depan gemilang!'
  );
  const [selectedTheme, setSelectedTheme] = useState<string>(
    user?.bg_theme || (user?.role === 'GURU' ? 'cyber' : user?.role === 'ADMIN' ? 'galaxy' : 'ocean')
  );
  const [customBgUrl, setCustomBgUrl] = useState<string>(user?.bg_image_url || '');
  const [avatarUrl, setAvatarUrl] = useState<string>(user?.avatar_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [activeBgTab, setActiveBgTab] = useState<'gradasi' | 'wallpaper' | 'upload'>('gradasi');

  const bgInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !user) return null;

  const handleUploadBg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress to max 1200px, 0.75 quality to prevent localStorage quota issues
      const res = await compressImageFile(file, 1200, 600, 0.75);
      setCustomBgUrl(res.dataUrl);
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah foto background.');
    }
  };

  const handleUploadAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await compressImageFile(file, 250, 250, 0.8);
      setAvatarUrl(res.dataUrl);
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah foto avatar.');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      alert('Nama tidak boleh kosong.');
      return;
    }

    setIsSaving(true);
    const result = await updateUserProfile({
      nama: nama.trim(),
      bio: bio.trim(),
      bg_theme: selectedTheme,
      bg_image_url: customBgUrl ? customBgUrl : undefined,
      avatar_url: avatarUrl || user.avatar_url,
    });
    setIsSaving(false);

    if (result.success) {
      onSuccess('Profil dan background akunmu berhasil disimpan! ✨');
      onClose();
    } else {
      alert(result.error || 'Gagal menyimpan perubahan profil.');
    }
  };

  const currentPreset = THEME_PRESETS[selectedTheme] || THEME_PRESETS.ocean;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-inner">
              <Palette className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl">
                Edit Profil & Background Akun
              </h3>
              <p className="text-xs text-blue-100">
                Pilih warna gradasi, wallpaper foto kustom, avatar, dan motto belajar akunmu
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-full text-white/80 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Live Preview Banner */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-wider">
                Pratinjau Banner Akunmu:
              </label>
              {customBgUrl && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  Menggunakan Foto / Wallpaper
                </span>
              )}
            </div>

            <div
              className={`rounded-3xl p-5 text-white shadow-md relative overflow-hidden transition-all duration-300 ${
                customBgUrl ? '' : currentPreset.bannerClass
              }`}
              style={
                customBgUrl
                  ? {
                      backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.78)), url(${customBgUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : {}
              }
            >
              <div className="relative z-10 flex items-center gap-4">
                <img
                  src={avatarUrl || user.avatar_url}
                  alt={nama}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/20 p-1 border-2 border-white/60 shadow-md object-cover shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md uppercase tracking-wide">
                      {user.role === 'SISWA'
                        ? user.rombel_nama || `Kelas ${user.tingkat_kelas}`
                        : user.role === 'GURU'
                        ? 'Guru Pendidik'
                        : 'Administrator'}
                    </span>
                    {user.role === 'SISWA' && (
                      <span className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-300" />
                        {user.total_bintang || 0} Bintang
                      </span>
                    )}
                  </div>
                  <h4 className="text-base sm:text-lg font-black truncate mt-1">
                    {nama || user.nama}
                  </h4>
                  <p className="text-xs text-blue-100 italic truncate mt-0.5">
                    "{bio || 'Rajin belajar demi masa depan!'}"
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Pengaturan Background Akun */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-blue-600" />
                <span>Pilih Gaya Latar (Background) Akun</span>
              </label>

              {customBgUrl && (
                <button
                  type="button"
                  onClick={() => setCustomBgUrl('')}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 rounded-xl transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Kembali ke Gradasi</span>
                </button>
              )}
            </div>

            {/* Sub-tabs for Background Options */}
            <div className="flex p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveBgTab('gradasi')}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                  activeBgTab === 'gradasi'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Warna Gradasi</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveBgTab('wallpaper')}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                  activeBgTab === 'wallpaper'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Wallpaper Pilihan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveBgTab('upload')}
                className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition flex items-center justify-center gap-1.5 ${
                  activeBgTab === 'upload'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Foto Sendiri</span>
              </button>
            </div>

            {/* Sub-tab 1: Tema Warna Gradasi */}
            {activeBgTab === 'gradasi' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-1">
                {Object.values(THEME_PRESETS).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setSelectedTheme(t.id);
                      setCustomBgUrl(''); // switch back to gradient theme
                    }}
                    className={`p-2 rounded-2xl border-2 text-left transition flex flex-col justify-between h-20 cursor-pointer ${
                      selectedTheme === t.id && !customBgUrl
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div
                      className={`w-full h-7 rounded-xl bg-gradient-to-r ${t.previewGradient} shadow-inner`}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-[11px] font-bold text-slate-800 truncate">
                        {t.nama.split(' ')[0]} {t.nama.split(' ')[1] || ''}
                      </span>
                      {selectedTheme === t.id && !customBgUrl && (
                        <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Sub-tab 2: Wallpaper Pilihan */}
            {activeBgTab === 'wallpaper' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                {WALLPAPER_PRESETS.map((wp) => (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => setCustomBgUrl(wp.url)}
                    className={`p-2 rounded-2xl border-2 text-left transition flex flex-col gap-1.5 cursor-pointer ${
                      customBgUrl === wp.url
                        ? 'border-blue-600 bg-blue-50 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-full h-16 rounded-xl overflow-hidden relative">
                      <img
                        src={wp.url}
                        alt={wp.nama}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-black/60 text-[9px] font-bold text-white backdrop-blur-xs">
                        {wp.kategori}
                      </span>
                      {customBgUrl === wp.url && (
                        <div className="absolute inset-0 bg-blue-600/30 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                            <Check className="w-4 h-4" />
                          </div>
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-bold text-slate-800 truncate">
                      {wp.nama}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Sub-tab 3: Upload Foto Sendiri */}
            {activeBgTab === 'upload' && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 pt-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    Gunakan Foto Favorit dari Perangkatmu
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Unggah wallpaper sendiri seperti foto ruang kelas, foto pemandangan, gambar kartun, atau foto bersama teman.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <input
                    ref={bgInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUploadBg}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => bgInputRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl bg-white border border-slate-300 hover:border-blue-500 text-xs font-bold text-slate-700 hover:text-blue-600 transition flex items-center gap-2 shadow-2xs cursor-pointer"
                  >
                    <Upload className="w-4 h-4 text-blue-600" />
                    <span>{customBgUrl ? 'Ganti Foto Wallpaper' : 'Pilih Foto dari Perangkat'}</span>
                  </button>

                  {customBgUrl && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                        <Check className="w-4 h-4" /> Foto Aktif Digunakan
                      </span>
                      <button
                        type="button"
                        onClick={() => setCustomBgUrl('')}
                        className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                      >
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section: Ganti Avatar Karakter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-600" />
                <span>Pilih Avatar Karakter Akun</span>
              </label>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadAvatar}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Upload Foto Pribadi</span>
              </button>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {AVATAR_PRESETS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setAvatarUrl(av.url)}
                  className={`p-1.5 rounded-2xl border-2 transition flex flex-col items-center gap-1 cursor-pointer ${
                    avatarUrl === av.url
                      ? 'border-blue-600 bg-blue-50 shadow-sm'
                      : 'border-slate-200 hover:border-blue-300 bg-white'
                  }`}
                  title={av.nama}
                >
                  <img
                    src={av.url}
                    alt={av.nama}
                    className="w-10 h-10 rounded-xl object-cover bg-slate-100"
                  />
                  <span className="text-[9px] font-bold text-slate-600 truncate max-w-full">
                    {av.nama.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section: Edit Nama & Moto Belajar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Tampilan
              </label>
              <input
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm font-semibold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Moto / Catatan Profil
              </label>
              <input
                type="text"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Contoh: Belajar dengan tekun dan gembira!"
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-sm"
              />
            </div>
          </div>

          {/* Footer Save Button */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl border border-slate-200 font-bold text-xs sm:text-sm text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm transition flex items-center gap-2 shadow-lg shadow-blue-500/25 disabled:opacity-50 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Profil & Background'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
