import React, { useState, useEffect, useRef } from 'react';
import type { BuildingFloor, Project, Unit } from '../types';
import {
  Building2,
  CheckCircle2,
  Sparkles,
  Layers,
  Eye,
  Home,
  ChevronRight,
  Lock,
  AlertTriangle,
  SlidersHorizontal,
  Store,
  Briefcase,
  Check,
  ChevronDown,
  ArrowDownUp,
  PlusCircle,
  Trash2,
} from 'lucide-react';
import { checkFloorStageStatus, checkUnitStageStatus, checkRoofStatus } from '../utils/stageDependencies';
import { getEffectiveFloorUnits as getEffectiveFloorUnitsFromUtil } from '../utils/floorUtils';

export type FloorTypology =
  | 'residential'
  | 'commercial_shop'
  | 'business_office'
  | 'duplex'
  | 'reverse_duplex'
  | 'parking_storage'
  | 'duplex_bottom';

export interface FloorTypologyConfig {
  type: FloorTypology;
  unitCount?: number;
  customName?: string;
}

export const FLOOR_TYPOLOGY_MAP: Record<
  FloorTypology,
  {
    label: string;
    shortBadge: string;
    unitPrefix: string;
    icon: React.ElementType;
    badgeStyle: string;
    cardBorder: string;
    accentColor: string;
    bgGradient: string;
    barColor: string;
    desc: string;
  }
> = {
  commercial_shop: {
    label: 'Dükkan & Cadde Mağazası',
    shortBadge: '🏪 DÜKKAN',
    unitPrefix: 'Dükkan',
    icon: Store,
    badgeStyle: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    cardBorder: 'border-emerald-500/80',
    accentColor: 'text-emerald-400',
    bgGradient: 'from-emerald-950/90 via-emerald-900/50 to-slate-900',
    barColor: 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.8)]',
    desc: 'Cadde cepheli dükkan, ticari alan ve mağaza',
  },
  business_office: {
    label: 'Ofis Katı / İş Merkezi',
    shortBadge: '🏢 OFİS',
    unitPrefix: 'Ofis',
    icon: Briefcase,
    badgeStyle: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    cardBorder: 'border-blue-500/80',
    accentColor: 'text-blue-400',
    bgGradient: 'from-blue-950/90 via-blue-900/50 to-slate-900',
    barColor: 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.8)]',
    desc: 'Kurumsal plaza ofisi veya büro çalışma katı',
  },
  residential: {
    label: 'Konut Daire Katı',
    shortBadge: '🏠 DARE',
    unitPrefix: 'Daire',
    icon: Home,
    badgeStyle: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    cardBorder: 'border-amber-500/80',
    accentColor: 'text-amber-400',
    bgGradient: 'from-amber-950/90 via-amber-900/50 to-slate-900',
    barColor: 'bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.8)]',
    desc: 'Standart konut dairelerinden oluşan yaşam katı',
  },
  reverse_duplex: {
    label: 'Ters Dubleks Daire Katı',
    shortBadge: '🔄 TERS DUBLEKS',
    unitPrefix: 'Ters Dubleks',
    icon: ArrowDownUp,
    badgeStyle: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    cardBorder: 'border-teal-500/80',
    accentColor: 'text-teal-400',
    bgGradient: 'from-teal-950/90 via-teal-900/50 to-slate-900',
    barColor: 'bg-teal-400 shadow-[0_0_12px_rgba(45,212,191,0.8)]',
    desc: 'Zemin/bahçe seviyeli alt kata inen ters dubleks daire',
  },
  duplex: {
    label: 'Çatı Dubleks Penthouse Katı',
    shortBadge: '🏰 DUBLEKS',
    unitPrefix: 'Dubleks',
    icon: ArrowDownUp,
    badgeStyle: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    cardBorder: 'border-purple-500/80',
    accentColor: 'text-purple-400',
    bgGradient: 'from-purple-950/90 via-purple-900/50 to-slate-900',
    barColor: 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.8)]',
    desc: 'En üst kat çift katlı dubleks daire veya penthouse',
  },
  duplex_bottom: {
    label: 'Dubleks Alt Katı (Üst Kat ile Birleşik)',
    shortBadge: '🔗 DUBLEKS (ALT)',
    unitPrefix: 'Dubleks (Alt)',
    icon: ArrowDownUp,
    badgeStyle: 'bg-purple-900/50 text-purple-200 border-purple-400/60',
    cardBorder: 'border-purple-500/80',
    accentColor: 'text-purple-300',
    bgGradient: 'from-purple-950/80 via-purple-900/40 to-slate-900',
    barColor: 'bg-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.8)]',
    desc: 'En üst kat dubleks dairelerin alt yaşam katı (Birleştirilmiş)',
  },
  parking_storage: {
    label: 'Otopark / Servis & Depo',
    shortBadge: '🅿️ OTOPARK/DEPO',
    unitPrefix: 'Servis',
    icon: Layers,
    badgeStyle: 'bg-slate-700/40 text-slate-300 border-slate-600',
    cardBorder: 'border-slate-700',
    accentColor: 'text-slate-400',
    bgGradient: 'from-slate-950 via-slate-900 to-slate-950',
    barColor: 'bg-slate-500 shadow-[0_0_12px_rgba(100,116,139,0.8)]',
    desc: 'Kapalı otopark, sığınak, depo veya ortak hizmet alanı',
  },
};



// Top floor duplex merging helper
export const isFloorMergedWithTopDuplex = (
  floorNumber: number,
  totalFloors: number,
  floors: BuildingFloor[],
  typologies: Record<string, FloorTypologyConfig>
): { isMerged: boolean; topFloorNumber?: number; topUnitCount?: number } => {
  if (!floors || totalFloors < 2) return { isMerged: false };
  if (floorNumber !== totalFloors - 1) return { isMerged: false };

  const topFloor = floors.find((f) => f.floor_number === totalFloors);
  if (!topFloor) return { isMerged: false };

  const topTypo = typologies[topFloor.id]?.type;
  if (topTypo === 'duplex') {
    const topUnitCount = typologies[topFloor.id]?.unitCount ?? (topFloor.units?.length || 3);
    return { isMerged: true, topFloorNumber: totalFloors, topUnitCount };
  }

  return { isMerged: false };
};

// Floor Position Rule Engine:
// En alt kat: dükkan, ofis, daire, ters dublex
// Ara katlar: dükkan, ofis, daire
// En üst kat: dükkan, ofis, daire, dublex
export const getAvailableTypologiesForFloor = (floorNumber: number, totalFloors: number): FloorTypology[] => {
  if (totalFloors <= 1) {
    return ['residential', 'duplex', 'commercial_shop', 'business_office', 'reverse_duplex'];
  }
  if (floorNumber === 1) {
    return ['commercial_shop', 'residential', 'business_office', 'reverse_duplex'];
  }
  if (floorNumber === totalFloors) {
    return ['residential', 'duplex', 'commercial_shop', 'business_office'];
  }
  return ['residential', 'commercial_shop', 'business_office'];
};

// =========================================================================
// CUSTOM BEAUTIFIED DROPDOWN COMPONENTS (AÇILIR PENCERELER)
// =========================================================================

interface CustomTypologySelectProps {
  value: FloorTypology;
  floorNumber: number;
  totalFloors: number;
  onOpen?: () => void;
  onChange: (value: FloorTypology) => void;
}

export const CustomTypologySelect: React.FC<CustomTypologySelectProps> = ({
  value,
  floorNumber,
  totalFloors,
  onOpen,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const availableTypes = getAvailableTypologiesForFloor(floorNumber, totalFloors);
  const currentKey = availableTypes.includes(value) ? value : availableTypes[0];
  const selectedInfo = FLOOR_TYPOLOGY_MAP[currentKey] || FLOOR_TYPOLOGY_MAP['residential'];
  const SelectedIcon = selectedInfo.icon;

  // For lower floors (Kat 1 & Kat 2), pop UPWARDS so the menu is never clipped near the foundation or bottom edge
  const isBottomFloor = floorNumber <= 2;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          const nextState = !isOpen;
          setIsOpen(nextState);
          if (nextState && onOpen) {
            onOpen();
          }
        }}
        className={`w-full h-12 bg-slate-900/95 border rounded-xl px-4 text-sm text-white flex items-center justify-between transition cursor-pointer shadow-inner ${isOpen
            ? 'border-amber-400 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/10'
            : 'border-amber-500/40 hover:border-amber-400 hover:bg-slate-900'
          }`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border ${selectedInfo.badgeStyle}`}>
            <SelectedIcon className="w-4 h-4" />
          </div>
          <span className="font-bold text-amber-300 text-xs sm:text-sm text-left truncate leading-tight">{selectedInfo.label}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-amber-400 transition-transform duration-200 shrink-0 ml-1.5 ${isOpen ? 'rotate-180 text-amber-300' : ''
            }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute ${isBottomFloor ? 'bottom-full mb-2.5' : 'top-full mt-2.5'
            } left-0 right-0 w-full min-w-full sm:min-w-[300px] bg-slate-950/98 border-2 border-amber-500/60 rounded-2xl p-2 shadow-[0_15px_50px_rgba(0,0,0,0.9)] z-[100] space-y-1.5 backdrop-blur-2xl animate-fadeIn max-h-80 overflow-y-auto`}
        >
          {availableTypes.map((typeKey) => {
            const info = FLOOR_TYPOLOGY_MAP[typeKey];
            const Icon = info.icon;
            const isSelected = typeKey === currentKey;

            return (
              <button
                key={typeKey}
                type="button"
                onClick={() => {
                  onChange(typeKey);
                  setIsOpen(false);
                }}
                className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between cursor-pointer group ${isSelected
                    ? 'bg-gradient-to-r from-amber-500/25 via-amber-500/15 to-slate-900 border border-amber-400/60 text-amber-300 font-extrabold shadow-lg shadow-amber-500/10'
                    : 'text-slate-200 hover:bg-slate-800/90 hover:text-amber-300 border border-transparent'
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 transition ${isSelected
                        ? `${info.badgeStyle} shadow-md`
                        : 'bg-slate-800 border-slate-700 text-slate-400 group-hover:text-amber-300 group-hover:border-amber-500/40'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-amber-300 truncate">{info.label}</div>
                    <div className="text-[11px] text-slate-400 font-normal leading-tight mt-0.5 line-clamp-2">{info.desc}</div>
                  </div>
                </div>
                {isSelected && <Check className="w-4.5 h-4.5 text-amber-400 stroke-[3] shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface CustomUnitCountSelectProps {
  unitCount: number;
  unitPrefix: string;
  floorNumber?: number;
  onOpen?: () => void;
  onChange: (count: number) => void;
}

export const CustomUnitCountSelect: React.FC<CustomUnitCountSelectProps> = ({
  unitCount,
  unitPrefix,
  floorNumber = 1,
  onOpen,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const OPTIONS = [1, 2, 3, 4];
  const isBottomFloor = floorNumber <= 2;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          const nextState = !isOpen;
          setIsOpen(nextState);
          if (nextState && onOpen) {
            onOpen();
          }
        }}
        className={`w-full h-12 bg-slate-900/95 border rounded-xl px-4 text-sm text-white flex items-center justify-between transition cursor-pointer shadow-inner ${isOpen
            ? 'border-amber-400 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/10'
            : 'border-slate-700 hover:border-slate-600 hover:bg-slate-900'
          }`}
      >
        <span className="font-bold text-slate-200 text-xs sm:text-sm">
          {unitCount} Adet {unitPrefix}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-1.5 ${isOpen ? 'rotate-180 text-amber-400' : ''
            }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute ${isBottomFloor ? 'bottom-full mb-2.5' : 'top-full mt-2.5'
            } left-0 right-0 w-full min-w-full bg-slate-950/98 border-2 border-slate-700 rounded-2xl p-2 shadow-[0_15px_50px_rgba(0,0,0,0.9)] z-[100] space-y-1 backdrop-blur-2xl animate-fadeIn max-h-60 overflow-y-auto`}
        >
          {OPTIONS.map((num) => {
            const isSelected = num === unitCount;
            return (
              <button
                key={num}
                type="button"
                onClick={() => {
                  onChange(num);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl text-left transition flex items-center justify-between cursor-pointer ${isSelected
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-extrabold shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <span className="text-xs sm:text-sm font-semibold">
                  {num} Adet {unitPrefix}
                </span>
                {isSelected && <Check className="w-4.5 h-4.5 text-amber-400 stroke-[3] shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// =========================================================================
// MAIN BUILDING VIEWER COMPONENT
// =========================================================================

interface BuildingViewerProps {
  project?: Project;
  floors: BuildingFloor[];
  onToggleFloorStage?: (floorId: string, stageId: string, isCompleted: boolean) => void;
  onToggleUnitStage?: (unitId: string, stageId: string, isCompleted: boolean) => void;
  onUpdateProject?: (updated: Project) => void;
  isContractor?: boolean;
}

export const BuildingViewer: React.FC<BuildingViewerProps> = ({
  project,
  floors = [],
  onToggleFloorStage,
  onToggleUnitStage,
  onUpdateProject,
  isContractor = true,
}) => {
  const [selectedFloorId, setSelectedFloorId] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const storageKey = `golgeden_bina_ayarlari_${project?.id || 'default'}`;
  const roofStorageKey = `golgeden_roof_completed_${project?.id || 'default'}`;
  const settingsModeStorageKey = `golgeden_settings_mode_${project?.id || 'default'}`;

  // Settings mode toggle: defaults to false (Normal Inspection View) so page refresh stays on main view
  const [isSettingsMode, setIsSettingsMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(`golgeden_settings_mode_${project?.id || 'default'}`);
      return saved !== null ? saved === 'true' : false;
    } catch (e) {
      return false;
    }
  });

  const toggleSettingsMode = () => {
    setIsSettingsMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(settingsModeStorageKey, String(next));
      } catch (e) { }
      return next;
    });
  };

  const [floorTypologies, setFloorTypologies] = useState<Record<string, FloorTypologyConfig>>({});
  const [newUnitsPerFloor, setNewUnitsPerFloor] = useState(2);

  const [isRoofMarkedManual, setIsRoofMarkedManual] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`golgeden_roof_completed_${project?.id || 'default'}`) === 'true';
    } catch (e) {
      return false;
    }
  });

  const totalFloors = floors.length;

  useEffect(() => {
    try {
      setIsRoofMarkedManual(localStorage.getItem(roofStorageKey) === 'true');
    } catch (e) { }
  }, [project?.id]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      let map: Record<string, FloorTypologyConfig> = {};
      if (saved) {
        map = JSON.parse(saved);
      }
      let changed = false;
      floors.forEach((f) => {
        if (!map[f.id]) {
          map[f.id] = {
            type: f.floor_number === 1 ? 'commercial_shop' : f.floor_number === totalFloors ? 'duplex' : 'residential',
            unitCount: f.units?.length || newUnitsPerFloor,
          };
          changed = true;
        } else {
          // If a middle floor has duplex, normalize it to residential
          if (f.floor_number < totalFloors && map[f.id].type === 'duplex') {
            map[f.id] = {
              ...map[f.id],
              type: 'residential',
            };
            changed = true;
          }
          // If a floor above Kat 1 has reverse_duplex, normalize to residential
          if (f.floor_number > 1 && map[f.id].type === 'reverse_duplex') {
            map[f.id] = {
              ...map[f.id],
              type: 'residential',
            };
            changed = true;
          }
        }
      });
      setFloorTypologies(map);
      if (changed) {
        localStorage.setItem(storageKey, JSON.stringify(map));
      }
    } catch (e) {
      console.error('Bina ayarları yüklenemedi:', e);
    }
  }, [project?.id, floors]);

  const saveTypologies = (newMap: Record<string, FloorTypologyConfig>) => {
    setFloorTypologies(newMap);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newMap));
    } catch (e) {
      console.error('Bina ayarları kaydedilemedi:', e);
    }

    if (project && onUpdateProject) {
      let totalUnitsCount = 0;
      const topFloor = floors.find((f) => f.floor_number === totalFloors);
      const topTypoConfig = topFloor ? newMap[topFloor.id] || getFloorTypology(topFloor.id) : null;
      const topFloorTypo = topTypoConfig?.type;

      const updatedFloors = floors.map((floor) => {
        const typoConfig = newMap[floor.id] || getFloorTypology(floor.id);
        const effectiveUnits = getEffectiveFloorUnitsFromUtil(floor, typoConfig, totalFloors, project.id, topFloorTypo);
        totalUnitsCount += effectiveUnits.length;
        return {
          ...floor,
          units: effectiveUnits,
        };
      });
      onUpdateProject({
        ...project,
        floors: updatedFloors,
        unit_count: totalUnitsCount,
      });
    }
  };

  // Add a single floor above the selected floor (or at the top if none selected)
  const handleAddFloorAbove = () => {
    if (!project || !onUpdateProject) return;
    const projectId = project.id;
    const ts = Date.now();

    // Determine insertion point: above selected floor, or at top
    const selectedFloor = floors.find((f) => f.id === selectedFloorId);
    const insertAboveNum = selectedFloor ? selectedFloor.floor_number : (floors.length > 0 ? Math.max(...floors.map(f => f.floor_number)) : 0);

    const oldTopFloor = floors.find((f) => f.floor_number === floors.length);
    const wasTopDuplex = oldTopFloor && ((floorTypologies[oldTopFloor.id]?.type) === 'duplex');

    // Shift all floors above the insertion point up by 1
    const shiftedFloors = floors.map((f) => {
      if (f.floor_number > insertAboveNum) {
        const nextNum = f.floor_number + 1;
        return {
          ...f,
          floor_number: nextNum,
          name: `${nextNum}. Kat`,
          stages: f.stages?.map((s) => ({
            ...s,
            name: s.name.replace(/^\d+\.\s*Kat/i, `${nextNum}. Kat`),
          })),
        };
      }
      return f;
    });

    const newFloorNum = insertAboveNum + 1;
    const newFloorId = `floor-${newFloorNum}-${projectId}-${ts}`;
    const units = Array.from({ length: newUnitsPerFloor }, (_, uIdx) => {
      const unitNum = newFloorNum * 100 + (uIdx + 1);
      const unitId = `unit-${unitNum}-${projectId}-${ts + uIdx}`;
      return {
        id: unitId,
        floor_id: newFloorId,
        unit_number: unitNum,
        name: `Daire ${unitNum}`,
        is_completed: false,
        stages: [
          {
            id: `st-u-${unitNum}-1-${ts}`,
            project_id: projectId,
            floor_id: newFloorId,
            unit_id: unitId,
            name: 'Sıva, Şap & Seramik Kaplama',
            category: 'ince_isler',
            estimated_cost: (project.total_budget * 0.3) / Math.max(1, floors.length + 1) / Math.max(1, newUnitsPerFloor),
            actual_cost: 0,
            weight_percentage: 50,
            is_completed: false,
            order_index: 1,
          },
          {
            id: `st-u-${unitNum}-2-${ts}`,
            project_id: projectId,
            floor_id: newFloorId,
            unit_id: unitId,
            name: 'Boya, Aydınlatma & Armatür Montajı',
            category: 'ince_isler',
            estimated_cost: (project.total_budget * 0.2) / Math.max(1, floors.length + 1) / Math.max(1, newUnitsPerFloor),
            actual_cost: 0,
            weight_percentage: 50,
            is_completed: false,
            order_index: 2,
          },
        ],
      };
    });

    const newFloor = {
      id: newFloorId,
      project_id: projectId,
      floor_number: newFloorNum,
      name: `${newFloorNum}. Kat`,
      is_completed: false,
      units,
      stages: [
        {
          id: `st-f-${newFloorNum}-1-${ts}`,
          project_id: projectId,
          floor_id: newFloorId,
          name: `${newFloorNum}. Kat Kolon & Betonarme`,
          category: 'labor',
          estimated_cost: (project.total_budget * 0.3) / Math.max(1, floors.length + 1),
          actual_cost: 0,
          weight_percentage: 8,
          is_completed: false,
          order_index: 1,
        },
        {
          id: `st-f-${newFloorNum}-2-${ts}`,
          project_id: projectId,
          floor_id: newFloorId,
          name: `${newFloorNum}. Kat Tuğla Duvar Örme & Bölmeler`,
          category: 'labor',
          estimated_cost: (project.total_budget * 0.2) / Math.max(1, floors.length + 1),
          actual_cost: 0,
          weight_percentage: 6,
          is_completed: false,
          order_index: 2,
        },
      ],
    };

    const merged = [...shiftedFloors, newFloor].sort((a, b) => b.floor_number - a.floor_number);

    const newTypoMap: Record<string, FloorTypologyConfig> = { ...floorTypologies };

    // If the top floor was previously a duplex and we added a new floor at the top,
    // transfer the duplex to the new top floor and set old top floor to residential.
    if (wasTopDuplex && newFloorNum > (oldTopFloor?.floor_number || 0)) {
      if (oldTopFloor) {
        newTypoMap[oldTopFloor.id] = {
          ...newTypoMap[oldTopFloor.id],
          type: 'residential',
          unitCount: newTypoMap[oldTopFloor.id]?.unitCount || newUnitsPerFloor,
        };
      }
      newTypoMap[newFloorId] = {
        type: 'duplex',
        unitCount: floorTypologies[oldTopFloor!.id]?.unitCount || newUnitsPerFloor,
      };
    } else {
      newTypoMap[newFloorId] = {
        type: newFloorNum === 1 ? 'commercial_shop' : 'residential',
        unitCount: newUnitsPerFloor,
      };
    }

    setFloorTypologies(newTypoMap);
    try {
      localStorage.setItem(storageKey, JSON.stringify(newTypoMap));
    } catch (e) {}

    onUpdateProject({
      ...project,
      floors: merged,
      unit_count: merged.reduce((sum, f) => {
        const typo = newTypoMap[f.id] || getFloorTypology(f.id);
        return sum + (typo.unitCount ?? (f.units?.length || newUnitsPerFloor));
      }, 0),
      description: `${merged.length} Katlı İnşaat Projesi`,
    });
    setSelectedFloorId(newFloorId);
  };

  // Delete the currently selected floor
  const handleDeleteSelectedFloor = () => {
    if (!project || !onUpdateProject || !selectedFloorId) return;
    const target = floors.find((f) => f.id === selectedFloorId);
    if (!target) return;
    const deletedNum = target.floor_number;

    // Remove it and renumber the ones above
    const remaining = floors
      .filter((f) => f.id !== selectedFloorId)
      .map((f) => {
        if (f.floor_number > deletedNum) {
          const nextNum = f.floor_number - 1;
          return {
            ...f,
            floor_number: nextNum,
            name: `${nextNum}. Kat`,
            stages: f.stages?.map((s) => ({
              ...s,
              name: s.name.replace(/^\d+\.\s*Kat/i, `${nextNum}. Kat`),
            })),
          };
        }
        return f;
      })
      .sort((a, b) => b.floor_number - a.floor_number);

    const updatedTypologies = { ...floorTypologies };
    delete updatedTypologies[selectedFloorId];
    setFloorTypologies(updatedTypologies);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedTypologies));
    } catch (e) {}

    onUpdateProject({
      ...project,
      floors: remaining,
      unit_count: remaining.reduce((sum, f) => sum + (f.units?.length || 0), 0),
      description: remaining.length > 0 ? `${remaining.length} Katlı İnşaat Projesi` : 'Yeni Başlanan İnşaat Projesi',
    });
    // Auto-select: prefer the floor above (which now has floor_number === deletedNum), else the floor below (deletedNum - 1)
    const nextFloor =
      remaining.find((f) => f.floor_number === deletedNum) ??
      remaining.find((f) => f.floor_number === deletedNum - 1) ??
      remaining[0] ??
      null;
    setSelectedFloorId(nextFloor?.id ?? null);
  };

  const getFloorTypology = (floorId: string): FloorTypologyConfig => {
    const floor = floors.find((f) => f.id === floorId);
    if (floorTypologies[floorId]) {
      return floorTypologies[floorId];
    }
    return {
      type: floor?.floor_number === 1 ? 'commercial_shop' : 'residential',
      unitCount: floor?.units?.length || newUnitsPerFloor,
    };
  };

  const getEffectiveFloorUnits = (floor: BuildingFloor): Unit[] => {
    const topFloor = floors.find((f) => f.floor_number === totalFloors);
    const topTypoConfig = topFloor ? getFloorTypology(topFloor.id) : null;
    const topFloorTypo = topTypoConfig?.type;

    if (
      floor.floor_number === totalFloors - 1 &&
      totalFloors > 1 &&
      topFloorTypo === 'duplex'
    ) {
      return [];
    }

    const typoConfig = getFloorTypology(floor.id);
    const typoInfo = FLOOR_TYPOLOGY_MAP[typoConfig.type] || FLOOR_TYPOLOGY_MAP['residential'];
    const targetCount = typoConfig.unitCount ?? (floor.units?.length || newUnitsPerFloor);
    const existingUnits = floor.units || [];

    const isTopDuplexUpper = floor.floor_number === totalFloors && typoConfig.type === 'duplex' && totalFloors > 1;

    const result: Unit[] = [];
    for (let i = 1; i <= targetCount; i++) {
      const unitNum = floor.floor_number * 100 + i;
      let unitName = `${typoInfo.unitPrefix} #${unitNum}`;

      if (isTopDuplexUpper) {
        unitName = `Dubleks #${unitNum} (Kat ${totalFloors}&${totalFloors - 1})`;
      }

      if (i <= existingUnits.length) {
        result.push({
          ...existingUnits[i - 1],
          name: unitName,
          unit_number: unitNum,
        });
      } else {
        result.push({
          id: `${floor.id}-dyn-unit-${i}`,
          floor_id: floor.id,
          unit_number: unitNum,
          name: unitName,
          is_completed: false,
          stages: [
            {
              id: `${floor.id}-dyn-unit-${i}-st1`,
              project_id: project?.id || '',
              floor_id: floor.id,
              unit_id: `${floor.id}-dyn-unit-${i}`,
              name: 'Sıva, Şap & Seramik Kaplama',
              category: 'ince_isler',
              estimated_cost: 45000,
              actual_cost: 0,
              weight_percentage: 50,
              is_completed: false,
              order_index: 1,
            },
            {
              id: `${floor.id}-dyn-unit-${i}-st2`,
              project_id: project?.id || '',
              floor_id: floor.id,
              unit_id: `${floor.id}-dyn-unit-${i}`,
              name: 'Boya, Aydınlatma & Armatür Montajı',
              category: 'ince_isler',
              estimated_cost: 35000,
              actual_cost: 0,
              weight_percentage: 50,
              is_completed: false,
              order_index: 2,
            },
          ],
        });
      }
    }
    return result;
  };

  const selectedFloor = floors.find((f) => f.id === selectedFloorId);
  const selectedFloorUnits = selectedFloor ? getEffectiveFloorUnits(selectedFloor) : [];
  const selectedUnit = selectedFloorUnits.find((u) => u.id === selectedUnitId) || null;

  const calculateFloorProgress = (floor: BuildingFloor): number => {
    let totalItems = 0;
    let completedItems = 0;

    if (floor.stages && floor.stages.length > 0) {
      totalItems += floor.stages.length;
      completedItems += floor.stages.filter((s) => s.is_completed).length;
    }

    const effUnits = getEffectiveFloorUnits(floor);
    if (effUnits && effUnits.length > 0) {
      effUnits.forEach((u) => {
        if (u.stages && u.stages.length > 0) {
          totalItems += u.stages.length;
          completedItems += u.stages.filter((s) => s.is_completed).length;
        } else {
          totalItems += 1;
          if (u.is_completed) completedItems += 1;
        }
      });
    }

    if (totalItems === 0) {
      return floor.is_completed ? 100 : 0;
    }

    return Math.round((completedItems / totalItems) * 100);
  };

  const getFloorEffectiveStages = (floor: BuildingFloor) => {
    const rawStages = floor.stages || [];
    if (rawStages.length === 0) return [];
    const hasWallStage = rawStages.some(
      (s) => s.name.toLowerCase().includes('duvar') || s.name.toLowerCase().includes('bölme')
    );
    if (!hasWallStage && rawStages.length === 1) {
      const firstStage = rawStages[0];
      const wallStage = {
        id: `${firstStage.id}-duvar`,
        project_id: firstStage.project_id,
        floor_id: floor.id,
        name: `${floor.floor_number}. Kat Tuğla Duvar Örme & Bölmeler`,
        category: 'labor',
        estimated_cost: Math.round((firstStage.estimated_cost || 1000000) * 0.65),
        actual_cost: 0,
        weight_percentage: 6,
        is_completed: false,
        order_index: 2,
      };
      return [firstStage, wallStage];
    }
    return rawStages;
  };

  const renderFloorInspectionPanel = (floor: BuildingFloor) => {
    const typoInfo =
      FLOOR_TYPOLOGY_MAP[getFloorTypology(floor.id).type] || FLOOR_TYPOLOGY_MAP['residential'];
    const floorUnits = getEffectiveFloorUnits(floor);
    const effectiveFloorStages = getFloorEffectiveStages(floor);

    return (
      <div
        className="mt-5 pt-5 border-t border-slate-800/80 space-y-6 animate-fadeIn text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {toastMessage && (
          <div className="p-3 bg-rose-500/20 border border-rose-500/50 rounded-xl flex items-center justify-between text-rose-200 text-xs animate-shake">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-rose-400 font-bold hover:text-white ml-2 text-sm cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Floor Level Stage Toggles */}
        {effectiveFloorStages.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Katın Yapısal İmalat Aşamaları
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {effectiveFloorStages.map((stage) => {
                const depStatus = project
                  ? checkFloorStageStatus(project, floor.id, stage.id)
                  : { isUnlocked: true };
                const isLocked = !stage.is_completed && !depStatus.isUnlocked;

                const handleStageClick = () => {
                  if (!isContractor) return;
                  if (isLocked) {
                    setToastMessage(depStatus.reason || 'Bu aşama kilitlidir.');
                    return;
                  }
                  setToastMessage(null);
                  onToggleFloorStage?.(floor.id, stage.id, !stage.is_completed);
                };

                return (
                  <div
                    key={stage.id}
                    onClick={handleStageClick}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${isLocked
                        ? 'bg-slate-950/60 border-slate-800 text-slate-600 opacity-80 cursor-not-allowed'
                        : stage.is_completed
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 shadow-sm shadow-amber-500/10 cursor-pointer hover:border-amber-500/60'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-400 cursor-pointer hover:border-amber-500/60'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all shrink-0 ${isLocked
                            ? 'border-slate-700 bg-slate-900/50 text-slate-600 cursor-not-allowed'
                            : stage.is_completed
                              ? 'bg-amber-500 border-amber-400 text-slate-950 cursor-pointer'
                              : 'border-slate-600 bg-slate-900 hover:border-amber-400 cursor-pointer'
                          }`}
                      >
                        {stage.is_completed ? (
                          <CheckCircle2 key="chk-completed" className="w-4 h-4 stroke-[3]" />
                        ) : isLocked ? (
                          <Lock key="chk-locked" className="w-3 h-3 text-slate-500" />
                        ) : null}
                      </span>
                      <div>
                        <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                          <span>
                            {floor.floor_number === totalFloors && getFloorTypology(floor.id).type === 'duplex'
                              ? stage.name.replace(`Kat ${floor.floor_number}`, `Kat ${floor.floor_number} & Kat ${floor.floor_number - 1}`)
                              : stage.name}
                          </span>
                          {isLocked && (
                            <span className="text-[9px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1 py-0.2 rounded font-normal flex items-center gap-0.5 shrink-0">
                              <Lock className="w-2 h-2" /> Kilitli
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                          Ağırlık: %{stage.weight_percentage || 0} • Tahmini: {(stage.estimated_cost || 0).toLocaleString('tr-TR')} ₺
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1 shrink-0 ${isLocked
                          ? 'bg-slate-900 text-rose-400 border border-rose-500/30 text-[10px]'
                          : stage.is_completed
                            ? 'bg-amber-400 text-slate-950 font-black border border-yellow-200'
                            : 'bg-slate-900 text-slate-400 border border-slate-700'
                        }`}
                    >
                      {isLocked
                        ? 'Kilitli'
                        : stage.is_completed
                          ? 'Tamamlandı'
                          : 'Gölge'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Floor Units Grid View */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>
              Kata Ait {typoInfo.unitPrefix}ler ({floorUnits.length} Birim)
            </span>
            <span className="text-[10px] text-amber-400 font-normal">
              Tıklayarak birim aşamalarını açın
            </span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {floorUnits.map((unit) => {
              const isUnitSelected = selectedUnitId === unit.id;

              return (
                <div
                  key={unit.id}
                  onClick={() => setSelectedUnitId(isUnitSelected ? null : unit.id)}
                  className={`
                    p-4 rounded-xl border cursor-pointer transition-all duration-300 relative overflow-hidden group
                    ${unit.is_completed
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
                      className={`w-2.5 h-2.5 rounded-full ${unit.is_completed
                          ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,1)]'
                          : 'bg-slate-600'
                        }`}
                    />
                  </div>

                  <div className="text-xs text-slate-400 flex items-center justify-between mt-3">
                    <span>{unit.is_completed ? '100% Tamamlandı' : 'İmalat Sürecinde'}</span>
                    <Eye className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Unit Stage Inspector Sub-panel */}
        {selectedUnit && selectedUnit.floor_id === floor.id && (
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 mt-4 animate-fadeIn">
            <div className="flex justify-between items-center mb-3 border-b border-slate-800 pb-2">
              <h5 className="font-bold text-sm text-amber-300">
                {selectedUnit.name} İmalat Aşamaları
              </h5>
              <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded border border-amber-500/30">
                {selectedUnit.is_completed ? 'Tamamlandı' : 'Süreçte'}
              </span>
            </div>

            {selectedUnit?.stages && selectedUnit.stages.length > 0 ? (
              <div className="space-y-2">
                {selectedUnit.stages.map((st) => {
                  const unitDep = project
                    ? checkUnitStageStatus(project, selectedUnit.id, st.id)
                    : { isUnlocked: true };
                  const isUnitStLocked = !st.is_completed && !unitDep.isUnlocked;

                  const handleUnitStageClick = () => {
                    if (!isContractor) return;
                    if (isUnitStLocked) {
                      setToastMessage(unitDep.reason || 'Bu birim imalatı kilitlidir.');
                      return;
                    }
                    setToastMessage(null);
                    onToggleUnitStage?.(selectedUnit.id, st.id, !st.is_completed);
                  };

                  return (
                    <div
                      key={st.id}
                      onClick={handleUnitStageClick}
                      className={`flex items-center justify-between text-xs p-2.5 rounded-lg border transition-all ${isUnitStLocked
                          ? 'bg-slate-950/60 border-slate-800 text-slate-600 opacity-80 cursor-not-allowed'
                          : st.is_completed
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-200 shadow-sm shadow-amber-500/10 cursor-pointer hover:border-amber-500/60 hover:bg-slate-800/90'
                            : 'bg-slate-900 border-slate-800 text-slate-400 cursor-pointer hover:border-amber-500/60 hover:bg-slate-800/90'
                        }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${isUnitStLocked
                              ? 'border-slate-700 bg-slate-950 text-slate-600 cursor-not-allowed'
                              : st.is_completed
                                ? 'bg-amber-500 border-amber-400 text-slate-950 cursor-pointer'
                                : 'border-slate-600 cursor-pointer'
                            }`}
                        >
                          {st.is_completed ? (
                            <CheckCircle2 key="uchk-completed" className="w-3 h-3 stroke-[3]" />
                          ) : isUnitStLocked ? (
                            <Lock key="uchk-locked" className="w-2.5 h-2.5 text-slate-500" />
                          ) : null}
                        </span>
                        <span className="text-white font-medium flex items-center gap-1.5">
                          <span>{st.name}</span>
                          {isUnitStLocked && (
                            <span className="text-[9px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1 py-0.2 rounded flex items-center gap-0.5">
                              <Lock className="w-2 h-2" /> Kilitli
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="text-slate-400">{(st.estimated_cost || 0).toLocaleString('tr-TR')} ₺</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic text-center py-2">
                Bu birim için standart ince işler aşamaları otomatik tanımlanmıştır.
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const roofDep = project ? checkRoofStatus(project) : { isUnlocked: true };
  const isRoofDone = roofDep.isUnlocked && isRoofMarkedManual;

  const projectStages = project?.stages ?? [];
  const isFoundationDone = projectStages.length > 0 && projectStages.every((s) => s.is_completed);

  const filteredFloors = floors;

  return (
    <div className="bg-slate-950/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
      {/* Decorative Glow Background */}
      <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Building Settings Mode Button */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-800/80 pb-5">
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

        {/* TOP RIGHT: Building Settings Toggle Button */}
        <button
          onClick={toggleSettingsMode}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition shadow-lg cursor-pointer backdrop-blur-md shrink-0 border ${isSettingsMode
              ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 border-amber-300 text-slate-950 shadow-amber-500/30 font-black'
              : 'bg-slate-900 border-slate-700 text-amber-300 hover:border-amber-500/50 hover:bg-slate-800'
            }`}
        >
          {isSettingsMode ? (
            <>
              <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
              <span>Ayarları Kapat</span>
            </>
          ) : (
            <>
              <SlidersHorizontal className="w-4 h-4 text-amber-400" />
              <span>Bina Ayarları</span>
            </>
          )}
        </button>
      </div>

      {/* Main Building Stack View */}
      <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
        {/* Toast Warning Alert Notification */}
        {toastMessage && (
          <div className="w-full mb-4 p-3.5 bg-rose-500/20 border border-rose-500/50 rounded-2xl flex items-center justify-between text-rose-200 text-xs sm:text-sm font-medium animate-shake shadow-lg shadow-rose-950/40 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-rose-400 font-bold hover:text-white ml-2 text-base cursor-pointer p-1 rounded-lg hover:bg-rose-500/20 transition"
            >
              ✕
            </button>
          </div>
        )}

        {/* Top Settings Toolbar — placed at the TOP so adding/removing floors never pushes controls downwards */}
        {isSettingsMode && (
          <div className="w-full mb-6 animate-fadeIn">
            {/* Stats pill */}
            <div className="w-full flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-sm">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-black text-amber-400">{floors.length} kat</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 rounded-xl px-3 py-1.5 shadow-sm">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs font-black text-amber-400">
                    {floors.reduce((s, f) => s + (f.units?.length || 0), 0)} mülkiyet
                  </span>
                </div>
                {selectedFloorId && (() => {
                  const sf = floors.find(f => f.id === selectedFloorId);
                  return sf ? (
                    <div className="flex items-center gap-1.5 bg-amber-500/15 border border-amber-500/30 rounded-xl px-3 py-1.5 shadow-sm">
                      <span className="text-xs font-black text-amber-300">Seçili: {sf.floor_number}. Kat</span>
                    </div>
                  ) : null;
                })()}
              </div>
            </div>

            {/* Main full-width horizontal toolbar */}
            <div className="w-full flex flex-col sm:flex-row items-stretch gap-3 bg-slate-900/90 border border-slate-700/80 rounded-2xl p-3 sm:p-4 shadow-xl backdrop-blur-md">

              {/* Units per floor stepper */}
              <div className="flex flex-row sm:flex-col justify-center items-center px-4 py-2 bg-slate-950/60 sm:bg-transparent rounded-xl sm:rounded-none border border-slate-800 sm:border-0 sm:border-r sm:border-slate-700/80 shrink-0 gap-3 sm:gap-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Kat Başı Daire</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNewUnitsPerFloor((v) => Math.max(1, v - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-bold text-base flex items-center justify-center hover:border-amber-500 hover:text-amber-300 active:scale-90 transition cursor-pointer"
                  >−</button>
                  <div className="w-8 text-center">
                    <span className="text-xl font-black text-amber-400">{newUnitsPerFloor}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewUnitsPerFloor((v) => Math.min(4, v + 1))}
                    className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-bold text-base flex items-center justify-center hover:border-amber-500 hover:text-amber-300 active:scale-90 transition cursor-pointer"
                  >+</button>
                </div>
              </div>

              {/* Add floor button */}
              <button
                type="button"
                onClick={handleAddFloorAbove}
                disabled={!onUpdateProject}
                className="flex-1 flex flex-row items-center justify-center gap-3 py-3.5 px-5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm transition shadow-lg shadow-amber-500/20 active:scale-[0.98] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PlusCircle className="w-5 h-5 shrink-0" />
                <div className="text-left">
                  <div className="text-xs sm:text-sm font-extrabold leading-tight">
                    {selectedFloorId && floors.find(f => f.id === selectedFloorId)
                      ? `${floors.find(f => f.id === selectedFloorId)!.floor_number + 1}. Kat Ekle`
                      : 'Yeni Kat Ekle'
                    }
                  </div>
                  {selectedFloorId && floors.find(f => f.id === selectedFloorId) && (
                    <div className="text-[10px] font-semibold opacity-80">
                      {floors.find(f => f.id === selectedFloorId)!.floor_number}. katın üstüne ekler
                    </div>
                  )}
                </div>
              </button>

              {/* Delete selected floor button */}
              <button
                type="button"
                onClick={handleDeleteSelectedFloor}
                disabled={!onUpdateProject || !selectedFloorId}
                className="flex-1 flex flex-row items-center justify-center gap-3 py-3.5 px-5 rounded-xl border transition active:scale-[0.98] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed
                    bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20 hover:border-rose-500/50"
              >
                <Trash2 className="w-5 h-5 shrink-0 text-rose-400" />
                <div className="text-left">
                  <div className="text-xs sm:text-sm font-bold leading-tight">
                    {selectedFloorId && floors.find(f => f.id === selectedFloorId)
                      ? `${floors.find(f => f.id === selectedFloorId)!.floor_number}. Katı Sil`
                      : 'Kat Seç'}
                  </div>
                  {!selectedFloorId ? (
                    <div className="text-[10px] font-normal opacity-60">silmek için kat seçin</div>
                  ) : (
                    <div className="text-[10px] font-normal opacity-70">seçili katı kaldırır</div>
                  )}
                </div>
              </button>

            </div>
          </div>
        )}

        {/* Roof Architecture Graphic (Only visible when Settings Mode is OFF and floors exist) */}
        {!isSettingsMode && floors.length > 0 && (
          <div
            onClick={() => {
              if (!isContractor) return;
              if (!roofDep.isUnlocked) {
                setToastMessage(roofDep.reason || 'Çatı imalatı için önce tüm katların kolon ve duvar imalatları tamamlanmalıdır.');
                return;
              }
              setToastMessage(null);
              const nextState = !isRoofMarkedManual;
              setIsRoofMarkedManual(nextState);
              try {
                localStorage.setItem(roofStorageKey, String(nextState));
              } catch (e) { }

              if (project && onUpdateProject) {
                onUpdateProject({ ...project });
              }
            }}
            className="w-full relative mb-2 cursor-pointer group"
          >
            <div
              className={`w-full h-16 rounded-t-3xl border-t-2 border-x-2 transition-all duration-700 flex items-center justify-between px-6 relative overflow-hidden group-hover:border-amber-400 ${isRoofDone
                  ? 'bg-gradient-to-b from-amber-500 via-amber-600 to-amber-950 border-amber-400 shadow-[0_-5px_25px_rgba(245,158,11,0.5)]'
                  : 'bg-slate-900/80 border-slate-800 border-dashed opacity-75 hover:opacity-100'
                }`}
            >
              <div className="flex items-center gap-3 z-10">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${isRoofDone
                      ? 'bg-amber-400 border-yellow-200 text-slate-950 shadow-md'
                      : 'border-slate-600 bg-slate-900 text-slate-400 group-hover:border-amber-400'
                    }`}
                >
                  {isRoofDone ? (
                    <CheckCircle2 className="w-5 h-5 stroke-[3]" />
                  ) : (
                    <Home className="w-4 h-4 text-amber-400" />
                  )}
                </div>

                <div className="text-left">
                  <div className="text-xs font-black uppercase tracking-widest text-slate-100 flex items-center gap-2">
                    <span>{isRoofDone ? 'ÇATI & ÇATIKATI (CANLI)' : 'ÇATI İSKELETİ & YALITIM'}</span>
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {isRoofDone ? 'Su Yalıtımı & Kaplama Tamamlandı' : 'Tıklayarak Çatıyı Yapıldı / Yapılmadı İşaretleyin'}
                  </div>
                </div>
              </div>

              {/* Right Side Status Pill */}
              <div className="z-10 flex items-center gap-2">
                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold inline-flex items-center gap-1.5 transition-all ${isRoofDone
                      ? 'bg-amber-400 text-slate-950 font-black border border-yellow-200 shadow-lg shadow-amber-500/30'
                      : 'bg-slate-800 text-amber-300 border border-slate-700 group-hover:border-amber-500/50'
                    }`}
                >
                  {isRoofDone ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 stroke-[3]" />
                      <span>Tamamlandı ✓</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                      <span>Yapıldı İşaretle</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Floor Stack List - Each Floor Row Contains its OWN Settings Controls directly on its Right Side! */}
        <div className="w-full space-y-3 relative">
          {filteredFloors.length > 0 ? (
            [...filteredFloors]
              .sort((a, b) => b.floor_number - a.floor_number)
              .map((floor) => {
                const topFloor = floors.find((f) => f.floor_number === totalFloors);
                const isTopDuplex = topFloor && getFloorTypology(topFloor.id).type === 'duplex';

                // If this floor is Kat 5 (totalFloors - 1) and top floor (Kat 6) is duplex, skip it (it is merged into Kat 6 single thick box)
                if (isTopDuplex && floor.floor_number === totalFloors - 1 && totalFloors > 1) {
                  return null;
                }

                const isDuplexMergedBox = isTopDuplex && floor.floor_number === totalFloors && totalFloors > 1;
                const isSelected = selectedFloorId === floor.id;
                const progress = calculateFloorProgress(floor);
                const isFullyDone = progress === 100;
                const currentTypo = getFloorTypology(floor.id);
                const availableTypes = getAvailableTypologiesForFloor(floor.floor_number, totalFloors);
                const effectiveTypeKey = availableTypes.includes(currentTypo.type)
                  ? currentTypo.type
                  : availableTypes[0];
                const typoInfo = FLOOR_TYPOLOGY_MAP[effectiveTypeKey] || FLOOR_TYPOLOGY_MAP['residential'];
                const TypoIcon = typoInfo.icon;
                const effectiveUnits = getEffectiveFloorUnits(floor);

                if (isDuplexMergedBox) {
                  return (
                    <div
                      key={floor.id}
                      style={{ zIndex: isSelected ? 100 : floor.floor_number * 10 }}
                      onClick={() => {
                        setSelectedFloorId(isSelected ? null : floor.id);
                        setSelectedUnitId(null);
                      }}
                      className={`
                          relative cursor-pointer transition-all duration-300 rounded-2xl border p-5 sm:p-6 group
                          ${isSelected
                          ? 'scale-[1.01] ring-2 ring-amber-400/80 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
                          : 'hover:scale-[1.005]'
                        }
                          ${isFullyDone
                          ? `${typoInfo.badgeStyle} bg-gradient-to-r ${typoInfo.bgGradient}`
                          : 'bg-slate-900/75 border-slate-800 hover:border-slate-700 backdrop-blur-md'
                        }
                        `}
                    >
                      {/* Left Column Accent Bar */}
                      <div
                        className={`absolute top-0 left-0 bottom-0 w-2 rounded-l-2xl transition-all duration-500 ${isFullyDone
                            ? 'bg-gradient-to-b from-amber-400 to-yellow-500 shadow-[0_0_14px_rgba(245,158,11,0.9)]'
                            : typoInfo.barColor
                          }`}
                      />

                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pl-2">
                        {/* Floor Left Visual Information */}
                        <div className="flex items-center gap-4 lg:w-5/12">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm transition-all duration-300 shrink-0 ${isSelected
                                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/50'
                                : 'bg-slate-800 text-slate-300 group-hover:text-white'
                              }`}
                          >
                            {totalFloors}-{totalFloors - 1}.K
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-white group-hover:text-amber-300 transition-colors text-base">
                                Kat {totalFloors} & Kat {totalFloors - 1}
                              </h3>

                              <span
                                className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${typoInfo.badgeStyle}`}
                              >
                                <TypoIcon className="w-3.5 h-3.5" />
                                <span>{typoInfo.shortBadge} ({effectiveUnits.length} Birim)</span>
                              </span>
                            </div>

                            {/* Units Preview Blocks */}
                            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                              {effectiveUnits.map((u) => (
                                <span
                                  key={u.id}
                                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border transition-all ${u.is_completed
                                      ? 'bg-amber-500/20 border-amber-400/60 text-amber-200 shadow-sm'
                                      : 'bg-slate-950/80 border-slate-800 text-slate-400'
                                    }`}
                                >
                                  {u.name} {u.is_completed ? '✓' : ''}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* RIGHT SIDE OF THIS EXACT SAME FLOOR ROW: SETTINGS CONTROLS OR PROGRESS */}
                        {isSettingsMode ? (
                          <div
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80 lg:border-l lg:pl-6 lg:w-7/12 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Custom Typology Select */}
                            <div>
                              <label className="block text-xs font-bold text-amber-400/90 uppercase tracking-wider mb-1.5">
                                Kat Kullanım Amacı:
                              </label>
                              <CustomTypologySelect
                                value={effectiveTypeKey}
                                floorNumber={floor.floor_number}
                                totalFloors={totalFloors}
                                onOpen={() => setSelectedFloorId(floor.id)}
                                onChange={(newType) => {
                                  setSelectedFloorId(floor.id);
                                  const updated = {
                                    ...floorTypologies,
                                    [floor.id]: {
                                      ...currentTypo,
                                      type: newType,
                                    },
                                  };
                                  saveTypologies(updated);
                                }}
                              />
                            </div>

                            {/* Custom Unit Count Select */}
                            <div>
                              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                                Kattaki Dubleks Sayısı:
                              </label>
                              <CustomUnitCountSelect
                                unitCount={currentTypo.unitCount ?? (floor.units?.length || newUnitsPerFloor)}
                                unitPrefix={typoInfo.unitPrefix}
                                floorNumber={floor.floor_number}
                                onOpen={() => setSelectedFloorId(floor.id)}
                                onChange={(count) => {
                                  setSelectedFloorId(floor.id);
                                  const updated = {
                                    ...floorTypologies,
                                    [floor.id]: {
                                      ...currentTypo,
                                      type: effectiveTypeKey,
                                      unitCount: count,
                                    },
                                  };
                                  saveTypologies(updated);
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="text-right hidden sm:block">
                              <div className="text-xs font-semibold text-white">%{progress}</div>
                              <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                                <div
                                  className={`h-full transition-all duration-700 ${isFullyDone ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,1)]' : 'bg-slate-600'
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
                                setSelectedUnitId(null);
                              }}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isSelected
                                  ? 'bg-amber-500 text-slate-950 shadow-md'
                                  : 'bg-slate-800/80 text-slate-400 group-hover:bg-slate-700 group-hover:text-white'
                                }`}
                            >
                              <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90 text-slate-950' : ''}`} />
                            </button>
                          </div>
                        )}
                      </div>
                      {isSelected && !isSettingsMode && renderFloorInspectionPanel(floor)}
                    </div>
                  );
                }

                return (
                  <div
                    key={floor.id}
                    style={{ zIndex: isSelected ? 100 : floor.floor_number * 10 }}
                    onClick={() => {
                      setSelectedFloorId(isSelected ? null : floor.id);
                      setSelectedUnitId(null);
                    }}
                    className={`
                        relative cursor-pointer transition-all duration-300 rounded-2xl border p-5 sm:p-6 group
                        ${isSelected
                        ? 'scale-[1.01] ring-2 ring-amber-400/80 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.25)]'
                        : 'hover:scale-[1.005]'
                      }
                        ${isFullyDone
                        ? `${typoInfo.badgeStyle} bg-gradient-to-r ${typoInfo.bgGradient}`
                        : 'bg-slate-900/75 border-slate-800 hover:border-slate-700 backdrop-blur-md'
                      }
                      `}
                  >
                    {/* Left Column Accent Bar */}
                    <div
                      className={`absolute top-0 left-0 bottom-0 w-2 rounded-l-2xl transition-all duration-500 ${isFullyDone
                          ? 'bg-gradient-to-b from-amber-400 to-yellow-500 shadow-[0_0_14px_rgba(245,158,11,0.9)]'
                          : typoInfo.barColor
                        }`}
                    />

                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pl-2">
                      {/* Floor Left Visual Information */}
                      <div className="flex items-center gap-4 lg:w-5/12">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm transition-all duration-300 shrink-0 ${isSelected
                              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/50'
                              : 'bg-slate-800 text-slate-300 group-hover:text-white'
                            }`}
                        >
                          {floor.floor_number}.K
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-white group-hover:text-amber-300 transition-colors text-base">
                              {floor.name}
                            </h3>

                            <span
                              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${typoInfo.badgeStyle}`}
                            >
                              <TypoIcon className="w-3.5 h-3.5" />
                              <span>{typoInfo.shortBadge} ({effectiveUnits.length} Birim)</span>
                            </span>
                          </div>

                          {/* Units Preview Blocks */}
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {effectiveUnits.map((u) => (
                              <span
                                key={u.id}
                                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-md border transition-all ${u.is_completed
                                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-200 shadow-sm'
                                    : 'bg-slate-950/80 border-slate-800 text-slate-400'
                                  }`}
                              >
                                {u.name} {u.is_completed ? '✓' : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* RIGHT SIDE OF THIS EXACT SAME FLOOR ROW: SETTINGS CONTROLS OR PROGRESS */}
                      {isSettingsMode ? (
                        <div
                          className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800/80 lg:border-l lg:pl-6 lg:w-7/12 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Custom Typology Select directly on the right side of this floor */}
                          <div>
                            <label className="block text-xs font-bold text-amber-400/90 uppercase tracking-wider mb-1.5">
                              Kat Kullanım Amacı:
                            </label>
                            <CustomTypologySelect
                              value={effectiveTypeKey}
                              floorNumber={floor.floor_number}
                              totalFloors={totalFloors}
                              onOpen={() => setSelectedFloorId(floor.id)}
                              onChange={(newType) => {
                                setSelectedFloorId(floor.id);
                                const updated = {
                                  ...floorTypologies,
                                  [floor.id]: {
                                    ...currentTypo,
                                    type: newType,
                                  },
                                };
                                saveTypologies(updated);
                              }}
                            />
                          </div>

                          {/* Custom Unit Count Select directly on the right side of this floor */}
                          <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                              Kattaki {typoInfo.unitPrefix} Sayısı:
                            </label>
                            <CustomUnitCountSelect
                              unitCount={currentTypo.unitCount ?? (floor.units?.length || newUnitsPerFloor)}
                              unitPrefix={typoInfo.unitPrefix}
                              floorNumber={floor.floor_number}
                              onOpen={() => setSelectedFloorId(floor.id)}
                              onChange={(count) => {
                                setSelectedFloorId(floor.id);
                                const updated = {
                                  ...floorTypologies,
                                  [floor.id]: {
                                    ...currentTypo,
                                    type: effectiveTypeKey,
                                    unitCount: count,
                                  },
                                };
                                saveTypologies(updated);
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4">
                          <div className="text-right hidden sm:block">
                            <div className="text-xs font-semibold text-white">%{progress}</div>
                            <div className="w-20 bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full transition-all duration-700 ${isFullyDone ? 'bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,1)]' : 'bg-slate-600'
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
                              setSelectedUnitId(null);
                            }}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isSelected
                                ? 'bg-amber-500 text-slate-950 shadow-md'
                                : 'bg-slate-800/80 text-slate-400 group-hover:bg-slate-700 group-hover:text-white'
                              }`}
                          >
                            <ChevronRight className={`w-4 h-4 transition-transform ${isSelected ? 'rotate-90 text-slate-950' : ''}`} />
                          </button>
                        </div>
                      )}
                    </div>
                    {isSelected && !isSettingsMode && renderFloorInspectionPanel(floor)}
                  </div>
                );
              })
          ) : (
            <div className="p-8 text-center bg-gradient-to-br from-amber-500/5 via-slate-900/80 to-slate-900/80 border border-amber-500/20 border-dashed rounded-2xl animate-fadeIn">
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Layers className="w-7 h-7 text-amber-400/60" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-300 mb-1">Henüz kat eklenmemiş</p>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {isSettingsMode ? (
                      <>Aşağıdaki araç çubuğundan <span className="text-amber-400 font-bold">Kat Ekle</span> butonuna tıklayarak bina katlarını oluşturun.</>
                    ) : (
                      <>
                        Binayı oluşturmak için sağ üstteki
                        <button
                          type="button"
                          onClick={toggleSettingsMode}
                          className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-[11px] hover:bg-amber-500/30 transition cursor-pointer"
                        >
                          <SlidersHorizontal className="w-3 h-3" /> Bina Ayarları
                        </button>
                        butonuna tıklayın.
                      </>
                    )}
                  </p>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* Foundation Base Visual (Only visible when Settings Mode is OFF) */}
        {!isSettingsMode && (
          <div
            className={`w-full rounded-2xl p-4 text-center text-xs font-extrabold flex items-center justify-center gap-2 transition-all duration-700 mt-2 ${isFoundationDone
                ? 'bg-gradient-to-r from-amber-950/90 via-slate-900 to-amber-950/90 border border-amber-600/60 text-amber-300 shadow-xl shadow-amber-500/20'
                : 'bg-slate-900/60 border border-slate-800 border-dashed text-slate-600 opacity-60'
              }`}
          >
            <Layers className={`w-4 h-4 ${isFoundationDone ? 'text-amber-400' : 'text-slate-600'}`} />
            <span>
              {isFoundationDone
                ? 'TEMEL RADYE BETON & ZEMİN ETÜDÜ (100% CANLI DOKU)'
                : 'TEMEL RADYE BETON & ZEMİN ETÜDÜ (GÖLGE — AŞAMALAR BEKLİYOR)'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};





