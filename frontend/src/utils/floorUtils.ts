import type { Project, BuildingFloor, Unit } from '../types';

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

export const TYPOLOGY_PREFIX_MAP: Record<FloorTypology, string> = {
  commercial_shop: 'Dükkan',
  business_office: 'Ofis',
  residential: 'Daire',
  reverse_duplex: 'Ters Dubleks',
  duplex: 'Dubleks',
  duplex_bottom: 'Dubleks (Alt)',
  parking_storage: 'Otopark/Depo',
};

export function getEffectiveFloorUnits(
  floor: BuildingFloor,
  typoConfig: FloorTypologyConfig,
  totalFloors: number,
  projectId?: string,
  topFloorTypology?: FloorTypology
): Unit[] {
  // If this floor is the lower level of a top floor duplex, it is merged into upper floor units
  if (
    floor.floor_number === totalFloors - 1 &&
    totalFloors > 1 &&
    (topFloorTypology === 'duplex' || typoConfig.type === 'duplex_bottom')
  ) {
    return [];
  }

  const unitPrefix = TYPOLOGY_PREFIX_MAP[typoConfig.type] || 'Daire';
  const targetCount = typoConfig.unitCount ?? (floor.units?.length || 3);
  const existingUnits = floor.units || [];

  const isTopDuplexUpper =
    floor.floor_number === totalFloors && typoConfig.type === 'duplex' && totalFloors > 1;

  const result: Unit[] = [];
  for (let i = 1; i <= targetCount; i++) {
    const unitNum = floor.floor_number * 100 + i;
    let unitName = `${unitPrefix} #${unitNum}`;

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
            project_id: projectId || '',
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
            project_id: projectId || '',
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
}

export function syncProjectFloorSettings(project: Project): Project {
  if (!project || !project.floors || project.floors.length === 0) return project;

  const storageKey = `golgeden_bina_ayarlari_${project.id}`;
  let typologiesMap: Record<string, FloorTypologyConfig> = {};

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      typologiesMap = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Kat ayarları okunamadı:', e);
  }

  const totalFloors = project.floors.length;
  const topFloor = project.floors.find((f) => f.floor_number === totalFloors);
  const topFloorTypo = topFloor
    ? typologiesMap[topFloor.id]?.type || (totalFloors > 1 ? 'duplex' : 'residential')
    : undefined;

  let totalUnitsCount = 0;

  const updatedFloors = project.floors.map((floor) => {
    const defaultType: FloorTypology =
      floor.floor_number === 1
        ? 'commercial_shop'
        : floor.floor_number === totalFloors
        ? 'duplex'
        : floor.floor_number === totalFloors - 1 && topFloorTypo === 'duplex'
        ? 'duplex_bottom'
        : 'residential';

    const defaultUnitCount = floor.floor_number === totalFloors ? 2 : 3;

    const typoConfig: FloorTypologyConfig = typologiesMap[floor.id] || {
      type: defaultType,
      unitCount: floor.units?.length || defaultUnitCount,
    };

    const effectiveUnits = getEffectiveFloorUnits(
      floor,
      typoConfig,
      totalFloors,
      project.id,
      topFloorTypo
    );
    totalUnitsCount += effectiveUnits.length;

    return {
      ...floor,
      units: effectiveUnits,
    };
  });

  return {
    ...project,
    floors: updatedFloors,
    unit_count: totalUnitsCount,
  };
}
