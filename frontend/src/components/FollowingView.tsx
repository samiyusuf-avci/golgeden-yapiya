import React, { useState } from 'react';
import { getProjectUnitCount, type Project } from '../types';
import {
  Eye,
  EyeOff,
  MapPin,
  Search,
  Clock,
  ExternalLink,
  PlusCircle,
  Activity,
  Layers,
  Building2,
  Home,
  TrendingUp,
  CalendarCheck
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

interface FollowingViewProps {
  followedProjects: Project[];
  allProjects: Project[];
  onSelectProject: (project: Project) => void;
  onToggleFollow: (projectId: string) => void;
}

export const FollowingView: React.FC<FollowingViewProps> = ({
  followedProjects,
  allProjects,
  onSelectProject,
  onToggleFollow,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'followed' | 'discover'>('followed');

  const filteredFollowed = followedProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const discoverProjects = allProjects.filter(
    (p) =>
      !followedProjects.some((fp) => fp.id === p.id) &&
      (p.visibility === 'public' || !p.visibility) &&
      (p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-bold px-3 py-1 rounded-full mb-2">
              <Eye className="w-3.5 h-3.5" /> Canlı İzleme & Şeffaflık Modu
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Takip Ettiğim İnşaat Projeleri
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-xl">
              Yatırımcısı veya hak sahibi olduğunuz şantiyelerin canlı imalat ilerlemelerini ve fiziksel gerçekleşme oranlarını anlık olarak izleyin.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl text-center shadow-lg">
              <div className="text-2xl font-black text-sky-400">{followedProjects.length}</div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Takip Edilen</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tab Controls & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="bg-slate-900/80 border border-slate-800 p-1.5 rounded-2xl flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveSubTab('followed')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'followed'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" /> Takip Ettiklerim ({followedProjects.length})
          </button>
          <button
            onClick={() => setActiveSubTab('discover')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'discover'
                ? 'bg-sky-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" /> Yeni Şantiye Keşfet ({discoverProjects.length})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Şantiye veya ilçe ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {activeSubTab === 'followed' ? (
        filteredFollowed.length === 0 ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-4 shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 flex items-center justify-center mx-auto">
              <EyeOff className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Henüz Takip Edilen Proje Yok</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Takip listenize yeni şantiyeler eklemek için "Yeni Şantiye Keşfet" sekmesine geçebilir veya kamuya açık projeleri takibe alabilirsiniz.
            </p>
            <button
              onClick={() => setActiveSubTab('discover')}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-5 py-2.5 rounded-2xl text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer shadow-lg shadow-sky-500/20"
            >
              <PlusCircle className="w-4 h-4" /> Şantiye Keşfet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFollowed.map((project) => {
              const floorsCount = getProjectFloorsCount(project);
              const unitsPerFloor = getUnitsPerFloor(project);
              const totalUnits = getProjectUnitCount(project);

              return (
                <div
                  key={project.id}
                  onClick={() => onSelectProject(project)}
                  className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 hover:border-sky-500/50 hover:bg-slate-900 transition-all flex flex-col justify-between shadow-xl group hover:shadow-2xl cursor-pointer"
                >
                  <div>
                    {/* Card Top Meta */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-950 text-sky-400 border border-sky-500/30 px-2.5 py-1 rounded-full flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Canlı Takipte
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFollow(project.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 transition p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer"
                        title="Takipten Çıkar"
                      >
                        <EyeOff className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Title & Location */}
                    <h3 className="text-xl font-bold text-white group-hover:text-sky-300 transition line-clamp-1">
                      {project.name}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      {project.location}
                    </p>
                    {project.description && (
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {project.description}
                      </p>
                    )}

                    {/* Progress Bar */}
                    <div className="mt-5 space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-slate-300 flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-sky-400" /> Tamamlanma Oranı
                        </span>
                        <span className="text-sky-400 font-mono">%{project.physical_progress ?? 0}</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${project.physical_progress ?? 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Key Construction Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-800/80 text-xs">
                      {/* Row 1, Col 1 */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Kat Sayısı</div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-amber-400" /> {floorsCount} Kat
                        </div>
                      </div>

                      {/* Row 1, Col 2 */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Müteahhit Firma</div>
                        <div className="text-xs font-bold text-slate-200 truncate mt-0.5">
                          {project.contractor_name || '—'}
                        </div>
                      </div>

                      {/* Row 2, Col 1 */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Kat Başı Daire</div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                          <Layers className="w-3.5 h-3.5 text-sky-400" /> {unitsPerFloor} Daire
                        </div>
                      </div>

                      {/* Row 2, Col 2 */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Daire Fiyatı</div>
                        <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                          <TrendingUp className="w-3.5 h-3.5" />
                          {project.default_sale_price
                            ? project.default_sale_price >= 1_000_000
                              ? `${(project.default_sale_price / 1_000_000).toFixed(1)}M ₺`
                              : `${(project.default_sale_price / 1000).toFixed(0)}K ₺`
                            : '—'}
                        </div>
                      </div>

                      {/* Row 3, Col 1 */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Toplam Mülkiyet</div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                          <Home className="w-3.5 h-3.5 text-emerald-400" /> {totalUnits} Mülkiyet
                        </div>
                      </div>

                      {/* Row 3, Col 2 */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                        <div className="text-[10px] text-slate-400 font-semibold uppercase">Bitirme Süresi</div>
                        <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5 mt-0.5">
                          <CalendarCheck className="w-3.5 h-3.5" />
                          {project.estimated_completion_months
                            ? `${project.estimated_completion_months} Ay`
                            : '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Button */}
                  <div className="mt-6 pt-4 border-t border-slate-800/80">
                    <button
                      onClick={() => onSelectProject(project)}
                      className="w-full bg-slate-950 hover:bg-sky-500 text-sky-400 hover:text-slate-950 border border-sky-500/30 hover:border-sky-500 py-2.5 px-4 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <span>3D Bina & Saha İncele</span>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Discover Tab */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {discoverProjects.map((project) => {
            const floorsCount = getProjectFloorsCount(project);
            const unitsPerFloor = getUnitsPerFloor(project);
            const totalUnits = getProjectUnitCount(project);

            return (
              <div
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl hover:border-sky-500/40 transition-all duration-300 group cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400">
                      {project.status === 'planning' ? 'Planlama Aşaması' : 'Aktif Şantiye'}
                    </span>
                    <span className="text-xs font-mono font-bold text-sky-400">
                      %{project.physical_progress ?? 0} Tamamlandı
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-sky-300 transition">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" /> {project.location}
                  </p>
                  {project.description && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  )}

                  {/* Physical Progress Bar */}
                  <div className="mt-4 space-y-1.5 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-300 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-sky-400" /> Tamamlanma Oranı
                      </span>
                      <span className="text-sky-400 font-mono">%{project.physical_progress ?? 0}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${project.physical_progress ?? 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Construction Details Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    {/* Row 1, Col 1 */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Kat Sayısı</div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-amber-400" /> {floorsCount} Kat
                      </div>
                    </div>

                    {/* Row 1, Col 2 */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Müteahhit Firma</div>
                      <div className="text-xs font-bold text-slate-200 truncate mt-0.5">
                        {project.contractor_name || '—'}
                      </div>
                    </div>

                    {/* Row 2, Col 1 */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Kat Başı Daire</div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                        <Layers className="w-3.5 h-3.5 text-sky-400" /> {unitsPerFloor} Daire
                      </div>
                    </div>

                    {/* Row 2, Col 2 */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Daire Fiyatı</div>
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                        <TrendingUp className="w-3.5 h-3.5" />
                        {project.default_sale_price
                          ? project.default_sale_price >= 1_000_000
                            ? `${(project.default_sale_price / 1_000_000).toFixed(1)}M ₺`
                            : `${(project.default_sale_price / 1000).toFixed(0)}K ₺`
                          : '—'}
                      </div>
                    </div>

                    {/* Row 3, Col 1 */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Toplam Mülkiyet</div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5 mt-0.5">
                        <Home className="w-3.5 h-3.5 text-emerald-400" /> {totalUnits} Mülkiyet
                      </div>
                    </div>

                    {/* Row 3, Col 2 */}
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/60">
                      <div className="text-[10px] text-slate-400 font-semibold uppercase">Bitirme Süresi</div>
                      <div className="text-xs font-bold text-sky-300 flex items-center gap-1.5 mt-0.5">
                        <CalendarCheck className="w-3.5 h-3.5" />
                        {project.estimated_completion_months
                          ? `${project.estimated_completion_months} Ay`
                          : '—'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => onSelectProject(project)}
                    className="flex-1 bg-slate-950 hover:bg-sky-500 text-sky-400 hover:text-slate-950 border border-sky-500/30 hover:border-sky-500 py-2.5 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>İncele</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onToggleFollow(project.id)}
                    className="flex-1 bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold py-2.5 px-3 rounded-2xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-sky-500/20"
                  >
                    <Eye className="w-4 h-4" /> Takip Et
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

