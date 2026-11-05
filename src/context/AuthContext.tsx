import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Role } from '../types';
import { localDB, realtimeHub } from '../lib/supabase';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  loginSiswa: (nis: string, pinPass: string) => Promise<{ success: boolean; error?: string }>;
  loginStaff: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  quickLogin: (userProfile: UserProfile) => void;
  registerUser: (
    userData: {
      nama: string;
      nis_nip: string;
      email: string;
      role: Role;
      tingkat_kelas?: number;
      rombel_id?: string;
      rombel_nama?: string;
    },
    password: string,
    autoLogin?: boolean
  ) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  updateUserPassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  onlineUsers: string[];
  refreshUser: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  useEffect(() => {
    // Check saved session
    const savedUserId = localStorage.getItem('belajaryuk_session_uid');
    if (savedUserId) {
      const profiles = localDB.getProfiles();
      const found = profiles.find((p) => p.id === savedUserId && p.aktif);
      if (found) {
        setUser(found);
      } else {
        localStorage.removeItem('belajaryuk_session_uid');
      }
    }
    setLoading(false);

    // Active simulated users from class 1 - 6
    setOnlineUsers([
      'usr-siswa-1-1',
      'usr-siswa-2-1',
      'usr-siswa-3-1',
      'usr-guru-1',
      'usr-guru-3',
      'usr-guru-5',
    ]);

    // Realtime subscription for profile changes (e.g. role update, avatar, status)
    const unsub = realtimeHub.subscribe('profiles', (payload) => {
      if (payload.new && Array.isArray(payload.new)) {
        const currentSavedId = localStorage.getItem('belajaryuk_session_uid');
        if (currentSavedId) {
          const fresh = payload.new.find((p: UserProfile) => p.id === currentSavedId);
          if (fresh) {
            setUser(fresh);
          }
        }
      }
    });

    return () => unsub();
  }, []);

  const refreshUser = () => {
    if (!user) return;
    const profiles = localDB.getProfiles();
    const updated = profiles.find((p) => p.id === user.id);
    if (updated) {
      setUser(updated);
    }
  };

  const quickLogin = (userProfile: UserProfile) => {
    setUser(userProfile);
    localStorage.setItem('belajaryuk_session_uid', userProfile.id);
  };

  const loginSiswa = async (nis: string, pinPass: string): Promise<{ success: boolean; error?: string }> => {
    const cleanNis = nis.trim();
    const profiles = localDB.getProfiles();
    const found = profiles.find(
      (p) => p.nis_nip.toLowerCase() === cleanNis.toLowerCase() && p.role === 'SISWA' && p.aktif
    );

    if (!found) {
      return {
        success: false,
        error: 'Nomor Induk Siswa (NIS) tidak ditemukan atau belum didaftarkan. Cek kembali atau daftar akun baru ya!',
      };
    }

    const savedPassKey = `belajaryuk_pwd_${found.id}`;
    const customPass = localStorage.getItem(savedPassKey);
    const firstName = found.nama.split(' ')[0].toLowerCase();
    const expectedPass = customPass || `${firstName}123`;
    const cleanPin = pinPass.trim();

    const isMatch =
      cleanPin === expectedPass ||
      cleanPin === '123456' ||
      cleanPin === found.nis_nip ||
      cleanPin === `${firstName}123`;

    if (!isMatch) {
      return {
        success: false,
        error: `Kata sandi belum tepat. Coba ketuk tombol mata di samping ya! (Tips: kata sandi bawaan adalah "${firstName}123" atau "123456")`,
      };
    }

    // Update streak if needed
    const updatedProfiles = profiles.map((p) => {
      if (p.id === found.id) {
        return { ...p, streak_hari: Math.min(30, (p.streak_hari || 1) + 1) };
      }
      return p;
    });
    localDB.saveProfiles(updatedProfiles);

    const loggedInUser = { ...found, streak_hari: (found.streak_hari || 1) + 1 };
    setUser(loggedInUser);
    localStorage.setItem('belajaryuk_session_uid', loggedInUser.id);
    return { success: true };
  };

  const loginStaff = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const profiles = localDB.getProfiles();
    const found = profiles.find(
      (p) =>
        (p.email.toLowerCase() === cleanEmail || p.nis_nip.toLowerCase() === cleanEmail) &&
        (p.role === 'GURU' || p.role === 'ADMIN') &&
        p.aktif
    );

    if (!found) {
      return {
        success: false,
        error: 'Akun Guru / Admin dengan email ini tidak ditemukan atau dinonaktifkan.',
      };
    }

    const savedPassKey = `belajaryuk_pwd_${found.id}`;
    const customPass = localStorage.getItem(savedPassKey);
    const expectedPass = customPass || (found.role === 'ADMIN' ? 'admin123' : 'guru123');
    const cleanPass = password.trim();

    if (cleanPass !== expectedPass && cleanPass !== '123456') {
      return {
        success: false,
        error: `Kata sandi salah. Kata sandi bawaan adalah "${expectedPass}" atau "123456".`,
      };
    }

    setUser(found);
    localStorage.setItem('belajaryuk_session_uid', found.id);
    return { success: true };
  };

  const registerUser = async (
    userData: {
      nama: string;
      nis_nip: string;
      email: string;
      role: Role;
      tingkat_kelas?: number;
      rombel_id?: string;
      rombel_nama?: string;
    },
    password: string,
    autoLogin: boolean = true
  ): Promise<{ success: boolean; error?: string; user?: UserProfile }> => {
    const result = localDB.registerUser(userData, password);

    if (!result.success || !result.user) {
      return { success: false, error: result.error || 'Gagal mendaftarkan akun baru.' };
    }

    if (autoLogin) {
      setUser(result.user);
      localStorage.setItem('belajaryuk_session_uid', result.user.id);
    }

    return { success: true, user: result.user };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('belajaryuk_session_uid');
  };

  const updateUserPassword = async (oldPass: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Belum login.' };

    const savedPassKey = `belajaryuk_pwd_${user.id}`;
    const currentCustomPass = localStorage.getItem(savedPassKey);
    const defaultPass =
      user.role === 'SISWA'
        ? `${user.nama.split(' ')[0].toLowerCase()}123`
        : user.role === 'ADMIN'
        ? 'admin123'
        : 'guru123';
    const activePass = currentCustomPass || defaultPass;

    if (oldPass !== activePass && oldPass !== '123456') {
      return { success: false, error: 'Kata sandi lama tidak cocok.' };
    }

    if (newPass.length < 4) {
      return { success: false, error: 'Kata sandi baru minimal 4 karakter.' };
    }

    localStorage.setItem(savedPassKey, newPass);
    return { success: true };
  };

  const updateUserProfile = async (
    updates: Partial<UserProfile>
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User tidak sedang login' };

    try {
      const allProfiles = localDB.getProfiles();
      const updatedList = allProfiles.map((p) => {
        if (p.id === user.id) {
          return {
            ...p,
            ...updates,
          };
        }
        return p;
      });

      localDB.saveProfiles(updatedList);
      const updatedUser = updatedList.find((p) => p.id === user.id) || null;
      if (updatedUser) {
        setUser(updatedUser);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Gagal memperbarui profil' };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginSiswa,
        loginStaff,
        quickLogin,
        registerUser,
        logout,
        updateUserPassword,
        updateUserProfile,
        onlineUsers,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
