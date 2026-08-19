import type { Project, BuildingFloor, Unit } from '../types';

export interface StageDependencyStatus {
  isUnlocked: boolean;
  reason?: string;
  prerequisiteName?: string;
}

/**
 * Helper to identify if a floor stage is a structural framework stage (Kolon & Tabliye / Betonarme).
 */
export function isStructuralStage(stage: { name: string; order_index?: number }): boolean {
  const nameLower = stage.name.toLowerCase();
  if (
    nameLower.includes('kolon') ||
    nameLower.includes('tabliye') ||
    nameLower.includes('betonarme') ||
    nameLower.includes('karkas') ||
    nameLower.includes('iskelet')
  ) {
    return true;
  }
  return stage.order_index === 1;
}

/**
 * Checks if a project-level stage can be completed.
 * Project stages must be completed sequentially based on order_index or array index.
 */
export function checkProjectStageStatus(
  project: Project,
  stageId: string
): StageDependencyStatus {
  if (!project.stages || project.stages.length === 0) {
    return { isUnlocked: true };
  }

  const sortedStages = [...project.stages].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  const stageIndex = sortedStages.findIndex((s) => s.id === stageId);

  if (stageIndex <= 0) {
    return { isUnlocked: true };
  }

  for (let i = 0; i < stageIndex; i++) {
    if (!sortedStages[i].is_completed) {
      return {
        isUnlocked: false,
        reason: `Öncelikle "${sortedStages[i].name}" imalatı tamamlanmalıdır.`,
        prerequisiteName: sortedStages[i].name,
      };
    }
  }

  return { isUnlocked: true };
}

/**
 * Checks if a floor-level stage can be completed.
 * Rules:
 * 1. Project-level base stages (hafriyat, radye temel, etc.) must be completed.
 * 2. Structural stages (Kolon & Tabliye Betonu) require ONLY lower floor's structural stage to be completed (walls are NOT required).
 * 3. Non-structural stages (e.g. Duvar Örme) require lower floor structural stages & previous stage on the same floor.
 */
export function checkFloorStageStatus(
  project: Project,
  floorId: string,
  stageId: string
): StageDependencyStatus {
  // 1. Check project-level stages first
  if (project.stages && project.stages.length > 0) {
    const incompleteProjectStage = project.stages.find((s) => !s.is_completed);
    if (incompleteProjectStage) {
      return {
        isUnlocked: false,
        reason: `Öncelikle temeldeki "${incompleteProjectStage.name}" imalatı tamamlanmalıdır.`,
        prerequisiteName: incompleteProjectStage.name,
      };
    }
  }

  if (!project.floors || project.floors.length === 0) {
    return { isUnlocked: true };
  }

  // Find target floor
  const targetFloor = project.floors.find((f) => f.id === floorId);
  if (!targetFloor) return { isUnlocked: true };

  // Find target stage
  const targetStage = targetFloor.stages?.find((s) => s.id === stageId);
  const targetIsStructural = targetStage ? isStructuralStage(targetStage) : false;

  // 2. Check lower floors (sorted by floor_number ascending)
  const sortedFloors = [...project.floors].sort((a, b) => a.floor_number - b.floor_number);
  const currentFloorIdx = sortedFloors.findIndex((f) => f.id === floorId);

  if (currentFloorIdx > 0) {
    for (let i = 0; i < currentFloorIdx; i++) {
      const lowerFloor = sortedFloors[i];
      if (lowerFloor.stages && lowerFloor.stages.length > 0) {
        if (targetIsStructural) {
          // Structural framework stage only depends on lower floor's structural framework stage
          const incompleteLowerStructural = lowerFloor.stages.find(
            (s) => isStructuralStage(s) && !s.is_completed
          );
          if (incompleteLowerStructural) {
            return {
              isUnlocked: false,
              reason: `Öncelikle alt kat olan ${lowerFloor.name} imalatı ("${incompleteLowerStructural.name}") tamamlanmalıdır.`,
              prerequisiteName: incompleteLowerStructural.name,
            };
          }
        } else {
          // Non-structural stage (e.g. Duvar Örme) requires lower floor structural stage
          const incompleteLowerStructural = lowerFloor.stages.find(
            (s) => isStructuralStage(s) && !s.is_completed
          );
          if (incompleteLowerStructural) {
            return {
              isUnlocked: false,
              reason: `Öncelikle alt kat olan ${lowerFloor.name} imalatı ("${incompleteLowerStructural.name}") tamamlanmalıdır.`,
              prerequisiteName: incompleteLowerStructural.name,
            };
          }
        }
      }
    }
  }

  // 3. Check previous stages on the same floor
  if (targetFloor.stages && targetFloor.stages.length > 0) {
    const sortedFloorStages = [...targetFloor.stages].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    const stageIdx = sortedFloorStages.findIndex((s) => s.id === stageId);
    if (stageIdx > 0) {
      for (let i = 0; i < stageIdx; i++) {
        if (!sortedFloorStages[i].is_completed) {
          return {
            isUnlocked: false,
            reason: `Öncelikle kat içi "${sortedFloorStages[i].name}" imalatı tamamlanmalıdır.`,
            prerequisiteName: sortedFloorStages[i].name,
          };
        }
      }
    }
  }

  return { isUnlocked: true };
}

/**
 * Checks if a unit-level stage (or unit overall completion) can be completed.
 * Unit stages require:
 * 1. All parent floor's structural and masonry stages to be completed.
 * 2. Previous unit stages on the same unit to be completed.
 */
export function checkUnitStageStatus(
  project: Project,
  unitId: string,
  stageId?: string
): StageDependencyStatus {
  if (!project.floors || project.floors.length === 0) {
    return { isUnlocked: true };
  }

  let parentFloor: BuildingFloor | undefined;
  let targetUnit: Unit | undefined;

  for (const floor of project.floors) {
    if (floor.units) {
      const u = floor.units.find((unit) => unit.id === unitId);
      if (u) {
        parentFloor = floor;
        targetUnit = u;
        break;
      }
    }
  }

  if (!parentFloor || !targetUnit) return { isUnlocked: true };

  // 1. Check parent floor's structural stages
  if (parentFloor.stages && parentFloor.stages.length > 0) {
    const firstFloorStage = parentFloor.stages[0];
    const floorStatus = checkFloorStageStatus(project, parentFloor.id, firstFloorStage.id);
    if (!floorStatus.isUnlocked) {
      return floorStatus;
    }

    const incompleteFloorStage = parentFloor.stages.find((s) => !s.is_completed);
    if (incompleteFloorStage) {
      return {
        isUnlocked: false,
        reason: `Öncelikle ${parentFloor.name} yapısının "${incompleteFloorStage.name}" imalatı tamamlanmalıdır.`,
        prerequisiteName: incompleteFloorStage.name,
      };
    }
  }

  // 2. Check previous stages on the same unit if stageId provided
  if (stageId && targetUnit.stages && targetUnit.stages.length > 0) {
    const sortedUnitStages = [...targetUnit.stages].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    const stageIdx = sortedUnitStages.findIndex((s) => s.id === stageId);
    if (stageIdx > 0) {
      for (let i = 0; i < stageIdx; i++) {
        if (!sortedUnitStages[i].is_completed) {
          return {
            isUnlocked: false,
            reason: `Öncelikle daire içi "${sortedUnitStages[i].name}" imalatı tamamlanmalıdır.`,
            prerequisiteName: sortedUnitStages[i].name,
          };
        }
      }
    }
  }

  return { isUnlocked: true };
}

/**
 * Checks if Roof (Çatı) can be marked as completed.
 * Roof requires all floors' structural skeleton stages (Kolon & Tabliye) to be completed.
 */
export function checkRoofStatus(project: Project): StageDependencyStatus {
  if (project.stages) {
    const incompleteProjectStage = project.stages.find((s) => !s.is_completed);
    if (incompleteProjectStage) {
      return {
        isUnlocked: false,
        reason: `Çatı imalatı için önce temeldeki "${incompleteProjectStage.name}" tamamlanmalıdır.`,
        prerequisiteName: incompleteProjectStage.name,
      };
    }
  }

  if (project.floors && project.floors.length > 0) {
    for (const floor of project.floors) {
      if (floor.stages && floor.stages.length > 0) {
        const incompleteStructural = floor.stages.find((s) => isStructuralStage(s) && !s.is_completed);
        if (incompleteStructural) {
          return {
            isUnlocked: false,
            reason: `Çatı imalatı için önce ${floor.name} kolon & betonarme imalatı tamamlanmalıdır.`,
            prerequisiteName: incompleteStructural.name,
          };
        }
      }
    }
  }

  return { isUnlocked: true };
}

/**
 * Enforces cascade resetting: when any stage is set to uncompleted (false),
 * any dependent higher-level stages or units are automatically set to false.
 */
export function enforceCascadeStageState(project: Project): Project {
  const updatedProject: Project = JSON.parse(JSON.stringify(project));

  // 1. Check project stages
  if (updatedProject.stages && updatedProject.stages.length > 0) {
    const sortedProjStages = [...updatedProject.stages].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
    let hasIncomplete = false;
    for (const st of sortedProjStages) {
      if (!st.is_completed) {
        hasIncomplete = true;
      } else if (hasIncomplete) {
        const realSt = updatedProject.stages.find((s) => s.id === st.id);
        if (realSt) realSt.is_completed = false;
      }
    }

    if (updatedProject.stages.some((s) => !s.is_completed)) {
      if (updatedProject.floors) {
        for (const floor of updatedProject.floors) {
          floor.is_completed = false;
          floor.stages?.forEach((s) => (s.is_completed = false));
          floor.units?.forEach((u) => {
            u.is_completed = false;
            u.stages?.forEach((s) => (s.is_completed = false));
          });
        }
      }
      return updatedProject;
    }
  }

  // 2. Check floors from bottom to top
  if (updatedProject.floors && updatedProject.floors.length > 0) {
    const sortedFloors = [...updatedProject.floors].sort((a, b) => a.floor_number - b.floor_number);
    let structuralIncompleteFromFloor: number | null = null;

    for (const floor of sortedFloors) {
      const realFloor = updatedProject.floors.find((f) => f.id === floor.id);
      if (!realFloor) continue;

      if (structuralIncompleteFromFloor !== null && realFloor.floor_number > structuralIncompleteFromFloor) {
        realFloor.is_completed = false;
        realFloor.stages?.forEach((s) => (s.is_completed = false));
        realFloor.units?.forEach((u) => {
          u.is_completed = false;
          u.stages?.forEach((s) => (s.is_completed = false));
        });
        continue;
      }

      if (realFloor.stages && realFloor.stages.length > 0) {
        const sortedFloorStages = [...realFloor.stages].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
        let floorStageIncomplete = false;

        for (const st of sortedFloorStages) {
          const realStage = realFloor.stages.find((s) => s.id === st.id);
          if (!realStage) continue;

          if (floorStageIncomplete) {
            realStage.is_completed = false;
          } else if (!realStage.is_completed) {
            floorStageIncomplete = true;
            if (isStructuralStage(realStage) && structuralIncompleteFromFloor === null) {
              structuralIncompleteFromFloor = realFloor.floor_number;
            }
          }
        }
      }

      if (realFloor.units && realFloor.units.length > 0) {
        const allFloorStagesDone = realFloor.stages ? realFloor.stages.every((s) => s.is_completed) : true;

        for (const unit of realFloor.units) {
          if (!allFloorStagesDone) {
            unit.is_completed = false;
            unit.stages?.forEach((s) => (s.is_completed = false));
          } else if (unit.stages && unit.stages.length > 0) {
            let unitStageIncomplete = false;
            const sortedUnitStages = [...unit.stages].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
            for (const st of sortedUnitStages) {
              const realUnitStage = unit.stages.find((s) => s.id === st.id);
              if (!realUnitStage) continue;

              if (unitStageIncomplete) {
                realUnitStage.is_completed = false;
              } else if (!realUnitStage.is_completed) {
                unitStageIncomplete = true;
              }
            }
            unit.is_completed = unit.stages.every((s) => s.is_completed);
          }
        }
      }

      const allFloorStagesDone = realFloor.stages ? realFloor.stages.every((s) => s.is_completed) : true;
      const allUnitsDone = realFloor.units ? realFloor.units.every((u) => u.is_completed) : true;
      realFloor.is_completed = allFloorStagesDone && allUnitsDone;
    }
  }

  return updatedProject;
}

