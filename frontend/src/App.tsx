import { useEffect, useState } from 'react';
import type { Project, UserRole, VisibilityType, Expense } from './types';
import { ApiService } from './api';
import { Navbar } from './components/Navbar';
import { MetricsGrid } from './components/MetricsGrid';
import { BuildingViewer } from './components/BuildingViewer';
import { BudgetCharts } from './components/BudgetCharts';
import { ContractorDashboard } from './components/ContractorDashboard';
import { ClientViewer } from './components/ClientViewer';
import { Building2, ShieldCheck } from 'lucide-react';

export function App() {
  const [activeRole, setActiveRole] = useState<UserRole>('contractor');
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load or Seed Project
  const loadProject = async (role: UserRole = activeRole) => {
    setLoading(true);
    try {
      const p = await ApiService.seedDemoProject(role);
      setProject(p);
    } catch (err) {
      console.error('Failed to load project:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProject(activeRole);
  }, [activeRole]);

  const handleRoleChange = (newRole: UserRole) => {
    setActiveRole(newRole);
  };

  const handleCreateNewProject = async (data: {
    name: string;
    location: string;
    total_budget: number;
    floor_count: number;
    units_per_floor: number;
    visibility: VisibilityType;
    show_financials_to_clients: boolean;
  }) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8080/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const newProj = await res.json();
        setProject(newProj);
      } else {
        throw new Error('Create project API failed');
      }
    } catch (err) {
      console.warn('Backend unavailable, constructing new project locally', err);
      // Create local project structure
      const newFloors = Array.from({ length: data.floor_count }, (_, fIdx) => {
        const floorNum = data.floor_count - fIdx;
        const floorId = `floor-${floorNum}-${Date.now()}`;
        const units = Array.from({ length: data.units_per_floor }, (_, uIdx) => {
          const unitNum = (floorNum * 100) + (uIdx + 1);
          const unitId = `unit-${unitNum}-${Date.now()}`;
          return {
            id: unitId,
            floor_id: floorId,
            unit_number: unitNum,
            name: `Daire ${unitNum}`,
            is_completed: false,
            stages: [
              {
                id: `st-u-${unitNum}-1`,
                project_id: `proj-${Date.now()}`,
                floor_id: floorId,
                unit_id: unitId,
                name: `Daire ${unitNum} Tesisat & İnce İşler`,
                category: 'subcontractor',
                estimated_cost: (data.total_budget * 0.3) / (data.floor_count * data.units_per_floor),
                actual_cost: 0,
                weight_percentage: 3,
                is_completed: false,
                order_index: 1,
              },
            ],
          };
        });

        return {
          id: floorId,
          project_id: `proj-${Date.now()}`,
          floor_number: floorNum,
          name: `${floorNum}. Kat`,
          is_completed: false,
          units,
          stages: [
            {
              id: `st-f-${floorNum}-1`,
              project_id: `proj-${Date.now()}`,
              floor_id: floorId,
              name: `${floorNum}. Kat Kolon & Betonarme`,
              category: 'labor',
              estimated_cost: (data.total_budget * 0.4) / data.floor_count,
              actual_cost: 0,
              weight_percentage: 8,
              is_completed: false,
              order_index: 1,
            },
          ],
        };
      });

      const localNewProject: Project = {
        id: `proj-${Date.now()}`,
        contractor_id: 'c-demo-1',
        name: data.name,
        location: data.location || 'Türkiye',
        total_budget: data.total_budget,
        visibility: data.visibility,
        show_financials_to_clients: data.show_financials_to_clients,
        physical_progress: 0,
        financial_progress: 0,
        total_actual_cost: 0,
        cost_variance: data.total_budget,
        floors: newFloors,
        expenses: [],
        stages: [
          {
            id: `st-p-1`,
            project_id: `proj-${Date.now()}`,
            name: 'Ruhsat ve Hafriyat Kazısı',
            category: 'official',
            estimated_cost: data.total_budget * 0.1,
            actual_cost: 0,
            weight_percentage: 15,
            is_completed: false,
            order_index: 1,
          },
          {
            id: `st-p-2`,
            project_id: `proj-${Date.now()}`,
            name: 'Temel Radye Beton',
            category: 'material',
            estimated_cost: data.total_budget * 0.2,
            actual_cost: 0,
            weight_percentage: 20,
            is_completed: false,
            order_index: 2,
          },
        ],
      };

      setProject(localNewProject);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVisibility = async (
    visibility: VisibilityType,
    showFinancials: boolean
  ) => {
    if (!project) return;
    const updated = await ApiService.updateVisibility(
      project.id,
      visibility,
      showFinancials,
      activeRole
    );
    setProject(updated);
  };

  const handleAddExpense = async (expenseData: Partial<Expense>) => {
    if (!project) return;
    const newExp = await ApiService.createExpense(project.id, expenseData);

    const updatedExpenses = [newExp, ...(project.expenses || [])];
    const totalActual = updatedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const variance = project.total_budget - totalActual;
    const finProg = project.total_budget > 0 ? (totalActual / project.total_budget) * 100 : 0;

    setProject({
      ...project,
      expenses: updatedExpenses,
      total_actual_cost: totalActual,
      cost_variance: variance,
      financial_progress: Math.round(finProg * 10) / 10,
    });
  };

  const handleToggleFloorStage = async (floorId: string, stageId: string, isCompleted: boolean) => {
    if (!project || !project.floors) return;
    await ApiService.updateStage(stageId, isCompleted);

    const newFloors = project.floors.map((f) => {
      if (f.id === floorId && f.stages) {
        const updatedStages = f.stages.map((st) =>
          st.id === stageId ? { ...st, is_completed: isCompleted } : st
        );
        const allDone = updatedStages.every((st) => st.is_completed);
        return { ...f, stages: updatedStages, is_completed: allDone };
      }
      return f;
    });

    recalculateAndSetProject(newFloors, project.stages || []);
  };

  const handleToggleUnitStage = async (unitId: string, stageId: string, isCompleted: boolean) => {
    if (!project || !project.floors) return;
    await ApiService.updateStage(stageId, isCompleted);

    const newFloors = project.floors.map((f) => {
      if (!f.units) return f;
      const updatedUnits = f.units.map((u) => {
        if (u.id === unitId && u.stages) {
          const updatedStages = u.stages.map((st) =>
            st.id === stageId ? { ...st, is_completed: isCompleted } : st
          );
          const allDone = updatedStages.every((st) => st.is_completed);
          return { ...u, stages: updatedStages, is_completed: allDone };
        }
        return u;
      });
      return { ...f, units: updatedUnits };
    });

    recalculateAndSetProject(newFloors, project.stages || []);
  };

  const handleToggleProjectStage = async (stageId: string, isCompleted: boolean) => {
    if (!project || !project.stages) return;
    await ApiService.updateStage(stageId, isCompleted);

    const newProjectStages = project.stages.map((st) =>
      st.id === stageId ? { ...st, is_completed: isCompleted } : st
    );

    recalculateAndSetProject(project.floors || [], newProjectStages);
  };

  const recalculateAndSetProject = (floors: any[], projectStages: any[]) => {
    if (!project) return;
    let totalWeight = 0;
    let completedWeight = 0;

    projectStages.forEach((st) => {
      totalWeight += st.weight_percentage;
      if (st.is_completed) completedWeight += st.weight_percentage;
    });

    floors.forEach((f) => {
      f.stages?.forEach((st: any) => {
        totalWeight += st.weight_percentage;
        if (st.is_completed) completedWeight += st.weight_percentage;
      });
      f.units?.forEach((u: any) => {
        u.stages?.forEach((st: any) => {
          totalWeight += st.weight_percentage;
          if (st.is_completed) completedWeight += st.weight_percentage;
        });
      });
    });

    const newPhysProgress = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 1000) / 10 : 0;

    setProject({
      ...project,
      floors,
      stages: projectStages,
      physical_progress: newPhysProgress,
    });
  };

  const isClientHidden = activeRole === 'client' && (!project || !project.show_financials_to_clients);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar
        activeRole={activeRole}
        onRoleChange={handleRoleChange}
        project={project}
        onSeedDemo={() => loadProject(activeRole)}
      />

      {/* Main Body Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center animate-spin mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">İnşaat Verileri Yükleniyor...</h2>
            <p className="text-xs text-slate-400 mt-1">Gölgeden Yapıya görselleştirici hazırlanıyor</p>
          </div>
        ) : project ? (
          <>
            {/* 1. Executive Role Banner */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl px-6 py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                <span className="text-xs font-semibold text-slate-300">
                  Aktif Görünüm Modu:{' '}
                  <strong className="text-amber-400 capitalize">
                    {activeRole === 'contractor' ? 'Müteahhit / Yönetici (Admin Ekranı)' : 'Müşteri / Yatırımcı (İzleme Portalı)'}
                  </strong>
                </span>
              </div>

              {activeRole === 'client' && (
                <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  {project.show_financials_to_clients
                    ? 'Finansal Veriler Görünür'
                    : 'Finansal Veriler Gizli (Maskeli)'}
                </span>
              )}
            </div>

            {/* 2. Top KPI Metrics Grid */}
            <MetricsGrid project={project} isClientHidden={isClientHidden} activeRole={activeRole} />

            {/* 3. Main Feature: Architectural House & Building Blueprint Viewer */}
            <BuildingViewer
              floors={project.floors || []}
              onToggleFloorStage={handleToggleFloorStage}
              onToggleUnitStage={handleToggleUnitStage}
              isContractor={activeRole === 'contractor'}
            />

            {/* 4. Distinct Role-Specific Dashboards */}
            {activeRole === 'contractor' ? (
              <ContractorDashboard
                project={project}
                onUpdateVisibility={handleUpdateVisibility}
                onAddExpense={handleAddExpense}
                onToggleStage={handleToggleProjectStage}
                onCreateNewProject={handleCreateNewProject}
              />
            ) : (
              <ClientViewer project={project} isClientHidden={isClientHidden} />
            )}

            {/* 5. Financial Charts (Recharts - Müteahhit veya İzin Verilen Müşteri Görünümü) */}
            {!isClientHidden && (
              <BudgetCharts project={project} isClientHidden={isClientHidden} />
            )}
          </>
        ) : (
          <div className="text-center py-20 text-rose-400">Proje verisi yüklenemedi.</div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-slate-400">Gölgeden Yapıya Platformu</span>
          </div>
          <span>Go Clean Architecture Backend & React TypeScript Entegre SaaS</span>
        </div>
      </footer>
    </div>
  );
}
export default App;
