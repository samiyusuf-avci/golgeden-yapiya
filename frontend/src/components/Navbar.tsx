import React from 'react';
import type { MainTab, UserProfile } from '../types';
import { Building2, Eye, User, Sparkles, Plus, LayoutGrid } from 'lucide-react';

interface NavbarProps {
  activeMainTab: MainTab;
  onSelectMainTab: (tab: MainTab) => void;
  onOpenCreateModal?: () => void;
  userProfile?: UserProfile;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeMainTab,
  onSelectMainTab,
  onOpenCreateModal,
  userProfile,
}) => {
  return (
    <header className="bg-slate-950/90 backdrop-blur-2xl border-b border-slate-800/80 sticky top-0 z-50 px-4 lg:px-8 py-3 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div
            onClick={() => onSelectMainTab('my-projects')}
            className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-all"
            title="Anasayfaya Git"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 shadow-[0_0_20px_rgba(245,158,11,0.5)] group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
                <Building2 className="w-5 h-5 animate-pulse" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-amber-200 tracking-tight group-hover:from-amber-300 group-hover:to-yellow-200 transition-colors">
                  Gölgeden Yapıya
                </h1>
                <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> Platform v3.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block group-hover:text-slate-300 transition-colors">
                Şeffaf İnşaat Takip & Dijital Şantiye Sistemi
              </p>
            </div>
          </div>

          {/* Quick Create Button on Mobile */}
          {onOpenCreateModal && (
            <button
              onClick={onOpenCreateModal}
              className="md:hidden bg-amber-500 text-slate-950 p-2 rounded-xl text-xs font-bold"
              title="Yeni Proje Ekle"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 3 Main Navigation Tabs Bar */}
        <div className="bg-slate-900/90 border border-slate-800 p-1 rounded-2xl flex items-center gap-1 shadow-lg w-full md:w-auto justify-center">
          <button
            onClick={() => onSelectMainTab('my-projects')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'my-projects'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Projelerim</span>
          </button>

          <button
            onClick={() => onSelectMainTab('following')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'following'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Takip Ettiklerim</span>
          </button>

          <button
            onClick={() => onSelectMainTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeMainTab === 'profile'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profil</span>
          </button>
        </div>

        {/* Header Right Actions: Profile Quick Access */}
        <div className="flex items-center gap-2.5 justify-end">
          <button
            onClick={() => onSelectMainTab('profile')}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-2xl text-xs font-bold transition text-slate-300 hover:text-white cursor-pointer shadow-md"
          >
            <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-black text-[10px]">
              {userProfile?.name ? userProfile.name.charAt(0) : 'S'}
            </div>
            <span>{userProfile?.name || 'Sami Yusuf'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
