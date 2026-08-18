import React from 'react';
import type { UserRole, Project } from '../types';
import { Building2, UserCheck, Shield, Sparkles, RefreshCw, LayoutGrid } from 'lucide-react';
import { ProjectSelector } from './ProjectSelector';

interface NavbarProps {
  projects: Project[];
  activeProject: Project | null;
  onSelectProject: (project: Project) => void;
  activeRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onOpenPortfolio: () => void;
  onOpenCreateModal?: () => void;
  onSeedDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  projects,
  activeProject,
  onSelectProject,
  activeRole,
  onRoleChange,
  onOpenPortfolio,
  onOpenCreateModal,
  onSeedDemo,
}) => {
  return (
    <header className="bg-slate-950/90 backdrop-blur-2xl border-b border-slate-800/80 sticky top-0 z-50 px-4 lg:px-8 py-3 shadow-2xl">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
        {/* Brand & Title */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 shadow-[0_0_20px_rgba(245,158,11,0.5)]">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
                <Building2 className="w-5 h-5 animate-pulse" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-amber-200 tracking-tight">
                  Gölgeden Yapıya
                </h1>
                <span className="text-[9px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" /> SaaS v2.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Çoklu İnşaat & Canlı Doku Takip Platformu
              </p>
            </div>
          </div>

          {/* Quick Portfolio Button on Mobile */}
          <button
            onClick={onOpenPortfolio}
            className="md:hidden bg-slate-900 border border-slate-800 p-2 rounded-xl text-amber-400 hover:text-white"
            title="Tüm İnşaatlar Portföyü"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>

        {/* Middle Controls: Project Selector & Portfolio Button */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-center">
          <ProjectSelector
            projects={projects}
            activeProject={activeProject}
            onSelectProject={onSelectProject}
            onOpenPortfolio={onOpenPortfolio}
            onOpenCreateModal={onOpenCreateModal}
          />

          <button
            onClick={onOpenPortfolio}
            className="hidden md:flex bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-2xl text-xs font-bold transition items-center gap-2 shadow-md cursor-pointer"
            title="Tüm İnşaatları Portföy Ekranında Göster"
          >
            <LayoutGrid className="w-4 h-4 text-amber-400" />
            <span>Tüm İnşaatlar ({projects.length})</span>
          </button>
        </div>

        {/* Header Right Controls: Demo Data Seeder & Role Switcher */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          <button
            onClick={onSeedDemo}
            className="bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800/80 px-2.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md"
            title="Örnek Verileri Yenile"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">Sıfırla</span>
          </button>

          {/* Interactive Live Role Switcher */}
          <div className="bg-slate-900 border border-slate-800 p-1 rounded-2xl flex items-center shadow-lg">
            <button
              onClick={() => onRoleChange('contractor')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeRole === 'contractor'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Müteahhit</span>
            </button>

            <button
              onClick={() => onRoleChange('client')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeRole === 'client'
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Müşteri</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
