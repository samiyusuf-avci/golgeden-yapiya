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
import { AuthModal } from './components/AuthModal';
import { syncProjectFloorSettings } from './utils/floorUtils';
import {
  Building2,
  LayoutGrid,
  ArrowLeft,
  Clock,
  CheckCircle2,
  ShoppingBag,
  AlertCircle,
  Eye,
  Shield,
  MapPin,
  UserCircle,
  Mail,
  Phone,
} from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<any | null>(() => {
    const stored = localStorage.getItem('golgeden_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [mainTab, setMainTab] = useState<MainTab>(() => {
    const saved = localStorage.getItem('golgeden_main_tab');
    return (saved as MainTab) || 'my-projects';
  });
  const [projectFilter, setProjectFilter] = useState<'all' | 'ongoing' | 'completed'>('all');
  const [isDetailView, setIsDetailView] = useState<boolean>(() => {
    return localStorage.getItem('golgeden_is_detail_view') === 'true';
  });
  const [detailSubTab, setDetailSubTab] = useState<'viewer' | 'finances' | 'settings' | 'sales' | 'publisher'>(() => {
    const saved = localStorage.getItem('golgeden_detail_sub_tab');
    return (saved as any) || 'viewer';
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [publicProjects, setPublicProjects] = useState<Project[]>([]);
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

  // Browser back button: push a history entry when entering detail view,
  // and pop back to list view when the user presses the browser back button.
  useEffect(() => {
    if (isDetailView) {
      // Push a new entry so the back button has somewhere to go within the app
      window.history.pushState({ detailView: true }, '');
    }
  }, [isDetailView]);

  useEffect(() => {
    const handlePopState = () => {
      // If we were in detail view, go back to list instead of leaving the site
      setIsDetailView((prev) => {
        if (prev) {
          return false;
        }
        return prev;
      });
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Followed Projects Persistence Utilities
  const getFollowedStorageKey = (user = currentUser) => {
    if (user?.id) return `golgeden_followed_ids_${user.id}`;
    if (user?.email) return `golgeden_followed_ids_${user.email}`;
    if (user?.isGuest) return `golgeden_followed_ids_guest`;
    return 'golgeden_followed_ids';
  };

  const getStoredFollowedIds = (user = currentUser): string[] | null => {
    const key = getFollowedStorageKey(user);
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const saveStoredFollowedIds = (ids: string[], user = currentUser) => {
    const key = getFollowedStorageKey(user);
    localStorage.setItem(key, JSON.stringify(ids));
  };

  const syncFollowedProjects = (currentProjects: Project[], publicList: Project[] = publicProjects, user = currentUser) => {
    const showcase = ApiService.getShowcaseProjects().map((p) => syncProjectFloorSettings(p));
    const discoverable = Array.from(
      new Map([
        ...showcase.map((p) => [p.id, p] as const),
        ...publicList.map((p) => [p.id, p] as const),
        ...currentProjects.map((p) => [p.id, p] as const),
      ]).values()
    );

    const storedIds = getStoredFollowedIds(user);
    if (storedIds !== null) {
      const followed = discoverable.filter((p) => storedIds.includes(p.id));
      setFollowedProjects(followed);
    } else {
      if (currentProjects.length > 1) {
        const defaultFollowed = [currentProjects[1]];
        setFollowedProjects(defaultFollowed);
        saveStoredFollowedIds(defaultFollowed.map((p) => p.id), user);
      } else {
        setFollowedProjects([]);
        saveStoredFollowedIds([], user);
      }
    }
  };

  // Load All Projects for Logged in User
  const loadProjects = async (userToUse = currentUser) => {
    setLoading(true);
    try {
      const [list, fetchedPublic] = await Promise.all([
        ApiService.getProjects('contractor'),
        ApiService.getPublicProjects('contractor'),
      ]);
      const normalizedList = list.map((p) => syncProjectFloorSettings(p));
      const normalizedPublic = fetchedPublic.map((p) => syncProjectFloorSettings(p));

      setProjects(normalizedList);
      setPublicProjects(normalizedPublic);
      syncFollowedProjects(normalizedList, normalizedPublic, userToUse);

      const showcase = ApiService.getShowcaseProjects().map((p) => syncProjectFloorSettings(p));
      const allKnownIds = new Set([
        ...normalizedList.map((p) => p.id),
        ...normalizedPublic.map((p) => p.id),
        ...showcase.map((p) => p.id),
      ]);

      setActiveProjectId((prev) => {
        const storedId = localStorage.getItem('golgeden_active_project_id');
        // Prefer stored ID if it's in any known source
        if (storedId && allKnownIds.has(storedId)) return storedId;
        if (prev && allKnownIds.has(prev)) return prev;
        // Fall back to first own project, or null
        return normalizedList.length > 0 ? normalizedList[0].id : null;
      });
    } catch (err: any) {
      if (err.message === 'Unauthorized') {
        setCurrentUser(null);
      }
      console.error('Failed to load projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkAuthAndLoad = async () => {
      const user = await ApiService.getCurrentUser();
      if (user) {
        setCurrentUser(user);
        setUserProfile(ApiService.getUserProfile());
        await loadProjects(user);
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    };
    checkAuthAndLoad();
  }, []);

  const [guestNotice, setGuestNotice] = useState<string | null>(null);

  const preventGuestAction = (actionName: string): boolean => {
    if (currentUser?.isGuest) {
      setGuestNotice(`⚠️ Misafir Modu: ${actionName} işlemi sadece kayıtlı kullanıcılar içindir. Lütfen giriş yapın.`);
      setTimeout(() => setGuestNotice(null), 4500);
      return true;
    }
    return false;
  };

  const handleGuestLogin = () => {
    const guestUser = { name: 'Misafir Kullanıcı', isGuest: true };
    setCurrentUser(guestUser);
    const mockList = ApiService.getShowcaseProjects().map((p) => syncProjectFloorSettings(p));
    setProjects([]); // Projelerim is empty for guest users
    syncFollowedProjects([], publicProjects, guestUser);
    if (mockList.length > 0) {
      setActiveProjectId(mockList[0].id);
    }
    setMainTab('following'); // Land on Takip Ettiklerim / Keşfet tab automatically
  };

  const handleAuthSuccess = (user: any) => {
    setCurrentUser(user);
    setUserProfile(ApiService.getUserProfile());
    loadProjects(user);
  };

  const handleLogout = () => {
    ApiService.logout();
    setCurrentUser(null);
    setProjects([]);
    setFollowedProjects([]);
    setActiveProjectId(null);
  };

  const showcaseProjects = ApiService.getShowcaseProjects().map((p) => syncProjectFloorSettings(p));
  const allDiscoverableProjects = Array.from(
    new Map([
      ...showcaseProjects.map((p) => [p.id, p] as const),
      ...publicProjects.map((p) => [p.id, p] as const),
      ...projects.map((p) => [p.id, p] as const),
    ]).values()
  );

  const activeProject = currentUser?.isGuest
    ? projects.find((p) => p.id === activeProjectId) ||
      followedProjects.find((p) => p.id === activeProjectId) ||
      allDiscoverableProjects.find((p) => p.id === activeProjectId) ||
      showcaseProjects.find((p) => p.id === activeProjectId) ||
      showcaseProjects[0] ||
      null
    : projects.find((p) => p.id === activeProjectId) ||
      followedProjects.find((p) => p.id === activeProjectId) ||
      allDiscoverableProjects.find((p) => p.id === activeProjectId) ||
      projects[0] ||
      null;

  const isProjectOwner = (activeProject && mainTab === 'my-projects')
    ? !currentUser?.isGuest && projects.some((p) => p.id === activeProject.id)
    : false;

  const isReadOnly = !isProjectOwner || Boolean(currentUser?.isGuest);

  const updateActiveProjectInState = (updated: Project) => {
    setProjects((prev) => {
      const next = prev.map((p) => (p.id === updated.id ? updated : p));
      ApiService.saveProjectsToStorage(next);
      return next;
    });
    setPublicProjects((prev) => {
      if (updated.visibility === 'public') {
        const exists = prev.some((p) => p.id === updated.id);
        return exists ? prev.map((p) => (p.id === updated.id ? updated : p)) : [updated, ...prev];
      } else {
        return prev.filter((p) => p.id !== updated.id);
      }
    });
    setFollowedProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  };

  const isFinancialsAllowed = !isReadOnly;

  useEffect(() => {
    if (isDetailView && !isFinancialsAllowed && detailSubTab === 'finances') {
      setDetailSubTab('viewer');
    }
  }, [isDetailView, isFinancialsAllowed, detailSubTab]);

  // If detail view is active but the project can't be found (e.g. after refresh), fall back to list
  useEffect(() => {
    if (isDetailView && !loading && activeProject === null) {
      setIsDetailView(false);
    }
  }, [isDetailView, loading, activeProject]);

  if (!currentUser) {
    return <AuthModal onSuccess={handleAuthSuccess} onGuestLogin={handleGuestLogin} />;
  }

  const handleSelectProject = (project: Project) => {
    setActiveProjectId(project.id);
    setIsDetailView(true);
    setDetailSubTab('viewer');
  };

  const renderProjectDetailView = () => (
    <div className="space-y-6">
      {/* Top Detail Header Bar */}
      <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => {
              setIsDetailView(false);
              if (isReadOnly) {
                setMainTab('following');
              }
            }}
            className="bg-slate-950 hover:bg-slate-800 text-amber-400 border border-slate-800 hover:border-amber-500/40 px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isReadOnly ? 'Keşfet & Takip Listesine Dön' : 'Projelerim Listesine Dön'}</span>
          </button>

          {activeProject && (
            <div className="hidden md:flex flex-col justify-center border-l border-slate-700/60 pl-4 ml-1">
              <div className="flex items-center gap-2">
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
                {isReadOnly ? (
                  <span className="bg-sky-500/10 text-sky-300 border border-sky-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                    <Eye className="w-3 h-3 text-sky-400" /> Sadece İnceleme Modu (Salt Okunur)
                  </span>
                ) : (
                  <span className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-400" /> Kendi Projeniz (Düzenleme Yetkili)
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5 font-medium tracking-wider uppercase">
                <MapPin className="w-3 h-3 text-amber-500/70" />
                {activeProject.location}
              </p>
            </div>
          )}
        </div>

        {/* Detail Sub Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setDetailSubTab('viewer')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${detailSubTab === 'viewer'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            3D Görselleştirici
          </button>

          {isFinancialsAllowed && (
            <button
              onClick={() => setDetailSubTab('finances')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${detailSubTab === 'finances'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              Finans &amp; Gider
            </button>
          )}
          <button
            onClick={() => setDetailSubTab('sales')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${detailSubTab === 'sales'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
              }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Satış
          </button>
          {isReadOnly && (
            <button
              onClick={() => setDetailSubTab('publisher')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${detailSubTab === 'publisher'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              <UserCircle className="w-3.5 h-3.5" />
              Yayıncı Profili
            </button>
          )}
          {!isReadOnly && (
            <button
              onClick={() => setDetailSubTab('settings')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${detailSubTab === 'settings'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
                }`}
            >
              Ayarlar
            </button>
          )}
        </div>
      </div>

      {/* Detail Active View Content */}
      {activeProject && detailSubTab === 'viewer' && (
        <div className="space-y-6">
          <MetricsGrid
            project={activeProject}
            isClientHidden={isReadOnly}
            activeRole={isReadOnly ? 'client' : 'contractor'}
          />
          <BuildingViewer
            project={activeProject}
            floors={activeProject.floors || []}
            onToggleFloorStage={handleToggleFloorStage}
            onToggleUnitStage={handleToggleUnitStage}
            onUpdateProject={updateActiveProjectInState}
            isContractor={true}
            isGuest={currentUser?.isGuest}
            isReadOnly={isReadOnly}
          />
          <ContractorDashboard
            project={activeProject}
            onUpdateVisibility={handleUpdateVisibility}
            onAddExpense={handleAddExpense}
            onToggleStage={handleToggleProjectStage}
            onCreateNewProject={handleCreateNewProject}
            onDeleteProject={handleDeleteProject}
            initialTab="stages"
            isGuest={currentUser?.isGuest}
            isReadOnly={isReadOnly}
          />
        </div>
      )}

      {activeProject && detailSubTab === 'finances' && isFinancialsAllowed && (
        <div className="space-y-6">
          <ContractorDashboard
            project={activeProject}
            onUpdateVisibility={handleUpdateVisibility}
            onAddExpense={handleAddExpense}
            onToggleStage={handleToggleProjectStage}
            onCreateNewProject={handleCreateNewProject}
            onDeleteProject={handleDeleteProject}
            initialTab="expenses"
            isGuest={currentUser?.isGuest}
            isReadOnly={isReadOnly}
          />
          <BudgetCharts project={activeProject} isClientHidden={isReadOnly} />
        </div>
      )}

      {activeProject && detailSubTab === 'settings' && !isReadOnly && (
        <ContractorDashboard
          project={activeProject}
          onUpdateVisibility={handleUpdateVisibility}
          onUpdateProjectSettings={handleUpdateProjectSettings}
          onAddExpense={handleAddExpense}
          onToggleStage={handleToggleProjectStage}
          onCreateNewProject={handleCreateNewProject}
          onDeleteProject={handleDeleteProject}
          initialTab="settings"
          isGuest={currentUser?.isGuest}
          isReadOnly={isReadOnly}
        />
      )}

      {activeProject && detailSubTab === 'sales' && (
        <SalesView
          project={activeProject}
          onUpdateProject={updateActiveProjectInState}
          isGuest={currentUser?.isGuest}
          isReadOnly={isReadOnly}
        />
      )}

      {activeProject && detailSubTab === 'publisher' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-800">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 border border-amber-500/30 flex items-center justify-center">
                <UserCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white tracking-tight">Proje Yayıncısı</h3>
                <p className="text-xs text-slate-400">Bu şantiyeyi platforma ekleyen ve yöneten kişi</p>
              </div>
            </div>

            {/* Publisher Card */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/30 to-yellow-600/10 border-2 border-amber-500/40 flex items-center justify-center flex-shrink-0 shadow-lg">
                <UserCircle className="w-10 h-10 text-amber-400" />
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left space-y-3">
                <div>
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {activeProject.contractor_name ||
                      (isReadOnly ? 'Proje Yüklenicisi' : userProfile.name || 'Proje Yüklenicisi')}
                  </h2>
                  {!isReadOnly && userProfile.title && (
                    <p className="text-sm text-amber-400 font-semibold mt-0.5">{userProfile.title}</p>
                  )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  {(!isReadOnly && userProfile.company) && (
                    <span className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-xl">
                      <Building2 className="w-3.5 h-3.5 text-amber-400" />
                      {userProfile.company}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-xl">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    {activeProject.location}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-amber-400">
                  {isReadOnly
                    ? allDiscoverableProjects.filter((p) => p.contractor_id === activeProject.contractor_id && (p.visibility === 'public' || !p.visibility)).length
                    : projects.length}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Aktif Proje</div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-center">
                <div className="text-2xl font-black text-emerald-400">
                  {activeProject.physical_progress.toFixed(0)}%
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Bu Proje İlerleme</div>
              </div>
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-center col-span-2 sm:col-span-1">
                <div className="text-2xl font-black text-sky-400">
                  {activeProject.status === 'completed' ? '✓' : activeProject.status === 'active' ? '●' : '○'}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                  {activeProject.status === 'completed' ? 'Tamamlandı' : activeProject.status === 'active' ? 'Aktif' : 'Planlama'}
                </div>
              </div>
            </div>

            {/* Contact (only for own profile) */}
            {!isReadOnly && (userProfile.email || userProfile.phone) && (
              <div className="mt-6 pt-5 border-t border-slate-800">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">İletişim</p>
                <div className="flex flex-wrap gap-3">
                  {userProfile.email && (
                    <a
                      href={`mailto:${userProfile.email}`}
                      className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition"
                    >
                      <Mail className="w-3.5 h-3.5 text-amber-400" />
                      {userProfile.email}
                    </a>
                  )}
                  {userProfile.phone && (
                    <a
                      href={`tel:${userProfile.phone}`}
                      className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition"
                    >
                      <Phone className="w-3.5 h-3.5 text-amber-400" />
                      {userProfile.phone}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Publisher's Projects */}
            {(() => {
              const publisherProjects = isReadOnly
                ? allDiscoverableProjects.filter(
                    (p) =>
                      p.contractor_id === activeProject.contractor_id &&
                      (p.visibility === 'public' || !p.visibility)
                  )
                : projects;
              if (publisherProjects.length === 0) return null;
              return (
                <div className="mt-6 pt-5 border-t border-slate-800">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
                    Yayıncının Projeleri
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {publisherProjects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          handleSelectProject(p);
                          setDetailSubTab('viewer');
                        }}
                        className={`text-left bg-slate-950/60 hover:bg-slate-800/80 border rounded-2xl p-4 transition group cursor-pointer ${
                          p.id === activeProject.id
                            ? 'border-amber-500/50 bg-amber-500/5'
                            : 'border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate group-hover:text-amber-300 transition">
                              {p.name}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-amber-500/60 flex-shrink-0" />
                              {p.location}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg flex-shrink-0 ${
                              p.status === 'completed'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : p.status === 'active'
                                ? 'bg-amber-500/15 text-amber-400'
                                : 'bg-slate-700/60 text-slate-400'
                            }`}
                          >
                            {p.status === 'completed'
                              ? 'Tamamlandı'
                              : p.status === 'active'
                              ? 'Aktif'
                              : 'Planlama'}
                          </span>
                        </div>
                        {/* Progress bar */}
                        <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2">
                          <div
                            className="bg-amber-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${p.physical_progress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1.5 font-semibold">
                          %{p.physical_progress.toFixed(0)} fiziksel ilerleme
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );

  const handleToggleFollow = (projectId: string) => {
    if (preventGuestAction('Şantiye takip etme')) return;
    const isAlreadyFollowing = followedProjects.some((p) => p.id === projectId);
    let nextFollowed: Project[];
    if (isAlreadyFollowing) {
      nextFollowed = followedProjects.filter((p) => p.id !== projectId);
    } else {
      const target = allDiscoverableProjects.find((p) => p.id === projectId);
      if (target) {
        nextFollowed = [...followedProjects, target];
      } else {
        nextFollowed = followedProjects;
      }
    }
    setFollowedProjects(nextFollowed);
    saveStoredFollowedIds(nextFollowed.map((p) => p.id), currentUser);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (preventGuestAction('Proje silme')) return;
    await ApiService.deleteProject(projectId);
    const updated = projects.filter((p) => p.id !== projectId);
    setProjects(updated);
    const nextFollowed = followedProjects.filter((p) => p.id !== projectId);
    setFollowedProjects(nextFollowed);
    saveStoredFollowedIds(nextFollowed.map((p) => p.id), currentUser);
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
    visibility: VisibilityType;
    show_financials_to_clients: boolean;
    estimated_completion_months: number;
  }) => {
    if (preventGuestAction('Yeni proje oluşturma')) return;
    setLoading(true);
    try {
      const createdProj = await ApiService.createProject(data);
      const newProj = syncProjectFloorSettings(createdProj);
      setProjects((prev) => [newProj, ...prev]);
      if (newProj.visibility === 'public') {
        setPublicProjects((prev) => [newProj, ...prev.filter((p) => p.id !== newProj.id)]);
      }
      setActiveProjectId(newProj.id);
      setIsDetailView(true);
      setDetailSubTab('viewer');

    } catch (err) {
      console.warn('Backend unavailable, constructing new project locally', err);
      // Create local project with empty floors (user will add floors from building settings)
      const localNewProject: Project = {
        id: `proj-${Date.now()}`,
        contractor_id: 'c-demo-1',
        name: data.name,
        location: data.location || 'Türkiye',
        description: `Yeni Başlanan İnşaat Projesi`,
        estimated_completion_months: data.estimated_completion_months,
        status: 'planning',
        unit_count: 0,
        total_budget: data.total_budget,
        visibility: data.visibility,
        show_financials_to_clients: data.show_financials_to_clients,
        physical_progress: 0,
        financial_progress: 0,
        total_actual_cost: 0,
        cost_variance: data.total_budget,
        floors: [],

        expenses: [],
        stages: [
          {
            id: `st-p-1`,
            project_id: `proj-${Date.now()}`,
            name: 'Ruhsat ve Proje Onayı',
            category: 'official',
            estimated_cost: data.total_budget * 0.05,
            actual_cost: 0,
            weight_percentage: 5,
            is_completed: false,
            order_index: 1,
          },
          {
            id: `st-p-2`,
            project_id: `proj-${Date.now()}`,
            name: 'Temel Kazı ve Hafriyat',
            category: 'material',
            estimated_cost: data.total_budget * 0.1,
            actual_cost: 0,
            weight_percentage: 10,
            is_completed: false,
            order_index: 2,
          },
          {
            id: `st-p-3`,
            project_id: `proj-${Date.now()}`,
            name: 'Temel Radye Beton',
            category: 'material',
            estimated_cost: data.total_budget * 0.15,
            actual_cost: 0,
            weight_percentage: 15,
            is_completed: false,
            order_index: 3,
          },
          {
            id: `st-p-4`,
            project_id: `proj-${Date.now()}`,
            name: 'Çevre Çiti ve Şantiye Kurulumu',
            category: 'labor',
            estimated_cost: data.total_budget * 0.05,
            actual_cost: 0,
            weight_percentage: 5,
            is_completed: false,
            order_index: 4,
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
    if (preventGuestAction('Proje görünürlüğünü değiştirme')) return;
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
    if (preventGuestAction('Proje ayarlarını güncelleme')) return;
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
    if (preventGuestAction('Masraf/Fatura ekleme')) return;
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
    if (preventGuestAction('Aşama durumunu değiştirme')) return;
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
    } catch (e) { }

    const mergedFloorNumber = isTopDuplex && targetFloor ? targetFloor.floor_number - 1 : null;
    const mergedFloor = mergedFloorNumber ? activeProject.floors.find((f) => f.floor_number === mergedFloorNumber) : null;

    const newFloors = activeProject.floors.map((f) => {
      if (f.id === floorId) {
        let currentStages = f.stages ? [...f.stages] : [];
        const stageExists = currentStages.some((st) => st.id === stageId);
        if (!stageExists) {
          const firstStage = currentStages[0];
          currentStages.push({
            id: stageId,
            project_id: activeProject.id,
            floor_id: f.id,
            name: `${f.floor_number}. Kat Tuğla Duvar Örme & Bölmeler`,
            category: 'labor',
            estimated_cost: firstStage ? Math.round((firstStage.estimated_cost || 1000000) * 0.65) : 800000,
            actual_cost: isCompleted ? 780000 : 0,
            weight_percentage: 6,
            is_completed: isCompleted,
            order_index: 2,
          });
        }
        const updatedStages = currentStages.map((st) =>
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
      {/* Guest Action Notice Floating Banner */}
      {guestNotice && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-amber-500 text-slate-950 px-6 py-3 rounded-2xl shadow-2xl font-bold text-xs flex items-center gap-3 border border-amber-300 backdrop-blur-md animate-bounce">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{guestNotice}</span>
          <button onClick={() => setGuestNotice(null)} className="ml-2 font-black text-sm">✕</button>
        </div>
      )}

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
          // If clicking the already-active tab while in detail view → go back to list
          if (tab === mainTab && isDetailView) {
            setIsDetailView(false);
            return;
          }
          setMainTab(tab);
          if (tab === 'my-projects' || tab === 'following') setIsDetailView(false);
        }}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        userProfile={userProfile}
        onLogout={handleLogout}
        isGuest={currentUser?.isGuest}
        onOpenAuthModal={() => setCurrentUser(null)}
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
                  currentUser?.isGuest ? (
                    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-12 text-center space-y-4 shadow-2xl animate-fadeIn">
                      <div className="mx-auto w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                        <Eye className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-bold text-white">Misafir Modu - Kendi Projeniz Bulunmamaktadır</h3>
                      <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                        Misafir kullanıcıların "Projelerim" alanında kayıtlı projesi bulunmaz. Yayında olan örnek şantiyeleri ve projeleri incelemek için <strong>"Takip Ettiklerim"</strong> sekmesine geçebilir veya kendi projelerinizi yönetmek için Giriş Yapabilirsiniz.
                      </p>
                      <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                        <button
                          onClick={() => setMainTab('following')}
                          className="px-5 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer hover:from-amber-400 hover:to-yellow-300 transition"
                        >
                          Yayındaki Projeleri İncele (Takip Ettiklerim)
                        </button>
                        <button
                          onClick={() => setCurrentUser(null)}
                          className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 cursor-pointer transition"
                        >
                          Giriş Yap / Kayıt Ol
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Sub-Navigation Bar: ONLY 3 TABS (Tüm Projelerim, Devam Eden Projelerim, Biten Projelerim) */}
                      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-2 rounded-3xl flex items-center justify-between overflow-x-auto gap-2 shadow-2xl">
                        <div className="flex items-center gap-2 min-w-max">
                          <button
                            onClick={() => setProjectFilter('all')}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${projectFilter === 'all'
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/25'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                              }`}
                          >
                            <LayoutGrid className="w-4 h-4" />
                            <span>Tüm Projelerim ({projects.length})</span>
                          </button>

                          <button
                            onClick={() => setProjectFilter('ongoing')}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${projectFilter === 'ongoing'
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/25'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                              }`}
                          >
                            <Clock className="w-4 h-4" />
                            <span>Devam Eden Projelerim ({ongoingProjects.length})</span>
                          </button>

                          <button
                            onClick={() => setProjectFilter('completed')}
                            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${projectFilter === 'completed'
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
                  )
                ) : (
                  renderProjectDetailView()
                )}
              </div>
            )}

            {/* MAIN TAB 2: TAKİP ETTİKLERİM / KEŞFET */}
            {mainTab === 'following' && (
              !isDetailView ? (
                <FollowingView
                  followedProjects={followedProjects}
                  allProjects={allDiscoverableProjects}
                  onSelectProject={handleSelectProject}
                  onToggleFollow={handleToggleFollow}
                  isGuest={currentUser?.isGuest}
                />
              ) : (
                renderProjectDetailView()
              )
            )}

            {/* MAIN TAB 3: PROFİL */}
            {mainTab === 'profile' && (
              <ProfileView
                profile={userProfile}
                projects={projects}
                followedProjects={followedProjects}
                allProjects={allDiscoverableProjects}
                onUpdateProfile={(updated) => setUserProfile(updated)}
                isGuest={currentUser?.isGuest}
                onOpenAuthModal={() => setCurrentUser(null)}
                onSelectMainTab={setMainTab}
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

