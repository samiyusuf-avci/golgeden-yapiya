import { useState } from 'react';
import type { Project, BuildingFloor, Unit } from '../types';
import { syncProjectFloorSettings } from '../utils/floorUtils';
import {
  TrendingUp,
  Home,
  Tag,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronRight,
  Coins,
  BadgeCheck,
  ShoppingCart,
  Layers,
} from 'lucide-react';

interface SalesViewProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `₺${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `₺${(value / 1_000).toFixed(0)}K`;
  return `₺${value.toLocaleString('tr-TR')}`;
}

function parsePriceInput(raw: string): number {
  const cleaned = raw.replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}

function formatPriceInput(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  return parseInt(digits, 10).toLocaleString('tr-TR');
}

export function SalesView({ project: rawProject, onUpdateProject }: SalesViewProps) {
  const project = syncProjectFloorSettings(rawProject);
  const [expandedFloors, setExpandedFloors] = useState<Set<string>>(new Set());
  const [defaultPriceInput, setDefaultPriceInput] = useState<string>(
    project.default_sale_price ? project.default_sale_price.toLocaleString('tr-TR') : ''
  );
  const [unitPriceInputs, setUnitPriceInputs] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    project.floors?.forEach((f) =>
      f.units?.forEach((u) => {
        if (u.sale_price !== undefined) {
          map[u.id] = u.sale_price.toLocaleString('tr-TR');
        }
      })
    );
    return map;
  });

  // ─── Derived stats ───────────────────────────────────────────────
  const allUnits: Unit[] = [];
  project.floors?.forEach((f) => f.units?.forEach((u) => allUnits.push(u)));

  const totalUnits = allUnits.length;
  const soldUnits = allUnits.filter((u) => u.is_sold).length;
  const availableUnits = totalUnits - soldUnits;

  const effectivePrice = (unit: Unit) =>
    unit.sale_price ?? project.default_sale_price ?? 0;

  const expectedRevenue = allUnits.reduce((sum, u) => sum + effectivePrice(u), 0);
  const actualRevenue = allUnits
    .filter((u) => u.is_sold)
    .reduce((sum, u) => sum + effectivePrice(u), 0);

  // ─── Handlers ────────────────────────────────────────────────────
  const toggleSalesEnabled = () => {
    onUpdateProject({ ...project, sales_enabled: !project.sales_enabled });
  };

  const applyDefaultPrice = () => {
    const price = parsePriceInput(defaultPriceInput);
    onUpdateProject({ ...project, default_sale_price: price });
  };

  const applyUnitPrice = (unitId: string) => {
    const raw = unitPriceInputs[unitId] ?? '';
    const price = raw.trim() === '' ? undefined : parsePriceInput(raw);
    const updatedFloors = (project.floors ?? []).map((f) => ({
      ...f,
      units: f.units?.map((u) =>
        u.id === unitId ? { ...u, sale_price: price } : u
      ),
    }));
    onUpdateProject({ ...project, floors: updatedFloors });
  };

  const toggleUnitSold = (unitId: string) => {
    const updatedFloors = (project.floors ?? []).map((f) => ({
      ...f,
      units: f.units?.map((u) =>
        u.id === unitId ? { ...u, is_sold: !u.is_sold } : u
      ),
    }));
    onUpdateProject({ ...project, floors: updatedFloors });
  };

  const markAllSold = (floorId: string, sold: boolean) => {
    const updatedFloors = (project.floors ?? []).map((f) =>
      f.id === floorId
        ? { ...f, units: f.units?.map((u) => ({ ...u, is_sold: sold })) }
        : f
    );
    onUpdateProject({ ...project, floors: updatedFloors });
  };

  const toggleFloor = (floorId: string) => {
    setExpandedFloors((prev) => {
      const next = new Set(prev);
      next.has(floorId) ? next.delete(floorId) : next.add(floorId);
      return next;
    });
  };

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* ── Özet Kartları ── */}
      {project.sales_enabled && <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          {
            icon: <Home className="w-4 h-4" />,
            label: 'Toplam Mülkiyet',
            value: totalUnits,
            color: 'text-slate-300',
            bg: 'bg-slate-800/60',
            border: 'border-slate-700/50',
          },
          {
            icon: <BadgeCheck className="w-4 h-4" />,
            label: 'Satılan',
            value: soldUnits,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
          },
          {
            icon: <ShoppingCart className="w-4 h-4" />,
            label: 'Satışta',
            value: availableUnits,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/20',
          },
          {
            icon: <Coins className="w-4 h-4" />,
            label: 'Beklenen Gelir',
            value: formatCurrency(expectedRevenue),
            color: 'text-sky-400',
            bg: 'bg-sky-500/10',
            border: 'border-sky-500/20',
          },
          {
            icon: <TrendingUp className="w-4 h-4" />,
            label: 'Gerçekleşen Gelir',
            value: formatCurrency(actualRevenue),
            color: 'text-violet-400',
            bg: 'bg-violet-500/10',
            border: 'border-violet-500/20',
          },
        ].map((card, i) => (
          <div
            key={i}
            className={`${card.bg} border ${card.border} rounded-2xl p-4 flex flex-col gap-1.5`}
          >
            <div className={`flex items-center gap-2 text-xs font-semibold ${card.color}`}>
              {card.icon}
              <span>{card.label}</span>
            </div>
            <p className={`text-xl font-extrabold ${card.color} leading-tight`}>
              {card.value}
            </p>
          </div>
        ))}
      </div>}

      {/* ── Satış Kontrol Paneli ── */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-5">
        {/* Toggle */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Tag className="w-4 h-4 text-amber-400" />
              Satış Sistemi
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Bu proje için daire satışını açın veya kapatın.
            </p>
          </div>
          <button
            onClick={toggleSalesEnabled}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              project.sales_enabled
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            {project.sales_enabled ? (
              <>
                <ToggleRight className="w-4 h-4" />
                Satış Açık
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4" />
                Satış Kapalı
              </>
            )}
          </button>
        </div>

        {/* Genel Fiyat */}
        {project.sales_enabled && (() => {
          const savedFormatted = project.default_sale_price
            ? project.default_sale_price.toLocaleString('tr-TR')
            : '';
          const isDefaultDirty = defaultPriceInput !== savedFormatted;
          return (
          <div className="border-t border-slate-800 pt-4">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-2 mb-2">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              Genel (Varsayılan) Satış Fiyatı
              <span className="text-slate-500 font-normal">— tüm dairelere uygulanır</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 font-bold text-sm">₺</span>
                <input
                  type="text"
                  value={defaultPriceInput}
                  onChange={(e) => setDefaultPriceInput(formatPriceInput(e.target.value))}
                  onBlur={applyDefaultPrice}
                  onKeyDown={(e) => e.key === 'Enter' && applyDefaultPrice()}
                  placeholder="örn. 3.500.000"
                  className="w-full bg-slate-800 border border-slate-700 focus:border-amber-500/60 focus:outline-none text-white placeholder-slate-600 text-sm font-semibold rounded-xl pl-8 pr-4 py-2.5 transition"
                />
              </div>
              <button
                onClick={applyDefaultPrice}
                disabled={!isDefaultDirty}
                className={`px-4 py-2 font-bold text-xs rounded-xl transition ${
                  isDefaultDirty
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                    : 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                Uygula
              </button>
            </div>
            {project.default_sale_price ? (
              <p className="text-xs text-emerald-400 mt-1.5 font-medium">
                ✓ Genel fiyat: {formatCurrency(project.default_sale_price)}
              </p>
            ) : null}
          </div>
          );
        })()}
      </div>

      {/* ── Kat & Daire Listesi ── */}
      {project.sales_enabled && (
        <div className="space-y-3">
          {(() => {
            const totalFloors = project.floors?.length || 0;
            const topFloor = project.floors?.find((f) => f.floor_number === totalFloors);
            const isTopDuplex =
              totalFloors > 1 &&
              (topFloor?.units?.some((u) => u.name.toLowerCase().includes('dubleks')) ||
                topFloor?.name.toLowerCase().includes('dubleks'));

            return (project.floors ?? [])
              .slice()
              .sort((a, b) => b.floor_number - a.floor_number)
              .map((floor: BuildingFloor) => {
                // If Kat 5 is merged into Kat 6 top duplex, skip rendering Kat 5 row separately
                if (isTopDuplex && floor.floor_number === totalFloors - 1) {
                  return null;
                }

                const isDuplexTop = isTopDuplex && floor.floor_number === totalFloors;
                const floorTitle = isDuplexTop
                  ? `Kat ${totalFloors} & Kat ${totalFloors - 1}`
                  : floor.name;

                const units = floor.units ?? [];
                const soldCount = units.filter((u) => u.is_sold).length;
                const isExpanded = expandedFloors.has(floor.id);
                const allSold = units.length > 0 && units.every((u) => u.is_sold);

                return (
                  <div
                    key={floor.id}
                    className={`bg-slate-900/80 border rounded-2xl overflow-hidden ${
                      isDuplexTop ? 'border-purple-500/40' : 'border-slate-800'
                    }`}
                  >
                    {/* Floor Header */}
                    <div
                      className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-slate-800/40 transition"
                      onClick={() => toggleFloor(floor.id)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                        <span className="text-sm font-bold text-white">{floorTitle}</span>
                        {isDuplexTop && (
                          <span className="text-[10px] font-extrabold bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-md">
                            DUBLEKS
                          </span>
                        )}
                        <span className="text-xs text-slate-400">
                          {soldCount}/{units.length} satıldı
                        </span>
                      </div>
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => markAllSold(floor.id, !allSold)}
                          className={`text-[11px] font-bold px-3 py-1 rounded-lg border transition cursor-pointer ${
                            allSold
                              ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                              : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                          }`}
                        >
                          {allSold ? 'Tümünü Açık Yap' : 'Tümünü Sat'}
                        </button>
                        <div
                          className={`text-[11px] font-bold px-3 py-1 rounded-lg ${
                            allSold
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {soldCount === units.length && units.length > 0
                            ? '✓ Tümü Satıldı'
                            : `${units.length - soldCount} Satışta`}
                        </div>
                      </div>
                    </div>

                  {/* Units */}
                  {isExpanded && (
                    <div className="border-t border-slate-800 divide-y divide-slate-800/60">
                      {units.map((unit: Unit) => {
                        const effPrice = effectivePrice(unit);
                        const hasCustomPrice = unit.sale_price !== undefined;

                        return (
                          <div
                            key={unit.id}
                            className={`flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3.5 transition ${
                              unit.is_sold ? 'bg-emerald-500/5' : 'hover:bg-slate-800/30'
                            }`}
                          >
                            {/* Daire Adı */}
                            <div className="flex items-center gap-3 min-w-[140px]">
                              <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-extrabold border ${
                                  unit.is_sold
                                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                    : 'bg-slate-800 border-slate-700 text-slate-300'
                                }`}
                              >
                                {unit.unit_number}
                              </div>
                              <span className="text-sm font-semibold text-white">{unit.name}</span>
                              {unit.is_sold && (
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-1.5 py-0.5 rounded-md">
                                  SATILDI
                                </span>
                              )}
                            </div>

                            {/* Fiyat Input */}
                            <div className="flex-1 flex items-center gap-2">
                              <div className="relative flex-1 max-w-[210px]">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500/80 font-bold text-xs">₺</span>
                                <input
                                  type="text"
                                  value={unitPriceInputs[unit.id] ?? ''}
                                  onChange={(e) =>
                                    setUnitPriceInputs((prev) => ({
                                      ...prev,
                                      [unit.id]: formatPriceInput(e.target.value),
                                    }))
                                  }
                                  onBlur={() => applyUnitPrice(unit.id)}
                                  onKeyDown={(e) => e.key === 'Enter' && applyUnitPrice(unit.id)}
                                  placeholder={
                                    project.default_sale_price
                                      ? project.default_sale_price.toLocaleString('tr-TR')
                                      : 'Özel fiyat...'
                                  }
                                  className="w-full bg-slate-800/80 border border-slate-700 focus:border-amber-500/50 focus:outline-none text-white placeholder-slate-600 text-xs font-semibold rounded-lg pl-7 pr-3 py-2 transition"
                                />
                              </div>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap ${
                                  hasCustomPrice
                                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                                    : 'bg-slate-800/60 border-slate-700/60 text-slate-500'
                                }`}
                              >
                                {hasCustomPrice ? 'Özel' : 'Genel'}
                              </span>
                              {effPrice > 0 && (
                                <span className="text-xs text-slate-400 font-medium hidden sm:block">
                                  {formatCurrency(effPrice)}
                                </span>
                              )}
                            </div>

                            {/* Satış Toggle */}
                            <button
                              onClick={() => toggleUnitSold(unit.id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer whitespace-nowrap ${
                                unit.is_sold
                                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                              }`}
                            >
                              {unit.is_sold ? (
                                <>
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Satıldı
                                </>
                              ) : (
                                <>
                                  <XCircle className="w-3.5 h-3.5" />
                                  Satışta
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* Satış kapalıyken uyarı */}
      {!project.sales_enabled && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mb-4">
            <Tag className="w-7 h-7 text-slate-500" />
          </div>
          <h3 className="text-base font-bold text-slate-300 mb-1">Satış Sistemi Kapalı</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Daire satışını yönetmek için yukarıdaki{' '}
            <strong className="text-slate-400">Satış Sistemi</strong> toggleını açın.
          </p>
        </div>
      )}
    </div>
  );
}
