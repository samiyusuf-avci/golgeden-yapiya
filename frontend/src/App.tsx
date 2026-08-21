import { useEffect, useState } from 'react';
import type { Project, VisibilityType, Expense, MainTab, UserProfile } from './types';
import { ApiService } from './api';
import { enforceCascadeStageState } from './utils/stageDependencies';
import { Navbar } from './components/Navbar';
import { ProjectCardGrid } from './components/ProjectCardGrid';
import { MetricsGrid } from './components/MetricsGrid';
import { BuildingViewer } from './components/BuildingViewer';
import { BudgetCharts } from './components/BudgetCharts';
import { ContractorDashboard } from './components/ContractorDashboard';
import { CreateProjectModal } from './components/CreateProjectModal';
import { ProfileView } from './components/ProfileView';
import { FollowingView } from './components/FollowingView';
import { SalesView } from './components/SalesView';
import { syncProjectFloorSettings } from './utils/floorUtils';
import {
  Building2,
  LayoutGrid,
  ArrowLeft,
  Clock,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react';

export function App() {
  const [mainTab, setMainTab] = useState<MainTab>(() => {
    const saved = localStorage.getItem('golgeden_main_tab');
    return (saved as MainTab) || 'my-projects';
  });
  const [projectFilter, setProjectFilter] = useState<'all' | 'ongoing' | 'completed'>('all');
  const [isDetailView, setIsDetailView] = useState<boolean>(() => {
    return localStorage.getItem('golgeden_is_detail_view') === 'true';
  });
  const [detailSubTab, setDetailSubTab] = useState<'viewer' | 'finances' | 'settings' | 'sales'>(() => {
    const saved = localStorage.getItem('golgeden_detail_sub_tab');
    return (saved as any) || 'viewer';
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [followedProjects, setFollowedProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    return localStorage.getItem('golgeden_active_project_id') || null;
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(ApiService.getUserProfile());

  // State Persistence Effects
  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem('golgeden_active_project_id', activeProjectId);
    }
  }, [activeProjectId]);

  useEffect(() => {
    localStorage.setItem('golgeden_is_detail_view', String(isDetailView));
  }, [isDetailView]);

  useEffect(() => {
    localStorage.setItem('golgeden_detail_sub_tab', detailSubTab);
  }, [detailSubTab]);

  useEffect(() => {
    localStorage.setItem('golgeden_main_tab', mainTab);
  }, [mainTab]);

  // Load All Projects
  const loadProjects = async () => {
    setLoading(true);
    try {
      const list = (await ApiService.getProjects('contractor')).map((p) =>
        syncProjectFloorSettings(p)
      );
      setProjects(list);

      if (list.length > 1) {
        setFollowedProjects([list[1]]);
      }

      if (list.length > 0) {
        setActiveProjectId((prev) => {
          const storedId = localStorage.getItem('golgeden_active_project_id');
          if (storedId && list.some((p) => p.id === storedId)) return storedId;
          if (prev && list.some((p) => p.id === prev)) return prev;
          return list[0].id;
        });
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0] || null;

  const updateActiveProjectInState = (updated: Project) => {
    setProjects((prev) => {
      const next = prev.map((p) => (p.id === updated.id ? updated : p));
      ApiService.saveProjectsToStorage(next);
      return next;
    });
    setFollowedProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleSelectProject = (project: Project) => {
    setActiveProjectId(project.id);
    setIsDetailView(true);
    setDetailSubTab('viewer');
    setMainTab('my-projects');
  };

  const handleToggleFollow = (projectId: string) => {
    const isAlreadyFollowing = followedProjects.some((p) => p.id === projectId);
    if (isAlreadyFollowing) {
      setFollowedProjects((prev) => prev.filter((p) => p.id !== projectId));
    } else {
      const target = projects.find((p) => p.id === projectId);
      if (target) {
        setFollowedProjects((prev) => [...prev, target]);
      }
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    await ApiService.deleteProject(projectId);
    const updated = projects.filter((p) => p.id !== projectId);
    setProjects(updated);
    setFollowedProjects((prev) => prev.filter((p) => p.id !== projectId));
    ApiService.saveProjectsToStorage(updated);
    localStorage.setItem('golgeden_is_detail_view', 'false');
    localStorage.removeItem('golgeden_active_project_id');
    setIsDetailView(false);
    setActiveProjectId(updated.length > 0 ? updated[0].id : null);
  };

  const handleCreateNewProject = async (data: {
    name: string;
    location: string;
    total_budget: number;
    floor_count: number;
    units_per_floor: number;
    visibility: VisibilityType;
    show_financials_to_clients: boolean;
    estimated_completion_months: number;
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
      setIsDetailView(true);
      setDetailSubTab('viewer');
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
        estimated_completion_months: data.estimated_completion_months,
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
      setIsDetailView(true);
      setDetailSubTab('viewer');
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
      'contractor'
    );
    updateActiveProjectInState(updated);
  };

  const handleUpdateProjectSettings = async (settingsData: Partial<Project>) => {
    if (!activeProject) return;

    const newTotalBudget = settingsData.total_budget !== undefined ? settingsData.total_budget : activeProject.total_budget;
    const totalActual = activeProject.total_actual_cost || 0;
    const costVariance = newTotalBudget - totalActual;
    const finProg = newTotalBudget > 0 ? (totalActual / newTotalBudget) * 100 : 0;

    const updatedProj: Project = {
      ...activeProject,
      ...settingsData,
      total_budget: newTotalBudget,
      cost_variance: costVariance,
      financial_progress: Math.round(finProg * 10) / 10,
      last_update_date: new Date().toISOString().split('T')[0],
    };

    updateActiveProjectInState(updatedProj);

    try {
      await ApiService.updateProjectSettings(activeProject.id, settingsData, 'contractor');
    } catch (err) {
      console.warn('Backend update failed:', err);
    }
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

  const handleToggleFloorStage = (floorId: string, stageId: string, isCompleted: boolean) => {
    if (!activeProject || !activeProject.floors) return;
    ApiService.updateStage(stageId, isCompleted);

    const totalFloors = activeProject.floors.length;
    const targetFloor = activeProject.floors.find((f) => f.id === floorId);

    let isTopDuplex = false;
    try {
      const stored = localStorage.getItem(`golgeden_bina_ayarlari_${activeProject.id}`);
      if (stored) {
        const map = JSON.parse(stored);
        if (targetFloor && targetFloor.floor_number === totalFloors && map[targetFloor.id]?.type === 'duplex') {
          isTopDuplex = true;
        }
      }
    } catch (e) {}

    const mergedFloorNumber = isTopDuplex && targetFloor ? targetFloor.floor_number - 1 : null;
    const mergedFloor = mergedFloorNumber ? activeProject.floors.find((f) => f.floor_number === mergedFloorNumber) : null;

    const newFloors = activeProject.floors.map((f) => {
      if (f.id === floorId && f.stages) {
        const updatedStages = f.stages.map((st) =>
          st.id === stageId ? { ...st, is_completed: isCompleted } : st
        );
        const allDone = updatedStages.every((st) => st.is_completed);
        return { ...f, stages: updatedStages, is_completed: allDone };
      }
      if (mergedFloor && f.id === mergedFloor.id && f.stages) {
        const updatedStages = f.stages.map((st) => ({ ...st, is_completed: isCompleted }));
        const allDone = updatedStages.every((st) => st.is_completed);
        return { ...f, stages: updatedStages, is_completed: allDone };
      }
      return f;
    });

    recalculateAndSetProject(newFloors, activeProject.stages || []);
  };

  const handleToggleUnitStage = (unitId: string, stageId: string, isCompleted: boolean) => {
    if (!activeProject || !activeProject.floors) return;
    ApiService.updateStage(stageId, isCompleted);

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

  const handleToggleProjectStage = (stageId: string, isCompleted: boolean) => {
    if (!activeProject || !activeProject.stages) return;
    ApiService.updateStage(stageId, isCompleted);

    const newProjectStages = activeProject.stages.map((st) =>
      st.id === stageId ? { ...st, is_completed: isCompleted } : st
    );

    recalculateAndSetProject(activeProject.floors || [], newProjectStages);
  };

  const recalculateAndSetProject = (floors: any[], projectStages: any[]) => {
    if (!activeProject) return;

    // 1. Construct temporary project object
    const rawProj: Project = {
      ...activeProject,
      floors,
      stages: projectStages,
    };

    // 2. Enforce cascade rules (if a lower stage was uncompleted, cascade reset dependent upper stages)
    const sanitizedProj = enforceCascadeStageState(rawProj);

    // 3. Recalculate physical progress on sanitized project
    let totalWeight = 0;
    let completedWeight = 0;

    sanitizedProj.stages?.forEach((st) => {
      totalWeight += st.weight_percentage;
      if (st.is_completed) completedWeight += st.weight_percentage;
    });

    sanitizedProj.floors?.forEach((f) => {
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
      ...sanitizedProj,
      physical_progress: newPhysProgress,
      status: newPhysProgress >= 100 ? 'completed' : (sanitizedProj.status === 'completed' ? 'active' : sanitizedProj.status),
    };

    ApiService.saveProjectsToStorage(
      projects.map((p) => (p.id === updatedProj.id ? updatedProj : p))
    );
    updateActiveProjectInState(updatedProj);
  };

  // Filtered projects for the 3 tabs: Tüm Projelerim, Devam Eden Projelerim, Biten Projelerim
  const ongoingProjects = projects.filter(
    (p) => p.status !== 'completed' && p.physical_progress < 100
  );
  const completedProjects = projects.filter(
    (p) => p.status === 'completed' || p.physical_progress >= 100
  );

  const displayedProjects =
    projectFilter === 'ongoing'
      ? ongoingProjects
      : projectFilter === 'completed'
      ? completedProjects
      : projects;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateProject={handleCreateNewProject}
      />

      {/* Main Top Navbar */}
      <Navbar
        activeMainTab={mainTab}
        onSelectMainTab={(tab) => {
          setMainTab(tab);
          if (tab === 'my-projects') setIsDetailView(false);
        }}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        userProfile={userProfile}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center animate-spin mb-4 shadow-lg shadow-amber-500/20">
              <Building2 className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white">Şantiye Verileri Yükleniyor...</h2>
            <p className="text-xs text-slate-400 mt-1">Gölgeden Yapıya dijital şantiye platformu senkronize ediliyor</p>
          </div>
        ) : (
          <>
            {/* MAIN TAB 1: PROJELERİM */}
            {mainTab === 'my-projects' && (
              <div className="space-y-6">
                {!isDetailView ? (
                  <>
                    {/* Sub-Navigation Bar: ONLY 3 TABS (Tüm Projelerim, Devam Eden Projelerim, Biten Projelerim) */}
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-2 rounded-3xl flex items-center justify-between overflow-x-auto gap-2 shadow-2xl">
                      <div className="flex items-center gap-2 min-w-max">
                        <button
                          onClick={() => setProjectFilter('all')}
                          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                            projectFilter === 'all'
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/25'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                          }`}
                        >
                          <LayoutGrid className="w-4 h-4" />
                          <span>Tüm Projelerim ({projects.length})</span>
                        </button>

                        <button
                          onClick={() => setProjectFilter('ongoing')}
                          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                            projectFilter === 'ongoing'
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/25'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                          }`}
                        >
                          <Clock className="w-4 h-4" />
                          <span>Devam Eden Projelerim ({ongoingProjects.length})</span>
                        </button>

                        <button
                          onClick={() => setProjectFilter('completed')}
                          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                            projectFilter === 'completed'
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/25'
                              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                          }`}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Biten Projelerim ({completedProjects.length})</span>
                        </button>
                      </div>
                    </div>

                    {/* Filtered Project Cards Grid */}
                    <ProjectCardGrid
                      projects={displayedProjects}
                      activeProjectId={activeProjectId}
                      onSelectProject={handleSelectProject}
                      onOpenCreateModal={() => setIsCreateModalOpen(true)}
                      activeRole="contractor"
                    />
                  </>
                ) : (
                  /* PROJECT DETAIL VIEW WITH BACK BUTTON */
                  <div className="space-y-6">
                    {/* Top Detail Header Bar */}
                    <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                      <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                          onClick={() => setIsDetailView(false)}
                          className="bg-slate-950 hover:bg-slate-800 text-amber-400 border border-slate-800 hover:border-amber-500/40 px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Projelerim Listesine Dön</span>
                        </button>

                        {activeProject && (
                          <div className="hidden md:flex flex-col justify-center border-l border-slate-700/60 pl-4 ml-1">
                            <h3
                              className="text-sm font-extrabold leading-tight tracking-wide"
                              style={{
                                background: 'linear-gradient(90deg, #f59e0b, #fbbf24, #fde68a)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                              }}
                            >
                              {activeProject.name}
                            </h3>
                            <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-medium tracking-wider uppercase">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-amber-500/70" viewBox="0 0 24 24" fill="currentColor">
                                <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.003 3.5-4.697 3.5-8.327a8.25 8.25 0 00-16.5 0c0 3.63 1.556 6.324 3.5 8.327a19.58 19.58 0 002.683 2.282 16.975 16.975 0 001.144.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                              </svg>
                              {activeProject.location}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Detail Sub Tabs */}
                      <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                        <button
                          onClick={() => setDetailSubTab('viewer')}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                            detailSubTab === 'viewer'
                              ? 'bg-amber-500 text-slate-950 shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          3D Görselleştirici
                        </button>

                        <button
                          onClick={() => setDetailSubTab('finances')}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                            detailSubTab === 'finances'
                              ? 'bg-amber-500 text-slate-950 shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Finans &amp; Gider
                        </button>
                        <button
                          onClick={() => setDetailSubTab('sales')}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                            detailSubTab === 'sales'
                              ? 'bg-amber-500 text-slate-950 shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          Satış
                        </button>
                        <button
                          onClick={() => setDetailSubTab('settings')}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                            detailSubTab === 'settings'
                              ? 'bg-amber-500 text-slate-950 shadow-md'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          Ayarlar
                        </button>
                      </div>
                    </div>

                    {/* Detail Active View Content */}
                    {activeProject && detailSubTab === 'viewer' && (
                      <div className="space-y-6">
                        <MetricsGrid project={activeProject} isClientHidden={false} activeRole="contractor" />
                        <BuildingViewer
                          project={activeProject}
                          floors={activeProject.floors || []}
                          onToggleFloorStage={handleToggleFloorStage}
                          onToggleUnitStage={handleToggleUnitStage}
                          onUpdateProject={updateActiveProjectInState}
                          isContractor={true}
                        />
                        <ContractorDashboard
                          project={activeProject}
                          onUpdateVisibility={handleUpdateVisibility}
                          onAddExpense={handleAddExpense}
                          onToggleStage={handleToggleProjectStage}
                          onCreateNewProject={handleCreateNewProject}
                          onDeleteProject={handleDeleteProject}
                          initialTab="stages"
                        />
                      </div>
                    )}

                    {activeProject && detailSubTab === 'finances' && (
                      <div className="space-y-6">
                        <ContractorDashboard
                          project={activeProject}
                          onUpdateVisibility={handleUpdateVisibility}
                          onAddExpense={handleAddExpense}
                          onToggleStage={handleToggleProjectStage}
                          onCreateNewProject={handleCreateNewProject}
                          onDeleteProject={handleDeleteProject}
                          initialTab="expenses"
                        />
                        <BudgetCharts project={activeProject} isClientHidden={false} />
                      </div>
                    )}

                    {activeProject && detailSubTab === 'settings' && (
                      <ContractorDashboard
                        project={activeProject}
                        onUpdateVisibility={handleUpdateVisibility}
                        onUpdateProjectSettings={handleUpdateProjectSettings}
                        onAddExpense={handleAddExpense}
                        onToggleStage={handleToggleProjectStage}
                        onCreateNewProject={handleCreateNewProject}
                        onDeleteProject={handleDeleteProject}
                        initialTab="settings"
                      />
                    )}

                    {activeProject && detailSubTab === 'sales' && (
                      <SalesView
                        project={activeProject}
                        onUpdateProject={updateActiveProjectInState}
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {/* MAIN TAB 2: TAKİP ETTİKLERİM */}
            {mainTab === 'following' && (
              <FollowingView
                followedProjects={followedProjects}
                allProjects={projects}
                onSelectProject={handleSelectProject}
                onToggleFollow={handleToggleFollow}
              />
            )}

            {/* MAIN TAB 3: PROFİL */}
            {mainTab === 'profile' && (
              <ProfileView
                profile={userProfile}
                projects={projects}
                followedProjects={followedProjects}
                onUpdateProfile={(updated) => setUserProfile(updated)}
              />
            )}
          </>
        )}
      </main>

      {/* Main Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-slate-400">Gölgeden Yapıya Platformu</span>
          </div>
          <span>Şeffaf Proje Takip & Canlı Şantiye Portalı • React TypeScript</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
