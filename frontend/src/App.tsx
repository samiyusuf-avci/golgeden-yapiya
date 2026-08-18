import { useEffect, useState } from 'react';
import type { Project, UserRole, VisibilityType, Expense } from './types';
import { ApiService } from './api';
import { Navbar } from './components/Navbar';
import { ProjectCardGrid } from './components/ProjectCardGrid';
import { MetricsGrid } from './components/MetricsGrid';
import { BuildingViewer } from './components/BuildingViewer';
import { BudgetCharts } from './components/BudgetCharts';
import { ContractorDashboard } from './components/ContractorDashboard';
import { ClientViewer } from './components/ClientViewer';
import { CreateProjectModal } from './components/CreateProjectModal';
import {
  Building2,
  ShieldCheck,
  LayoutGrid,
  CheckSquare,
  Receipt,
  Settings,
  Lock,
} from 'lucide-react';

export function App() {
  const [activeRole, setActiveRole] = useState<UserRole>('contractor');
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'portfolio' | 'viewer' | 'stages' | 'finances' | 'settings'>('viewer');
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Load All Projects
  const loadProjects = async (role: UserRole = activeRole) => {
    setLoading(true);
    try {
      const list = await ApiService.getProjects(role);
      setProjects(list);
      if (list.length > 0) {
        // Keep currently selected or default to first
        setActiveProjectId((prev) => {
          if (prev && list.some((p) => p.id === prev)) return prev;
          return list[0].id;
        });
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } fontally: {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects(activeRole);
  }, [activeRole]);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  const updateActiveProjectInState = (updated: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleRoleChange = (newRole: UserRole) => {
    setActiveRole(newRole);
  };

  const handleSelectProject = (project: Project) => {
    setActiveProjectId(project.id);
    setActiveTab('viewer');
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
      let newProj: Project;

      if (res.ok) {
        newProj = await res.json();
      } else {
        throw new Error('Backend create failed, fallback to local');
      }
      setProjects((prev) => [newProj, ...prev]);
      setActiveProjectId(newProj.id);
      setActiveTab('viewer');
    } catch (err) {
      console.warn('Backend unavailable, constructing new project locally', err);
      // Create local project structure
      const newFloors = Array.from({ length: data.floor_count }, (_, fIdx) => {
        const floorNum = data.floor_count - fIdx;
        const floorId = `floor-${floorNum}-${Date.now()}`;
        const units = Array.from({ length: data.units_per_floor }, (_, uIdx) => {
          const unitNum = floorNum * 100 + (uIdx + 1);
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
        description: `${data.floor_count} Katlı Yeni Başlanan İnşaat Projesi`,
        status: 'planning',
        unit_count: data.floor_count * data.units_per_floor,
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

      setProjects((prev) => [localNewProject, ...prev]);
      setActiveProjectId(localNewProject.id);
      setActiveTab('viewer');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVisibility = async (
    visibility: VisibilityType,
    showFinancials: boolean
  ) => {
    if (!activeProject) return;
    const updated = await ApiService.updateVisibility(
      activeProject.id,
      visibility,
      showFinancials,
      activeRole
    );
    updateActiveProjectInState(updated);
  };

  const handleAddExpense = async (expenseData: Partial<Expense>) => {
    if (!activeProject) return;
    const newExp = await ApiService.createExpense(activeProject.id, expenseData);

    const updatedExpenses = [newExp, ...(activeProject.expenses || [])];
    const totalActual = updatedExpenses.reduce((sum, e) => sum + e.amount, 0);
    const variance = activeProject.total_budget - totalActual;
    const finProg = activeProject.total_budget > 0 ? (totalActual / activeProject.total_budget) * 100 : 0;

    const updatedProj: Project = {
      ...activeProject,
      expenses: updatedExpenses,
      total_actual_cost: totalActual,
      cost_variance: variance,
      financial_progress: Math.round(finProg * 10) / 10,
    };
    updateActiveProjectInState(updatedProj);
  };

  const handleToggleFloorStage = async (floorId: string, stageId: string, isCompleted: boolean) => {
    if (!activeProject || !activeProject.floors) return;
    await ApiService.updateStage(stageId, isCompleted);

    const newFloors = activeProject.floors.map((f) => {
      if (f.id === floorId && f.stages) {
        const updatedStages = f.stages.map((st) =>
          st.id === stageId ? { ...st, is_completed: isCompleted } : st
        );
        const allDone = updatedStages.every((st) => st.is_completed);
        return { ...f, stages: updatedStages, is_completed: allDone };
      }
      return f;
    });

    recalculateAndSetProject(newFloors, activeProject.stages || []);
  };

  const handleToggleUnitStage = async (unitId: string, stageId: string, isCompleted: boolean) => {
    if (!activeProject || !activeProject.floors) return;
    await ApiService.updateStage(stageId, isCompleted);

    const newFloors = activeProject.floors.map((f) => {
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

    recalculateAndSetProject(newFloors, activeProject.stages || []);
  };

  const handleToggleProjectStage = async (stageId: string, isCompleted: boolean) => {
    if (!activeProject || !activeProject.stages) return;
    await ApiService.updateStage(stageId, isCompleted);

    const newProjectStages = activeProject.stages.map((st) =>
      st.id === stageId ? { ...st, is_completed: isCompleted } : st
    );

    recalculateAndSetProject(activeProject.floors || [], newProjectStages);
  };

  const recalculateAndSetProject = (floors: any[], projectStages: any[]) => {
    if (!activeProject) return;
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

    const updatedProj: Project = {
      ...activeProject,
      floors,
      stages: projectStages,
      physical_progress: newPhysProgress,
    };
    updateActiveProjectInState(updatedProj);
  };

  const isClientHidden =
    activeRole === 'client' && (!activeProject || !activeProject.show_financials_to_clients);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateProject={handleCreateNewProject}
      />

      {/* Top Main Navbar */}
      <Navbar
        projects={projects}
        activeProject={activeProject}
        onSelectProject={handleSelectProject}
        activeRole={activeRole}
        onRoleChange={handleRoleChange}
        onOpenPortfolio={() => setActiveTab('portfolio')}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onSeedDemo={() => loadProjects(activeRole)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center animate-spin mb-4 shadow-lg shadow-amber-500/20">
              <Building2 className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white">İnşaat Verileri Yükleniyor...</h2>
            <p className="text-xs text-slate-400 mt-1">Gölgeden Yapıya çoklu proje servisi senkronize ediliyor</p>
          </div>
        ) : (
          <>
            {/* Top Sub-Navigation Tabs Bar */}
            <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-2 rounded-3xl flex items-center justify-between overflow-x-auto gap-2 shadow-2xl">
              <div className="flex items-center gap-1.5 min-w-max">
                <button
                  onClick={() => setActiveTab('portfolio')}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'portfolio'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Portföy (Tüm İnşaatlar)</span>
                </button>

                <button
                  onClick={() => setActiveTab('viewer')}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'viewer'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>Bina Görselleştirici</span>
                </button>

                <button
                  onClick={() => setActiveTab('stages')}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'stages'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  <span>{activeRole === 'contractor' ? 'Aşama & İmalat Yönetimi' : 'Daire Takibi & Saha'}</span>
                </button>

                <button
                  onClick={() => setActiveTab('finances')}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'finances'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>Finans & Gider Analizi</span>
                </button>

                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/25'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Gizlilik & Ayarlar</span>
                </button>
              </div>

              {/* Active Role Indicator Badge */}
              <div className="hidden lg:flex items-center gap-2 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-2xl text-xs">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-slate-400 font-semibold">
                  {activeRole === 'contractor' ? 'Müteahhit Modu' : 'Müşteri Modu'}
                </span>
              </div>
            </div>

            {/* TAB CONTENT RENDERING */}

            {/* Tab 1: All Projects Portfolio Gallery */}
            {activeTab === 'portfolio' && (
              <ProjectCardGrid
                projects={projects}
                activeProjectId={activeProjectId}
                onSelectProject={handleSelectProject}
                onOpenCreateModal={() => setIsCreateModalOpen(true)}
                activeRole={activeRole}
              />
            )}

            {/* Tab 2: Selected Project Building Viewer & Architectural Blueprint */}
            {activeTab === 'viewer' && activeProject && (
              <div className="space-y-6">
                <MetricsGrid project={activeProject} isClientHidden={isClientHidden} activeRole={activeRole} />
                <BuildingViewer
                  floors={activeProject.floors || []}
                  onToggleFloorStage={handleToggleFloorStage}
                  onToggleUnitStage={handleToggleUnitStage}
                  isContractor={activeRole === 'contractor'}
                />
              </div>
            )}

            {/* Tab 3: Stages, Checklists & Site Updates */}
            {activeTab === 'stages' && activeProject && (
              activeRole === 'contractor' ? (
                <ContractorDashboard
                  project={activeProject}
                  onUpdateVisibility={handleUpdateVisibility}
                  onAddExpense={handleAddExpense}
                  onToggleStage={handleToggleProjectStage}
                  onCreateNewProject={handleCreateNewProject}
                  initialTab="stages"
                />
              ) : (
                <ClientViewer project={activeProject} isClientHidden={isClientHidden} />
              )
            )}

            {/* Tab 4: Financial Charts & Expenses Logger */}
            {activeTab === 'finances' && activeProject && (
              <div className="space-y-6">
                {isClientHidden ? (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center max-w-xl mx-auto space-y-4 shadow-2xl">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                      <Lock className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Finansal Veriler Gizli</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Bu projenin harcama ve bütçe ayrıntıları müteahhit tarafından müşteri gizlilik ayarlarına uygun olarak maskelenmiştir.
                    </p>
                  </div>
                ) : (
                  <>
                    {activeRole === 'contractor' && (
                      <ContractorDashboard
                        project={activeProject}
                        onUpdateVisibility={handleUpdateVisibility}
                        onAddExpense={handleAddExpense}
                        onToggleStage={handleToggleProjectStage}
                        onCreateNewProject={handleCreateNewProject}
                        initialTab="expenses"
                      />
                    )}
                    <BudgetCharts project={activeProject} isClientHidden={isClientHidden} />
                  </>
                )}
              </div>
            )}

            {/* Tab 5: Privacy & Visibility Settings */}
            {activeTab === 'settings' && activeProject && (
              <div className="space-y-6">
                {activeRole === 'contractor' ? (
                  <ContractorDashboard
                    project={activeProject}
                    onUpdateVisibility={handleUpdateVisibility}
                    onAddExpense={handleAddExpense}
                    onToggleStage={handleToggleProjectStage}
                    onCreateNewProject={handleCreateNewProject}
                    initialTab="settings"
                  />
                ) : (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 text-center max-w-xl mx-auto space-y-4 shadow-2xl">
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Müşteri Gizlilik & Erişim Politikası</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Müşteri modundasınız. Proje izinleriniz şeffaf izleme yetkisiyle tanımlanmıştır. Projenin genel görünürlüğü:{' '}
                      <strong className="text-amber-400 uppercase">{activeProject.visibility}</strong>.
                    </p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-slate-400">Gölgeden Yapıya Platformu</span>
          </div>
          <span>Çoklu İnşaat & Canlı Doku Takip Sistemi • React TypeScript</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
