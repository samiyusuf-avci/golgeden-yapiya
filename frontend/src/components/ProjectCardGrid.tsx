import React from 'react';
import { getProjectUnitCount, type Project, type UserRole } from '../types';
import {
  Building2,
  MapPin,
  TrendingUp,
  Plus,
  ArrowRight,
  Home,
  CheckCircle2,
  Lock,
  Layers,
} from 'lucide-react';

export const getProjectFloorsCount = (project: Project): number => {
  if (project.floors && project.floors.length > 0) {
    return project.floors.length;
  }
  const match = project.description?.match(/(\d+)\s*Kat/i);
  if (match && match[1]) {
    return parseInt(match[1], 10);
  }
  const units = getProjectUnitCount(project);
  if (units > 0) return Math.max(1, Math.ceil(units / 2));
  return 1;
};

export const getUnitsPerFloor = (project: Project): number => {
  if (project.floors && project.floors.length > 0) {
    const floorWithUnits = project.floors.find((f) => f.units && f.units.length > 0);
    if (floorWithUnits?.units?.length) {
      return floorWithUnits.units.length;
    }
  }
  const totalFloors = getProjectFloorsCount(project);
  const totalUnits = getProjectUnitCount(project);
  if (totalFloors > 0 && totalUnits > 0) {
    return Math.max(1, Math.round(totalUnits / totalFloors));
  }
  return 2;
};

interface ProjectCardGridProps {
  projects: Project[];
  activeProjectId: string | null;
  onSelectProject: (project: Project) => void;
  onOpenCreateModal: () => void;
  activeRole: UserRole;
}

export const ProjectCardGrid: React.FC<ProjectCardGridProps> = ({
  projects,
  activeProjectId,
  onSelectProject,
  onOpenCreateModal,
  activeRole,
}) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest">
            <Building2 className="w-4 h-4" />
            <span>
              {activeRole === 'contractor' ? 'Müteahhit İnşaat Portföyü' : 'Takip Edilen İnşaatlar'}
            </span>
          </div>
          <h2 className="text-3xl font-black text-white">
            {activeRole === 'contractor'
              ? 'Tüm Aktif ve Planlanan Şantiyeler'
              : 'Yatırım ve Daire Takip Merkezi'}
          </h2>
          <p className="text-sm text-slate-400 max-w-xl">
            {activeRole === 'contractor'
              ? 'Yönettiğiniz tüm inşaat projelerini tek ekrandan inceleyin, ilerleme oranlarını karşılaştırın ve detaylı yönetim ekranına geçin.'
              : 'Daire sahibi veya yatırımcısı olduğunuz inşaat projelerinin canlı fiziksel ilerleme durumlarını takip edin.'}
          </p>
        </div>

        {activeRole === 'contractor' && (
          <button
            onClick={onOpenCreateModal}
            className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black px-5 py-3 rounded-2xl transition shadow-xl shadow-amber-500/20 flex items-center gap-2 text-sm relative z-10 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Yeni Proje Başlat</span>
          </button>
        )}
      </div>

      {/* Projects Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => {
          const isSelected = activeProjectId === project.id;
          const isClientHidden = activeRole === 'client' && !project.show_financials_to_clients;
          const floorsCount = getProjectFloorsCount(project);
          const unitsPerFloor = getUnitsPerFloor(project);
          const totalUnits = getProjectUnitCount(project);

          return (
            <div
              key={project.id}
              onClick={() => onSelectProject(project)}
              className={`bg-slate-900/90 border rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between relative group cursor-pointer ${
                isSelected
                  ? 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.2)] bg-slate-900'
                  : 'border-slate-800 hover:border-amber-500/60 hover:bg-slate-900/80 hover:shadow-xl'
              }`}
            >
              <div>
                {/* Top Badge & Active Indicator */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-extrabold uppercase px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-amber-400 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    {project.status === 'planning' ? 'Planlama Aşamasında' : 'Aktif Şantiye'}
                  </span>

                  {isSelected ? (
                    <span className="text-[11px] bg-amber-500/20 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-amber-400" />
                      Seçili Proje
                    </span>
                  ) : (
                    <span className="text-[11px] text-slate-500 font-medium">
                      {project.visibility === 'public' ? 'Herkese Açık' : 'Davetli'}
                    </span>
                  )}
                </div>

                {/* Title & Location */}
                <div className="space-y-1 mb-4">
                  <h3 className="text-xl font-black text-white group-hover:text-amber-400 transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    {project.location}
                  </p>
                  {project.description && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}
                </div>

                {/* Progress Indicator Bar */}
                <div className="space-y-2 mb-4 bg-slate-950 p-3.5 rounded-2xl border border-slate-800/80">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-300 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                      Fiziksel İlerleme / Tamamlanma
                    </span>
                    <span className="font-extrabold text-amber-400 font-mono">
                      %{project.physical_progress.toFixed(1)}
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                      style={{ width: `${project.physical_progress}%` }}
                    />
                  </div>
                </div>

                {/* Quick Metrics (4 items) */}
                <div className="grid grid-cols-2 gap-2 mb-6 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Kat Sayısı</div>
                    <div className="font-bold text-white flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" /> {floorsCount} Kat
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Kat Başı Daire</div>
                    <div className="font-bold text-white flex items-center gap-1 mt-0.5">
                      <Layers className="w-3.5 h-3.5 text-sky-400" /> {unitsPerFloor} Daire
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Toplam Daire</div>
                    <div className="font-bold text-white flex items-center gap-1 mt-0.5">
                      <Home className="w-3.5 h-3.5 text-emerald-400" /> {totalUnits} Adet Daire
                    </div>
                  </div>

                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                    <div className="text-[10px] text-slate-400 font-semibold uppercase">Proje Bütçesi</div>
                    <div className="font-bold text-white flex items-center gap-1 mt-0.5">
                      {isClientHidden ? (
                        <span className="text-slate-400 text-[11px] flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-400" /> Gizli
                        </span>
                      ) : (
                        `${(project.total_budget / 1000000).toFixed(1)}M ₺`
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Select Action Button */}
              <button
                onClick={() => onSelectProject(project)}
                className={`w-full py-3 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                    : 'bg-slate-950 text-white border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900'
                }`}
              >
                <span>{isSelected ? 'Şu An İnceleniyor' : 'Proje Detayına Git'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

