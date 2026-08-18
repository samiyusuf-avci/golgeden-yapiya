import React from 'react';
import type { Project, UserRole } from '../types';
import {
  Activity,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Lock,
  Percent,
  Building2,
  Clock,
  Layers,
} from 'lucide-react';

interface MetricsGridProps {
  project: Project;
  isClientHidden: boolean;
  activeRole?: UserRole;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({ project, isClientHidden, activeRole }) => {
  const isClientView = activeRole === 'client' || isClientHidden;
  const completedFloors = project.floors?.filter((f) => f.is_completed).length || 0;
  const totalFloors = project.floors?.length || 0;

  const formatMoney = (val: number) => {
    if (isClientHidden || val === 0) return '*** ₺';
    return val.toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' ₺';
  };

  const isCostOverrun = project.cost_variance < 0;

  // -------------------------------------------------------------
  // CLIENT VIEW (Sadeleştirilmiş Müşteri KPI Kartları)
  // -------------------------------------------------------------
  if (isClientView) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* 1. Fiziki İlerleme (%) */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Binanın Fiziki İlerlemesi</span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mb-2">
            %{project.physical_progress.toFixed(1)}
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
              style={{ width: `${Math.min(project.physical_progress, 100)}%` }}
            />
          </div>
          <span className="text-[11px] text-slate-400 mt-2 block">
            Tamamlanan mimari imalat oranı
          </span>
        </div>

        {/* 2. Tamamlanan Katlar */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tamamlanan Kat Seviyesi</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white mb-1">
            {completedFloors} / {totalFloors} <span className="text-sm text-slate-400 font-normal">Kat</span>
          </div>
          <span className="text-[11px] text-emerald-400 font-medium block mt-3">
            ✓ {completedFloors} Kat Canlandı, {totalFloors - completedFloors} Kat Gölgede
          </span>
        </div>

        {/* 3. İmalat Safhası */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-blue-500/50 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mevcut İmalat Safhası</span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-lg font-bold text-white mb-1 truncate">
            {project.physical_progress >= 70
              ? 'İnce İşler & Dış Cephe'
              : project.physical_progress >= 40
              ? 'Tesisat & Bölme Duvarlar'
              : 'Kaba İnşaat & Betonarme'}
          </div>
          <span className="text-[11px] text-slate-400 block mt-3">
            Saha ekipleri aktif çalışıyor
          </span>
        </div>

        {/* 4. Planlanan Teslimat */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-purple-500/50 transition-all duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/20 transition-all" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tahmini Teslimat</span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white mb-1">
            Q4 2026
          </div>
          <span className="text-[11px] text-emerald-400 font-medium block mt-3">
            ✓ İş Takvimine Uygun İlerliyor
          </span>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // CONTRACTOR / ADMIN VIEW (Detaylı Finansal & Yönetici KPI'lar)
  // -------------------------------------------------------------
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
      {/* 1. Fiziki İlerleme (%) */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/20 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fiziki İlerleme</span>
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
        </div>
        <div className="text-3xl font-extrabold text-white mb-2">
          %{project.physical_progress.toFixed(1)}
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.8)]"
            style={{ width: `${Math.min(project.physical_progress, 100)}%` }}
          />
        </div>
        <span className="text-[11px] text-slate-400 mt-2 block">
          Tamamlanan imalat ağırlıkları oranı
        </span>
      </div>

      {/* 2. Finansal Gerçekleşme (%) */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-blue-500/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/20 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Finansal Gerçekleşme</span>
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
            {isClientHidden ? <Lock className="w-5 h-5 text-amber-400" /> : <Percent className="w-5 h-5" />}
          </div>
        </div>
        <div className="text-3xl font-extrabold text-white mb-2">
          {isClientHidden ? '***' : `%${project.financial_progress.toFixed(1)}`}
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-1000"
            style={{ width: `${Math.min(project.financial_progress, 100)}%` }}
          />
        </div>
        <span className="text-[11px] text-slate-400 mt-2 block">
          Harcanan tutarın toplam bütçeye oranı
        </span>
      </div>

      {/* 3. Toplam Fiili Harcama */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/20 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fiili Harcama</span>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-white mb-1 truncate">
          {formatMoney(project.total_actual_cost)}
        </div>
        <span className="text-[11px] text-slate-400 block mt-3">
          Hedef Bütçe: {formatMoney(project.total_budget)}
        </span>
      </div>

      {/* 4. Maliyet Sapması (Cost Variance) */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-purple-500/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none group-hover:bg-purple-500/20 transition-all" />
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Maliyet Sapması</span>
          <div
            className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
              isCostOverrun
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {isCostOverrun ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
          </div>
        </div>
        <div
          className={`text-2xl sm:text-3xl font-extrabold mb-1 truncate ${
            isCostOverrun ? 'text-rose-400' : 'text-emerald-400'
          }`}
        >
          {formatMoney(project.cost_variance)}
        </div>
        <span className="text-[11px] text-slate-400 block mt-3">
          {isCostOverrun ? '⚠️ Bütçe aşımı gerçekleşti' : '✓ Bütçe dahilinde ilerliyor'}
        </span>
      </div>
    </div>
  );
};
