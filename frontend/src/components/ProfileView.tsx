import React, { useState } from 'react';
import { getProjectUnitCount, type UserProfile, type Project } from '../types';
import {
  User,
  UserX,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Award,
  Bell,
  Edit3,
  TrendingUp,
  LayoutGrid,
  Eye,
  Shield,
  Layers,
  Save,
  Lock
} from 'lucide-react';

interface ProfileViewProps {
  profile: UserProfile;
  projects: Project[];
  followedProjects: Project[];
  allProjects?: Project[];
  onUpdateProfile?: (updated: UserProfile) => void;
  isGuest?: boolean;
  onOpenAuthModal?: () => void;
  onSelectMainTab?: (tab: any) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile: initialProfile,
  projects,
  followedProjects,
  allProjects = [],
  onUpdateProfile,
  isGuest,
  onOpenAuthModal,
  onSelectMainTab,
}) => {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'settings'>('info');

  const totalManagedBudget = projects.reduce((sum, p) => sum + (p.total_budget || 0), 0);
  const totalUnits = projects.reduce((sum, p) => sum + getProjectUnitCount(p), 0);
  const totalInspectable = allProjects.length > 0
    ? allProjects.length
    : Math.max(followedProjects.length, projects.length, 3);

  const handleSave = () => {
    setIsEditing(false);
    if (onUpdateProfile) {
      onUpdateProfile(profile);
    }
  };

  if (isGuest) {
    return (
      <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto py-4">
        {/* Guest Profile Hero Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-8 md:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center gap-6 relative z-10 text-center md:text-left">
            <div className="w-24 h-24 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-xl shadow-cyan-500/5">
              <UserX className="w-12 h-12" />
            </div>

            <div className="space-y-2 flex-1">
              <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold px-3 py-1 rounded-full">
                <Eye className="w-3.5 h-3.5" /> Misafir Modu (Salt Okunur)
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Misafir Kullanıcı Oturumu
              </h2>
              <p className="text-xs md:text-sm text-slate-400 max-w-xl">
                Platformu üyelik oluşturmadan denemektesiniz. Misafir oturumunda kişisel veya kurumsal profil bilgileri kayıt edilmez ve gösterilmez.
              </p>
            </div>
          </div>
        </div>

        {/* Guest Information & Restriction Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-amber-400 shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Profil ve Yönetici Özellikleri Kısıtlıdır</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Profil bilgilerinizi (ad, soyad, şirket unvanı, iletişim verileri) tanımlamak ve kendi şantiyelerinizi yönetmek için sisteme kayıtlı bir kullanıcı hesabı ile giriş yapmanız gerekmektedir.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">İnceleyebileceğiniz Şantiyeler</span>
              <div className="text-xl font-black text-sky-400 mt-1">{totalInspectable} Canlı Proje</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Platformda incelemeye açık aktif şantiye verileri</p>
            </div>

            <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Erişim Yetkisi</span>
              <div className="text-xl font-black text-emerald-400 mt-1">Salt Okunur (Ziyaretçi)</div>
              <p className="text-[10px] text-slate-500 mt-0.5">Şantiye imalatları sadece izlenebilir</p>
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-center gap-3 justify-end border-t border-slate-800/80">
            {onSelectMainTab && (
              <button
                onClick={() => onSelectMainTab('following')}
                className="w-full sm:w-auto px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" /> Şantiyeleri ve Projeleri İncele
              </button>
            )}
            {onOpenAuthModal && (
              <button
                onClick={onOpenAuthModal}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <User className="w-4 h-4" /> Giriş Yap / Kayıt Ol
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Profile Header Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl">
        {/* Background decorative glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
          {/* Avatar Container */}
          <div className="relative group">
            <div className="w-28 h-28 md:w-32 md:h-32 rounded-3xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-1 shadow-[0_0_30px_rgba(245,158,11,0.3)]">
              <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-amber-400 overflow-hidden">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-14 h-14" />
                )}
              </div>
            </div>
          </div>

          {/* Profile Basic Info */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
                  <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    {profile.name}
                  </h2>
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" /> Doğrulanmış Profil
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-400 flex items-center justify-center md:justify-start gap-2 mt-1">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  {profile.title} • <span className="text-slate-300">{profile.company}</span>
                </p>
              </div>
            </div>

            {/* Quick Contact & Meta Tags */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-400 pt-2 border-t border-slate-800/80">
              <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <Mail className="w-3.5 h-3.5 text-amber-400" /> {profile.email}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <Phone className="w-3.5 h-3.5 text-amber-400" /> {profile.phone}
              </span>
              <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> {profile.location}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 shadow-xl hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Yönetilen Projeler
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <LayoutGrid className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{projects.length} Proje</div>
          <p className="text-[11px] text-slate-400 mt-1">Sorumluluğunuzdaki şantiyeler</p>
        </div>

        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 shadow-xl hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Takip Edilen Projeler
            </span>
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Eye className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{followedProjects.length} Proje</div>
          <p className="text-[11px] text-slate-400 mt-1">Canlı akış takibindeki yapılar</p>
        </div>

        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 shadow-xl hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Yönetilen Portföy
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            ₺{(totalManagedBudget / 1000000).toFixed(1)}M
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Toplam inşaat bütçe hacmi</p>
        </div>

        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 shadow-xl hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Bağımsız Bölümler
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">{totalUnits} Daire & Ünite</div>
          <p className="text-[11px] text-slate-400 mt-1">Portföydeki toplam birim sayısı</p>
        </div>
      </div>

      {/* Sub Navigation Tabs inside Profile */}
      <div className="bg-slate-900/80 border border-slate-800 p-1.5 rounded-2xl flex items-center gap-2 max-w-md">
        <button
          onClick={() => setActiveSubTab('info')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeSubTab === 'info'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
            }`}
        >
          Kişisel & Şirket Bilgileri
        </button>
        <button
          onClick={() => setActiveSubTab('settings')}
          className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeSubTab === 'settings'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
            }`}
        >
          Bildirim & Güvenlik
        </button>
      </div>

      {/* Sub-Tab 1: Profile Information & Form */}
      {activeSubTab === 'info' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-amber-400" /> Profil ve İletişim Detayları
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Proje paydaşları ve şantiye ekiplerinin göreceği resmi unvan ve erişim bilgileri
              </p>
            </div>
            <div>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProfile(initialProfile);
                      setIsEditing(false);
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer"
                  >
                    İptal
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:from-amber-400 hover:to-yellow-300 px-5 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer"
                  >
                    <Save className="w-4 h-4" /> Değişiklikleri Kaydet
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" /> Profili Düzenle
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Ad Soyad
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Unvan / Görev
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={profile.title}
                onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Şirket / Organizasyon
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={profile.company}
                onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                E-Posta Adresi
              </label>
              <input
                type="email"
                disabled={!isEditing}
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Telefon Numarası
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Lokasyon / Şehir
              </label>
              <input
                type="text"
                disabled={!isEditing}
                value={profile.location}
                onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 disabled:opacity-75 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-amber-500 transition"
              />
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setProfile(initialProfile);
                  setIsEditing(false);
                }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-2xl text-xs font-bold transition cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:from-amber-400 hover:to-yellow-300 px-6 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-amber-500/25 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Değişiklikleri Kaydet
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 2: Settings & Security */}
      {activeSubTab === 'settings' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-xl">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-amber-400" /> Tercihler ve Bildirim Ayarları
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Takip ettiğiniz inşaatlar ve şantiye güncellemelerine dair bildirim kanallarını yönetin
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">E-Posta İmalat Raporları</h4>
                  <p className="text-xs text-slate-400">
                    Tamamlanan kat ve imalat aşamalarında haftalık özet e-postası al
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={profile.settings.email_notifications}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    settings: { ...profile.settings, email_notifications: e.target.checked },
                  })
                }
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Canlı Şantiye Anlık Bildirimleri</h4>
                  <p className="text-xs text-slate-400">
                    Takip ettiğiniz projelerdeki yeni fotoğraf ve harcama güncellemelerini anında bildir
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={profile.settings.site_updates_push}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    settings: { ...profile.settings, site_updates_push: e.target.checked },
                  })
                }
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between bg-slate-950 p-4 rounded-2xl border border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Genel Görünür Profil</h4>
                  <p className="text-xs text-slate-400">
                    Diğer müteahhit ve yatırımcıların profilinizi aramalarda bulabilmesine izin ver
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={profile.settings.public_profile}
                onChange={(e) =>
                  setProfile({
                    ...profile,
                    settings: { ...profile.settings, public_profile: e.target.checked },
                  })
                }
                className="w-5 h-5 accent-amber-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
