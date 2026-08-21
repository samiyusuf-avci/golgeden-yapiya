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
  CalendarCheck,
  Timer,
  Wallet,
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

  // ---------- Süre hesabı ----------
  const hedefSureAy = project.estimated_completion_months ?? null;
  const kalanSureAy: number | null = (() => {
    if (!hedefSureAy) return null;
    const baslangic = project.created_at ? new Date(project.created_at) : null;
    if (!baslangic) return null;
    const now = new Date();
    const gecenAy =
      (now.getFullYear() - baslangic.getFullYear()) * 12 +
      (now.getMonth() - baslangic.getMonth());
    return Math.max(0, hedefSureAy - gecenAy);
  })();
  const surePct = hedefSureAy && kalanSureAy !== null
    ? Math.min(100, Math.round(((hedefSureAy - kalanSureAy) / hedefSureAy) * 100))
    : 0;
  const isDelayed = kalanSureAy === 0 && project.physical_progress < 100;

  // -------------------------------------------------------------
  // CLIENT VIEW
  // -------------------------------------------------------------
  if (isClientView) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {/* 1. Fiziki İlerleme */}
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
  // CONTRACTOR / ADMIN VIEW — 3 Kart
  // Kart 1: Fiziki İlerleme + Finansal Gerçekleşme (Birleşik)
  // Kart 2: Finansal Durum (Bütçe + Harcanan + Kalan)
  // Kart 3: Süre Yönetimi
  // -------------------------------------------------------------
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

      {/* ── Kart 1: Fiziki İlerleme + Finansal Gerçekleşme (Birleşik) ── */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/15 transition-all" />

        {/* Başlık */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Proje İlerleme Durumu</span>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
              {isClientHidden ? <Lock className="w-4 h-4 text-amber-400" /> : <Percent className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Fiziki İlerleme */}
        <div className="mb-5">
          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mb-0.5">Fiziki İlerleme</div>
              <div className="text-3xl font-extrabold text-white leading-none">
                %{project.physical_progress.toFixed(1)}
              </div>
            </div>
            <span className="text-[11px] text-amber-400 font-medium">Tamamlanan imalat</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.6)]"
              style={{ width: `${Math.min(project.physical_progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Ayırıcı */}
        <div className="border-t border-slate-800/80 mb-4" />

        {/* Finansal Gerçekleşme */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider mb-0.5">Finansal Gerçekleşme</div>
              <div className="text-3xl font-extrabold text-white leading-none">
                {isClientHidden ? '***' : `%${project.financial_progress.toFixed(1)}`}
              </div>
            </div>
            <span className="text-[11px] text-blue-400 font-medium">Harcanan / Bütçe</span>
          </div>
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-indigo-400 rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(project.financial_progress, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Kart 2: Finansal Durum (Bütçe + Fiili Harcama + Maliyet Sapması) ── */}
      <div className={`bg-slate-900/80 backdrop-blur-xl border rounded-2xl p-5 shadow-xl relative overflow-hidden group transition-all duration-300 ${
        isCostOverrun ? 'border-rose-500/40 hover:border-rose-500/70' : 'border-emerald-500/30 hover:border-emerald-500/60'
      }`}>
        <div className={`absolute top-0 right-0 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-all ${
          isCostOverrun ? 'bg-rose-500/10 group-hover:bg-rose-500/20' : 'bg-emerald-500/10 group-hover:bg-emerald-500/20'
        }`} />

        {/* Başlık */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Finansal Durum</span>
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
            isCostOverrun ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
          }`}>
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* 3 Satır: Toplam Bütçe | Fiili Harcama | Maliyet Sapması */}
        <div className="space-y-3">
          {/* Hedef Bütçe */}
          <div className="flex items-center justify-between bg-slate-950/70 rounded-xl px-3 py-2 border border-slate-800/60">
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Hedef Bütçe</span>
            </div>
            <span className="text-sm font-bold text-white font-mono">{formatMoney(project.total_budget)}</span>
          </div>

          {/* Harcanan Bütçe */}
          <div className="flex items-center justify-between bg-slate-950/70 rounded-xl px-3 py-2 border border-slate-800/60">
            <div className="flex items-center gap-1.5">
              <TrendingDown className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Harcanan Bütçe</span>
            </div>
            <span className="text-sm font-bold text-sky-300 font-mono">{formatMoney(project.total_actual_cost)}</span>
          </div>

          {/* Kalan Bütçe */}
          <div className={`flex items-center justify-between rounded-xl px-3 py-2 border ${
            isCostOverrun ? 'bg-rose-950/30 border-rose-500/20' : 'bg-emerald-950/30 border-emerald-500/20'
          }`}>
            <div className="flex items-center gap-1.5">
              {isCostOverrun
                ? <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
                : <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />}
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Kalan Bütçe</span>
            </div>
            <span className={`text-sm font-bold font-mono ${isCostOverrun ? 'text-rose-400' : 'text-emerald-400'}`}>
              {formatMoney(project.cost_variance)}
            </span>
          </div>
        </div>

        {/* Alt durum etiketi */}
        <div className={`mt-3 text-[11px] font-medium ${isCostOverrun ? 'text-rose-400' : 'text-emerald-400'}`}>
          {isCostOverrun ? '⚠️ Bütçe aşımı gerçekleşti' : '✓ Bütçe dahilinde ilerliyor'}
        </div>
      </div>

      {/* ── Kart 4: Süre Yönetimi ── */}
      <div className={`bg-slate-900/80 backdrop-blur-xl border rounded-2xl p-5 shadow-xl relative overflow-hidden group transition-all duration-300 ${
        isDelayed ? 'border-rose-500/40 hover:border-rose-500/70' : 'border-purple-500/30 hover:border-purple-500/60'
      }`}>
        <div className={`absolute top-0 right-0 w-28 h-28 rounded-full blur-2xl pointer-events-none transition-all ${
          isDelayed ? 'bg-rose-500/10 group-hover:bg-rose-500/20' : 'bg-purple-500/10 group-hover:bg-purple-500/20'
        }`} />

        {/* Başlık */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Süre Yönetimi</span>
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
            isDelayed ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : 'bg-purple-500/20 text-purple-400 border-purple-500/30'
          }`}>
            <Timer className="w-5 h-5" />
          </div>
        </div>

        {/* 3 Satır: Hedef Süre | Harcanan Süre | Kalan Süre */}
        <div className="space-y-3">
          {/* Hedef Süre */}
          <div className="flex items-center justify-between bg-slate-950/70 rounded-xl px-3 py-2 border border-slate-800/60">
            <div className="flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Hedef Süre</span>
            </div>
            <span className="text-sm font-bold text-white font-mono">
              {hedefSureAy !== null ? `${hedefSureAy} Ay` : '—'}
            </span>
          </div>

          {/* Harcanan Süre */}
          <div className="flex items-center justify-between bg-slate-950/70 rounded-xl px-3 py-2 border border-slate-800/60">
            <div className="flex items-center gap-1.5">
              <Timer className="w-3.5 h-3.5 text-sky-400" />
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Harcanan Süre</span>
            </div>
            <span className="text-sm font-bold text-sky-300 font-mono">
              {hedefSureAy !== null && kalanSureAy !== null
                ? `${hedefSureAy - kalanSureAy} Ay`
                : '—'}
            </span>
          </div>

          {/* Kalan Süre */}
          <div className={`flex items-center justify-between rounded-xl px-3 py-2 border ${
            isDelayed
              ? 'bg-rose-950/30 border-rose-500/20'
              : kalanSureAy !== null && kalanSureAy <= 3
              ? 'bg-amber-950/30 border-amber-500/20'
              : 'bg-purple-950/30 border-purple-500/20'
          }`}>
            <div className="flex items-center gap-1.5">
              <Clock className={`w-3.5 h-3.5 ${
                isDelayed ? 'text-rose-400' : kalanSureAy !== null && kalanSureAy <= 3 ? 'text-amber-400' : 'text-purple-400'
              }`} />
              <span className="text-[11px] text-slate-400 font-semibold uppercase">Kalan Süre</span>
            </div>
            <span className={`text-sm font-bold font-mono ${
              isDelayed ? 'text-rose-400' : kalanSureAy !== null && kalanSureAy <= 3 ? 'text-amber-400' : 'text-purple-300'
            }`}>
              {kalanSureAy !== null ? (isDelayed ? 'Süre Doldu' : `${kalanSureAy} Ay`) : '—'}
            </span>
          </div>
        </div>

        {/* Zaman çubuğu */}
        {hedefSureAy !== null && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] text-slate-500 mb-1">
              <span>Geçen Süre</span>
              <span>%{surePct}</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  isDelayed ? 'bg-rose-500' : surePct > 75 ? 'bg-amber-400' : 'bg-purple-500'
                }`}
                style={{ width: `${surePct}%` }}
              />
            </div>
          </div>
        )}

        <div className={`mt-3 text-[11px] font-medium ${isDelayed ? 'text-rose-400' : 'text-purple-400'}`}>
          {isDelayed ? '⚠️ Proje süre sınırını aştı' : hedefSureAy ? '✓ Takvim takibinde' : 'Süre bilgisi girilmedi'}
        </div>
      </div>

    </div>
  );
};
