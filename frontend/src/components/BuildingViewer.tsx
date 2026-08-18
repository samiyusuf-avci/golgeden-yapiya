import React, { useState } from 'react';
import type { BuildingFloor, Unit } from '../types';
import { Building2, CheckCircle2, CircleDashed, Sparkles, Layers, Eye, Home, ChevronRight } from 'lucide-react';

interface BuildingViewerProps {
  floors: BuildingFloor[];
  onToggleFloorStage?: (floorId: string, stageId: string, isCompleted: boolean) => void;
  onToggleUnitStage?: (unitId: string, stageId: string, isCompleted: boolean) => void;
  isContractor?: boolean;
}

export const BuildingViewer: React.FC<BuildingViewerProps> = ({
  floors = [],
  onToggleFloorStage,
  onToggleUnitStage,
  isContractor = true,
}) => {
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [filterMode, setFilterMode] = useState<'all' | 'live' | 'shadow'>('all');

  const selectedFloor = floors.find((f) => f.id === selectedFloorId);

  const calculateFloorProgress = (floor: BuildingFloor): number => {
    if (!floor.stages || floor.stages.length === 0) {
      return floor.is_completed ? 100 : 0;
    }
    const completed = floor.stages.filter((s) => s.is_completed).length;
    return Math.round((completed / floor.stages.length) * 100);
  };

  const roofFloor = floors.find((f) => f.floor_number === floors.length);
  const isRoofDone = roofFloor ? (roofFloor.is_completed || calculateFloorProgress(roofFloor) === 100) : false;

  const filteredFloors = floors.filter((floor) => {
    const progress = calculateFloorProgress(floor);
    const isFullyDone = floor.is_completed || progress === 100;
    if (filterMode === 'live') return isFullyDone;
    if (filterMode === 'shadow') return !isFullyDone;
    return true;
  });

  return (
    <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      {/* Decorative Glow Background */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Metaphor Legend Filter Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-medium text-xs tracking-wider uppercase mb-1">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>MİMARİ EV / BİNA ŞABLON GÖRSELLEŞTİRİCİSİ</span>
          </div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Building2 className="w-7 h-7 text-amber-500" />
            Gölgeden Gerçeğe Mimari Canlandırma
          </h2>
        </div>

        {/* Interactive Filter Buttons */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-1 flex items-center shadow-lg text-xs gap-1">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
              filterMode === 'all'
                ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            TÜM KATLAR ({floors.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('live')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
              filterMode === 'live'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 shadow-[0_0_8px_rgba(245,158,11,1)]" />
            <span>CANLI (Tamamlanan)</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('shadow')}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-2 cursor-pointer ${
              filterMode === 'shadow'
                ? 'bg-slate-800 text-amber-400 border border-amber-500/40 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-dashed border-slate-500" />
            <span>GÖLGE (Bekleyen)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Isometric Architectural House Blueprint Visualizer */}
        <div className="lg:col-span-6 flex flex-col items-center">

          {/* Roof Architecture Graphic */}
          <div
            onClick={() => roofFloor && setSelectedFloorId(roofFloor.id)}
            className="w-full max-w-md relative mb-2 cursor-pointer group"
          >
            <div
              className={`w-full h-16 rounded-t-3xl border-t-2 border-x-2 transition-all duration-700 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-amber-400 ${
                isRoofDone
                  ? 'bg-gradient-to-b from-amber-500 via-amber-600 to-amber-950 border-amber-400 shadow-[0_-5px_25px_rgba(245,158,11,0.5)]'
                  : 'bg-slate-900/80 border-slate-800 border-dashed opacity-50'
              }`}
            >
              {/* Triangular Roof Silhouette Overlay */}
              <div className="text-xs font-black uppercase tracking-widest text-slate-100 flex items-center gap-2 z-10">
                <Home className={`w-4 h-4 ${isRoofDone ? 'text-yellow-300 animate-bounce' : 'text-slate-500'}`} />
                <span>{isRoofDone ? 'ÇATI & ÇATIKATI (CANLI)' : 'ÇATI İSKELETİ (GÖLGE)'}</span>
              </div>
              <div className="text-[10px] text-slate-300 z-10">
                {isRoofDone ? 'Su Yalıtımı & Kaplama Tamamlandı' : 'Makas & Yalıtım Bekliyor'}
              </div>
            </div>
          </div>

          {/* Floor & Apartment Units Layer Stack */}
          <div className="w-full max-w-md space-y-3 relative">
            {filteredFloors.length > 0 ? (
              filteredFloors.map((floor) => {
              const isSelected = selectedFloorId === floor.id;
              const progress = calculateFloorProgress(floor);
              const isFullyDone = floor.is_completed || progress === 100;

              return (
                <div
                  key={floor.id}
                  onClick={() => {
                    setSelectedFloorId(isSelected ? null : floor.id);
                    setSelectedUnit(null);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setSelectedFloorId(floor.id);
                    setSelectedUnit(null);
                  }}
                  className={`
                    relative cursor-pointer transition-all duration-500 transform rounded-2xl border p-4 group
                    ${
                      isSelected
                        ? 'scale-[1.02] ring-2 ring-amber-400/80 z-20 shadow-[0_0_30px_rgba(245,158,11,0.3)]'
                        : 'hover:scale-[1.01]'
                    }
                    ${
                      isFullyDone
                        ? 'bg-gradient-to-r from-amber-950/90 via-amber-900/50 to-slate-900 border-amber-500/80 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                        : 'bg-slate-900/60 opacity-60 hover:opacity-90 border-slate-800 border-dashed backdrop-blur-md'
                    }
                  `}
                >
                  {/* Left Column Window Accent Line */}
                  <div
                    className={`absolute top-0 left-0 bottom-0 w-2 rounded-l-2xl transition-all duration-500 ${
                      isFullyDone
                        ? 'bg-gradient-to-b from-amber-400 to-yellow-500 shadow-[0_0_12px_rgba(245,158,11,0.9)]'
                        : 'bg-slate-700 opacity-40'
                    }`}
                  />

                  <div className="flex items-center justify-between pl-3">
                    <div className="flex items-center gap-3">
                      {/* Floor Number Badge */}
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm transition-all duration-300 ${
                          isFullyDone
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/50'
                            : 'bg-slate-800 text-slate-400 group-hover:text-white'
                        }`}
                      >
                        {floor.floor_number}K
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-white group-hover:text-amber-300 transition-colors">
                            {floor.name}
                          </h3>
                          {isFullyDone ? (
                            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> CANLI
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700 flex items-center gap-1">
                              <CircleDashed className="w-3 h-3 animate-spin" /> GÖLGE SKELETON (%{progress})
                            </span>
                          )}
                        </div>

                        {/* Units Facade Preview Blocks */}
                        <div className="flex items-center gap-2 mt-1.5">
                          {floor.units?.map((u) => (
                            <span
                              key={u.id}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border transition-all ${
                                u.is_completed
                                  ? 'bg-amber-500/20 border-amber-400/60 text-amber-200 shadow-sm'
                                  : 'bg-slate-950/80 border-slate-800 text-slate-500'
                              }`}
                            >
                              Daire #{u.unit_number} {u.is_completed ? '✓' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar & Open Arrow */}
                    <div className="flex items-center gap-4">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs font-semibold text-white">%{progress}</div>
                        <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full transition-all duration-700 ${
                              isFullyDone ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,1)]' : 'bg-slate-600'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFloorId(isSelected ? null : floor.id);
                          setSelectedUnit(null);
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedFloorId(floor.id);
                        }}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 shadow-md'
                            : 'bg-slate-800/80 text-slate-400 group-hover:bg-slate-700 group-hover:text-white'
                        }`}
                      >
                        <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90 text-slate-950' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-2xl text-xs text-slate-400">
              Seçili filtreye uygun kat bulunamadı.
            </div>
          )}

            {/* Foundation (Temel) Base Visual */}
            <div className="w-full bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border border-amber-600/60 rounded-2xl p-4 text-center text-xs font-extrabold text-amber-300 shadow-xl flex items-center justify-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>TEMEL RADYE BETON & ZEMİN ETÜDÜ (100% CANLI DOKU)</span>
            </div>
          </div>
        </div>

        {/* Right Column: Detailed Floor & Apartment Inspection Panel */}
        <div className="lg:col-span-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 min-h-[480px] flex flex-col shadow-2xl">
          {selectedFloor ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                    Seçili Kat İnceleme & İmalat Yönetimi
                  </span>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    {selectedFloor.name}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedFloorId(null)}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition"
                >
                  Kapat
                </button>
              </div>

              {/* Floor Level Stage Toggles */}
              {selectedFloor.stages && selectedFloor.stages.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                    Katın Yapısal İmalat Aşamaları
                  </h4>
                  <div className="space-y-2">
                    {selectedFloor.stages.map((stage) => (
                      <div
                        key={stage.id}
                        className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                          stage.is_completed
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                            : 'bg-slate-800/40 border-slate-700/60 text-slate-400'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            disabled={!isContractor}
                            onClick={() =>
                              onToggleFloorStage?.(selectedFloor.id, stage.id, !stage.is_completed)
                            }
                            className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                              stage.is_completed
                                ? 'bg-amber-500 border-amber-400 text-slate-950 cursor-pointer'
                                : 'border-slate-600 bg-slate-900 hover:border-amber-400 cursor-pointer'
                            }`}
                          >
                            {stage.is_completed && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                          </button>
                          <div>
                            <div className="text-sm font-bold text-white">{stage.name}</div>
                            <div className="text-[11px] text-slate-400">
                              Ağırlık: %{stage.weight_percentage} • Tahmini Maliyet: {stage.estimated_cost.toLocaleString('tr-TR')} ₺
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                            stage.is_completed
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          {stage.is_completed ? 'Canlı / Tamamlandı' : 'Gölge / Bekliyor'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Floor Units Grid View */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                  <span>Kata Ait Daireler ({selectedFloor.units?.length || 0} Daire)</span>
                  <span className="text-[10px] text-amber-400 font-normal">
                    Tıklayarak daire aşamalarını açın
                  </span>
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  {selectedFloor.units?.map((unit) => {
                    const isUnitSelected = selectedUnit?.id === unit.id;
                    return (
                      <div
                        key={unit.id}
                        onClick={() => setSelectedUnit(isUnitSelected ? null : unit)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setSelectedUnit(isUnitSelected ? null : unit);
                        }}
                        className={`
                          p-4 rounded-xl border cursor-pointer transition-all duration-300 relative overflow-hidden group
                          ${
                            unit.is_completed
                              ? 'bg-amber-500/10 border-amber-500/50 hover:bg-amber-500/20'
                              : 'bg-slate-800/50 border-slate-700/80 opacity-70 hover:opacity-100'
                          }
                          ${isUnitSelected ? 'ring-2 ring-amber-400 shadow-lg' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold text-white text-sm group-hover:text-amber-300">
                            {unit.name}
                          </span>
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              unit.is_completed
                                ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,1)]'
                                : 'bg-slate-600'
                            }`}
                          />
                        </div>

                        <div className="text-xs text-slate-400 flex items-center justify-between mt-3">
                          <span>{unit.is_completed ? '100% Tamamlandı (Canlı)' : 'İmalat Sürecinde (Gölge)'}</span>
                          <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Unit Stage Inspector Sub-panel */}
              {selectedUnit && (
                <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 mt-4 animate-fadeIn">
                  <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
                    <h5 className="font-bold text-sm text-amber-300">{selectedUnit.name} İmalat Aşamaları</h5>
                    <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">
                      {selectedUnit.is_completed ? 'Tamamlandı' : 'Süreçte'}
                    </span>
                  </div>

                  {selectedUnit.stages && selectedUnit.stages.length > 0 ? (
                    <div className="space-y-2">
                      {selectedUnit.stages.map((st) => (
                        <div
                          key={st.id}
                          className="flex items-center justify-between text-xs p-2.5 bg-slate-900 rounded-lg border border-slate-800"
                        >
                          <div className="flex items-center gap-2">
                            <button
                              disabled={!isContractor}
                              onClick={() =>
                                onToggleUnitStage?.(selectedUnit.id, st.id, !st.is_completed)
                              }
                              className={`w-4 h-4 rounded flex items-center justify-center border ${
                                st.is_completed
                                  ? 'bg-amber-500 border-amber-400 text-slate-950 cursor-pointer'
                                  : 'border-slate-600 cursor-pointer'
                              }`}
                            >
                              {st.is_completed && <CheckCircle2 className="w-3 h-3 stroke-[3]" />}
                            </button>
                            <span className="text-white font-medium">{st.name}</span>
                          </div>
                          <span className="text-slate-400">{st.estimated_cost.toLocaleString('tr-TR')} ₺</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 italic text-center py-2">
                      Bu daire için standart ince işler aşamaları otomatik tanımlanmıştır.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="my-auto flex flex-col items-center justify-center text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-amber-400 mb-4 animate-bounce">
                <Building2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Kat Katmanını Seçin</h3>
              <p className="text-xs text-slate-400 max-w-xs">
                Binanın dikey hiyerarşisindeki herhangi bir kata tıklayarak o katın dairelerini, aşamalarını ve canlanma durumunu detaylıca inceleyin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
