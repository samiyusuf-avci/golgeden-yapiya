import React, { useState } from 'react';
import type { Project, Unit, Stage } from '../types';
import {
  Building2,
  CheckCircle2,
  Clock,
  Camera,
  Calendar,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface ClientViewerProps {
  project: Project;
  isClientHidden: boolean;
}

export const ClientViewer: React.FC<ClientViewerProps> = ({ project }) => {
  // Collect all units from floors
  const allUnits = project.floors?.flatMap((f) => f.units || []) || [];
  const defaultUnit = allUnits.length > 0 ? allUnits[0] : null;

  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(
    defaultUnit ? defaultUnit.id : null
  );

  const selectedUnit = allUnits.find((u) => u.id === selectedUnitId) || defaultUnit;
  const selectedFloor = project.floors?.find((f) =>
    f.units?.some((u) => u.id === selectedUnit?.id)
  );

  // Fallback stages generator for units without custom backend stages
  const getUnitStages = (unit: Unit): Stage[] => {
    if (unit.stages && unit.stages.length > 0) {
      return unit.stages;
    }
    const isDone = unit.is_completed;
    const isMidProgress = unit.unit_number <= 302;
    const isEarlyProgress = unit.unit_number <= 402;

    return [
      {
        id: `st-${unit.id}-1`,
        project_id: project.id,
        unit_id: unit.id,
        name: 'Kaba İnşaat & Taşıyıcı Duvarlar',
        category: 'labor',
        estimated_cost: 0,
        actual_cost: 0,
        weight_percentage: 20,
        is_completed: isDone || isEarlyProgress,
        order_index: 1,
      },
      {
        id: `st-${unit.id}-2`,
        project_id: project.id,
        unit_id: unit.id,
        name: 'Elektrik & Sıhhi Tesisat Altyapısı',
        category: 'subcontractor',
        estimated_cost: 0,
        actual_cost: 0,
        weight_percentage: 20,
        is_completed: isDone || isMidProgress,
        order_index: 2,
      },
      {
        id: `st-${unit.id}-3`,
        project_id: project.id,
        unit_id: unit.id,
        name: 'Alçı Sıva & Duvar Kaplamaları',
        category: 'labor',
        estimated_cost: 0,
        actual_cost: 0,
        weight_percentage: 20,
        is_completed: isDone || unit.unit_number === 201 || unit.unit_number === 202,
        order_index: 3,
      },
      {
        id: `st-${unit.id}-4`,
        project_id: project.id,
        unit_id: unit.id,
        name: 'Pencere Doğrama & Cam Isı Yalıtımı',
        category: 'material',
        estimated_cost: 0,
        actual_cost: 0,
        weight_percentage: 20,
        is_completed: isDone || unit.unit_number === 101 || unit.unit_number === 102,
        order_index: 4,
      },
      {
        id: `st-${unit.id}-5`,
        project_id: project.id,
        unit_id: unit.id,
        name: 'Seramik, Parke & Banyo Armatürleri',
        category: 'subcontractor',
        estimated_cost: 0,
        actual_cost: 0,
        weight_percentage: 20,
        is_completed: isDone,
        order_index: 5,
      },
    ];
  };

  // Construction Site Timeline Feed
  const siteTimeline = [
    {
      id: 'update-1',
      date: '17 Ağustos 2026',
      title: '3. Kat Kolon & Betonarme Dökümü Tamamlandı',
      description: 'Üst kat taşıyıcı betonarme imalatları başarıyla döküldü. Mukavemet testleri onaylandı.',
      image: '/site_update_1.jpg',
      badge: 'Beton & Kaba İnşaat',
      isLatest: true,
    },
    {
      id: 'update-2',
      date: '12 Ağustos 2026',
      title: '2. Kat Daire İçi Elektrik ve Su Tesisat Altyapısı',
      description: 'Daire içi ana şalter panoları ve kablolama imalatları standartlara uygun olarak tamamlandı.',
      image: '/site_update_2.jpg',
      badge: 'Tesisat & İnce İşler',
      isLatest: false,
    },
  ];

  const currentUnitStages = selectedUnit ? getUnitStages(selectedUnit) : [];

  return (
    <div className="space-y-8">
      {/* 1. Header Spotlight */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>Şeffaf Müşteri Portalı</span>
            </div>
            <h2 className="text-3xl font-black text-white flex items-center gap-3">
              <Building2 className="w-8 h-8 text-amber-500" />
              {project.name}
            </h2>
            <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
              <span>📍 {project.location}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-medium">Aktif İnşaat Aşamasında</span>
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 shadow-inner">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-extrabold text-xl">
              %{project.physical_progress.toFixed(0)}
            </div>
            <div>
              <div className="text-xs font-bold text-white">Toplam İnşaat İlerlemesi</div>
              <div className="text-[11px] text-slate-400">Canlı Doku Gözetiminde</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Apartment Status & Progress Checklist */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800 mb-6">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-500" />
              Daire Bazlı İmalat Durumu
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              İncelemek istediğiniz daireyi seçerek imalat aşamalarını anlık takip edin.
            </p>
          </div>

          {/* Apartment Selector Buttons */}
          {allUnits.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
              {allUnits.map((unit) => {
                const isSelected = selectedUnit?.id === unit.id;
                return (
                  <button
                    key={unit.id}
                    onClick={() => setSelectedUnitId(unit.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                        : 'bg-slate-950 text-slate-300 border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <span>{unit.name}</span>
                    {unit.is_completed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-950" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Unit Details */}
        {selectedUnit ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Unit Info Box */}
            <div className="lg:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Seçili Daire
                </span>
                <span className="text-[11px] bg-slate-900 border border-slate-800 text-slate-300 px-2.5 py-1 rounded-full">
                  {selectedFloor ? selectedFloor.name : 'Kat Bilgisi'}
                </span>
              </div>

              <div>
                <h4 className="text-2xl font-black text-white">{selectedUnit.name}</h4>
                <p className="text-xs text-slate-400 mt-1">3+1 Lüks Rezidans Tipi Daire</p>
              </div>

              <div className="pt-3 border-t border-slate-900 space-y-2.5 text-xs text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Genel İmalat Durumu:</span>
                  <span
                    className={`font-bold flex items-center gap-1 ${
                      selectedUnit.is_completed ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {selectedUnit.is_completed ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" /> Canlı Doku (Tamamlandı)
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5" /> İmalatı Sürüyor
                      </>
                    )}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Planlanan Anahtar Teslim:</span>
                  <span className="font-semibold text-white">Q4 2026</span>
                </div>
              </div>
            </div>

            {/* Stages Checklist */}
            <div className="lg:col-span-8 space-y-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Daireye Özel Yapım Adımları ve Aşamalar
              </h5>

              {currentUnitStages.map((stage) => (
                <div
                  key={stage.id}
                  className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    stage.is_completed
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-white'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm ${
                        stage.is_completed
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {stage.is_completed ? <Check className="w-4 h-4 stroke-[3]" /> : '•'}
                    </div>
                    <div>
                      <div className="text-sm font-bold">{stage.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {stage.is_completed
                          ? 'Kalite kontrol onaylandı ve tamamlandı'
                          : 'Sırada bekliyor / İmalat devam ediyor'}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold border ${
                      stage.is_completed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {stage.is_completed ? 'Tamamlandı' : 'Devam Ediyor'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 text-sm">
            Projede kayıtlı daire bulunmamaktadır.
          </div>
        )}
      </div>

      {/* 3. Live Construction Site Updates & Photo Stream */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between pb-6 border-b border-slate-800 mb-6">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Canlı Şantiye Güncellemeleri</span>
            </div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-500" />
              Saha Fotoğrafları & İlerleme Zaman Çizelgesi
            </h3>
          </div>
          <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-xl">
            <Calendar className="w-3.5 h-3.5 text-amber-400" /> Güncel Saha Verisi
          </span>
        </div>

        {/* Stream Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {siteTimeline.map((item) => (
            <div
              key={item.id}
              className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden group hover:border-amber-500/40 transition-all duration-300 flex flex-col"
            >
              {/* Photo Header */}
              <div className="relative h-56 w-full overflow-hidden bg-slate-900">
                <img
                  src={item.image}
                  alt={item.title}
                  onError={(e) => {
                    // Fallback gradient box if image path fails
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-amber-400" />
                  {item.date}
                </div>
                {item.isLatest && (
                  <div className="absolute top-3 right-3 bg-emerald-500 text-slate-950 font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-full tracking-wider shadow-lg">
                    Son Güncelleme
                  </div>
                )}
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-md inline-block mb-2">
                    {item.badge}
                  </span>
                  <h4 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Şantiye Şefi Onaylı
                  </span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-slate-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
