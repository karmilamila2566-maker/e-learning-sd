import { UserProfile } from '../types';

export interface ThemePreset {
  id: string;
  nama: string;
  deskripsi: string;
  bannerClass: string;
  previewGradient: string;
  accentColor: string;
}

export interface WallpaperPreset {
  id: string;
  nama: string;
  kategori: string;
  url: string;
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
  ocean: {
    id: 'ocean',
    nama: 'Samudra Biru Ceria',
    deskripsi: 'Warna biru cerah khas BelajarYuk yang menenangkan dan menyegarkan pikiran.',
    bannerClass: 'bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 shadow-blue-500/20',
    previewGradient: 'from-blue-600 via-indigo-600 to-sky-500',
    accentColor: '#2563eb',
  },
  galaxy: {
    id: 'galaxy',
    nama: 'Galaksi Bintang Antariksa',
    deskripsi: 'Suasana malam penuh taburan bintang kosmik dan penjelajah ruang angkasa.',
    bannerClass: 'bg-gradient-to-r from-slate-950 via-indigo-950 to-purple-950 shadow-indigo-950/40',
    previewGradient: 'from-slate-950 via-indigo-950 to-purple-950',
    accentColor: '#6366f1',
  },
  nature: {
    id: 'nature',
    nama: 'Alam Hutan Tropis',
    deskripsi: 'Kesejukan hijau dedaunan dan flora tropis Kurikulum Merdeka.',
    bannerClass: 'bg-gradient-to-r from-emerald-700 via-teal-700 to-green-600 shadow-emerald-600/20',
    previewGradient: 'from-emerald-700 via-teal-700 to-green-600',
    accentColor: '#059669',
  },
  sunset: {
    id: 'sunset',
    nama: 'Senja Mentari Emas',
    deskripsi: 'Cahaya hangat matahari sore yang memancarkan optimisme dan semangat belajar.',
    bannerClass: 'bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 shadow-orange-500/20',
    previewGradient: 'from-amber-600 via-orange-600 to-rose-600',
    accentColor: '#ea580c',
  },
  candy: {
    id: 'candy',
    nama: 'Permen Manis Pastel',
    deskripsi: 'Warna ceria penuh imajinasi masa kecil dan kegembiraan berteman.',
    bannerClass: 'bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 shadow-pink-500/20',
    previewGradient: 'from-pink-500 via-rose-500 to-purple-600',
    accentColor: '#ec4899',
  },
  cyber: {
    id: 'cyber',
    nama: 'Ruang Kelas Modern',
    deskripsi: 'Nuansa canggih masa depan dengan aksen biru tua futuristik berkelas.',
    bannerClass: 'bg-gradient-to-r from-slate-900 via-sky-950 to-blue-900 shadow-slate-900/30',
    previewGradient: 'from-slate-900 via-sky-950 to-blue-900',
    accentColor: '#0284c7',
  },
  rainbow: {
    id: 'rainbow',
    nama: 'Pelangi Pelajar Pancasila',
    deskripsi: 'Harmoni warna-warni ceria yang melambangkan keragaman profil Pelajar Pancasila.',
    bannerClass: 'bg-gradient-to-r from-indigo-600 via-purple-600 via-pink-500 to-amber-500 shadow-purple-500/25',
    previewGradient: 'from-indigo-600 via-purple-600 via-pink-500 to-amber-500',
    accentColor: '#8b5cf6',
  },
  lavender: {
    id: 'lavender',
    nama: 'Bunga Lavender Kreatif',
    deskripsi: 'Warna ungu lembut yang memicu inspirasi, imajinasi karya, dan ketenangan.',
    bannerClass: 'bg-gradient-to-r from-purple-700 via-fuchsia-700 to-indigo-700 shadow-purple-600/20',
    previewGradient: 'from-purple-700 via-fuchsia-700 to-indigo-700',
    accentColor: '#a855f7',
  },
  sunshine: {
    id: 'sunshine',
    nama: 'Mentari Ceria Kuning',
    deskripsi: 'Pancaran sinar matahari pagi yang penuh energi riang gembira.',
    bannerClass: 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 shadow-amber-500/25',
    previewGradient: 'from-amber-500 via-orange-500 to-yellow-500',
    accentColor: '#f59e0b',
  },
  emerald: {
    id: 'emerald',
    nama: 'Zamrud Hijau Sejuk',
    deskripsi: 'Ketenangan zamrud dan warna alam terbuka yang menyejukkan pandangan.',
    bannerClass: 'bg-gradient-to-r from-teal-800 via-emerald-800 to-cyan-800 shadow-teal-700/25',
    previewGradient: 'from-teal-800 via-emerald-800 to-cyan-800',
    accentColor: '#0d9488',
  },
};

export const WALLPAPER_PRESETS: WallpaperPreset[] = [
  {
    id: 'wp-mountains',
    nama: 'Gunung & Alam Nusantara',
    kategori: 'Alam',
    url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&q=80',
  },
  {
    id: 'wp-classroom',
    nama: 'Ruang Kelas & Buku Ceria',
    kategori: 'Sekolah',
    url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=1200&q=80',
  },
  {
    id: 'wp-library',
    nama: 'Perpustakaan Membaca',
    kategori: 'Buku',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=1200&q=80',
  },
  {
    id: 'wp-space',
    nama: 'Tata Surya & Galaksi',
    kategori: 'Sains',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1200&q=80',
  },
  {
    id: 'wp-ocean',
    nama: 'Pantai Tropis Pagi',
    kategori: 'Laut',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&q=80',
  },
  {
    id: 'wp-abstract',
    nama: 'Kreativitas Seni Lukis',
    kategori: 'Seni',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200&q=80',
  },
];

export const AVATAR_PRESETS = [
  {
    id: 'student-boy-1',
    nama: 'Siswa Ceria',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=BudiSantoso&backgroundColor=b6e3f4',
  },
  {
    id: 'student-girl-1',
    nama: 'Siswi Pintar',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=SitiAisyah&backgroundColor=ffd5dc',
  },
  {
    id: 'student-astro',
    nama: 'Penjelajah Antariksa',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Astronaut&backgroundColor=c0aede',
  },
  {
    id: 'student-robot',
    nama: 'Robot AI Cerdas',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=SmartRobot&backgroundColor=d1d4f9',
  },
  {
    id: 'student-fox',
    nama: 'Rubah Petualang',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CleverFox&backgroundColor=ffdfbf',
  },
  {
    id: 'student-owl',
    nama: 'Burung Hantu Bijak',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=WiseOwl&backgroundColor=d1f4d9',
  },
  {
    id: 'teacher-lady',
    nama: 'Ibu Guru Teladan',
    url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
  },
  {
    id: 'teacher-gentleman',
    nama: 'Bapak Guru Pembina',
    url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
];

export function getHeroBannerStyle(user?: UserProfile | null): {
  className: string;
  style: React.CSSProperties;
} {
  if (!user) {
    return {
      className: `${THEME_PRESETS.ocean.bannerClass} rounded-3xl sm:rounded-4xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden`,
      style: {},
    };
  }

  if (user.bg_image_url) {
    return {
      className:
        'rounded-3xl sm:rounded-4xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden border border-white/10',
      style: {
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.78)), url(${user.bg_image_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      },
    };
  }

  // Fallbacks by role if no theme chosen
  let defaultTheme = 'ocean';
  if (user.role === 'GURU') defaultTheme = 'cyber';
  if (user.role === 'ADMIN') defaultTheme = 'galaxy';

  const themeId = user.bg_theme || defaultTheme;
  const preset = THEME_PRESETS[themeId] || THEME_PRESETS.ocean;

  return {
    className: `${preset.bannerClass} rounded-3xl sm:rounded-4xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden`,
    style: {},
  };
}
