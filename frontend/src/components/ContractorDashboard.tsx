import React, { useState, useEffect } from 'react';
import type { Project, ExpenseCategory, VisibilityType, Expense } from '../types';
import {
  PlusCircle,
  Shield,
  Eye,
  Lock,
  Globe,
  FileText,
  Save,
  CheckCircle2,
  UserCheck,
  Wallet,
  Package,
  HardHat,
  FileCheck2,
  Wrench,
  Trash2,
  AlertTriangle,
  Building2,
  MapPin,
  Sliders,
  ShoppingBag,
} from 'lucide-react';
import { CreateProjectModal } from './CreateProjectModal';
import { CustomCategorySelect } from './CustomCategorySelect';
import { CustomDurationSelect } from './CustomDurationSelect';
import { CustomDatePicker } from './CustomDatePicker';
import { DeleteProjectModal } from './DeleteProjectModal';
import { checkProjectStageStatus } from '../utils/stageDependencies';

const getCategoryBadge = (category: string) => {
  switch (category) {
    case 'material':
      return (
        <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-amber-300 font-semibold px-2.5 py-1 rounded-lg text-[11px] border border-amber-500/30">
          <Package className="w-3.5 h-3.5 text-amber-400" />
          Malzeme & Beton
        </span>
      );
    case 'labor':
      return (
        <span className="inline-flex items-center gap-1.5 bg-sky-500/10 text-sky-300 font-semibold px-2.5 py-1 rounded-lg text-[11px] border border-sky-500/30">
          <HardHat className="w-3.5 h-3.5 text-sky-400" />
          İşçilik & Kalıp
        </span>
      );
    case 'official':
      return (
        <span className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-300 font-semibold px-2.5 py-1 rounded-lg text-[11px] border border-emerald-500/30">
          <FileCheck2 className="w-3.5 h-3.5 text-emerald-400" />
          Resmi Harç
        </span>
      );
    case 'subcontractor':
      return (
        <span className="inline-flex items-center gap-1.5 bg-purple-500/10 text-purple-300 font-semibold px-2.5 py-1 rounded-lg text-[11px] border border-purple-500/30">
          <Wrench className="w-3.5 h-3.5 text-purple-400" />
          Taşeron & Tesisat
        </span>
      );
    default:
      return (
        <span className="bg-slate-800 text-slate-300 font-semibold px-2.5 py-1 rounded-lg text-[11px] border border-slate-700">
          {category}
        </span>
      );
  }
};

const formatDateTr = (dateStr: string) => {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return dateStr;
};

interface ContractorDashboardProps {
  project: Project;
  onUpdateVisibility: (visibility: VisibilityType, showFinancials: boolean) => void;
  onUpdateProjectSettings?: (settingsData: Partial<Project>) => void;
  onAddExpense: (expense: Partial<Expense>) => void;
  onToggleStage: (stageId: string, isCompleted: boolean) => void;
  onCreateNewProject: (projectData: any) => void;
  onDeleteProject?: (projectId: string) => void;
  initialTab?: 'expenses' | 'settings' | 'stages';
  isGuest?: boolean;
  isReadOnly?: boolean;
}

export const ContractorDashboard: React.FC<ContractorDashboardProps> = ({
  project,
  onUpdateVisibility: rawUpdateVisibility,
  onUpdateProjectSettings: rawUpdateProjectSettings,
  onAddExpense: rawAddExpense,
  onToggleStage: rawToggleStage,
  onCreateNewProject: rawCreateNewProject,
  onDeleteProject: rawDeleteProject,
  initialTab = 'expenses',
  isGuest = false,
  isReadOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'settings' | 'stages'>(initialTab);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showReadOnlyWarning = (actionName: string) => {
    if (isGuest) {
      setToastMessage(`⚠️ Misafir Modu: ${actionName} işlemi misafirlere engellenmiştir. Lütfen Giriş Yapın.`);
      setTimeout(() => setToastMessage(null), 4000);
    }
  };

  const onUpdateVisibility = (visibility: VisibilityType, showFinancials: boolean) => {
    if (isGuest || isReadOnly) { showReadOnlyWarning('Görünürlük değiştirme'); return; }
    rawUpdateVisibility(visibility, showFinancials);
  };

  const onUpdateProjectSettings = (settingsData: Partial<Project>) => {
    if (isGuest || isReadOnly) { showReadOnlyWarning('Ayar güncelleme'); return; }
    if (rawUpdateProjectSettings) rawUpdateProjectSettings(settingsData);
  };

  const onAddExpense = (expense: Partial<Expense>) => {
    if (isGuest || isReadOnly) { showReadOnlyWarning('Masraf ekleme'); return; }
    rawAddExpense(expense);
  };

  const onToggleStage = (stageId: string, isCompleted: boolean) => {
    if (isGuest || isReadOnly) { return; }
    rawToggleStage(stageId, isCompleted);
  };

  const onCreateNewProject = (projectData: any) => {
    if (isGuest) { showReadOnlyWarning('Yeni proje oluşturma'); return; }
    rawCreateNewProject(projectData);
  };

  const onDeleteProject = (projectId: string) => {
    if (isGuest || isReadOnly) { showReadOnlyWarning('Proje silme'); return; }
    if (rawDeleteProject) rawDeleteProject(projectId);
  };

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // New Expense Form State
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('material');
  const [expenseAmount, setExpenseAmount] = useState<string>('');
  const [expenseNotes, setExpenseNotes] = useState<string>('');
  const [invoiceUrl, setInvoiceUrl] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Settings State
  const [name, setName] = useState<string>(project.name || '');
  const [location, setLocation] = useState<string>(project.location || '');
  const [description, setDescription] = useState<string>(project.description || '');
  const [totalBudget, setTotalBudget] = useState<string>(
    project.total_budget ? project.total_budget.toLocaleString('tr-TR') : ''
  );
  const [status, setStatus] = useState<'active' | 'planning' | 'completed'>(
    project.status || 'planning'
  );
  const [completionMonths, setCompletionMonths] = useState<number>(
    project.estimated_completion_months || 24
  );
  const [visibility, setVisibility] = useState<VisibilityType>(project.visibility || 'public');
  const [showFinancials, setShowFinancials] = useState<boolean>(
    project.show_financials_to_clients || false
  );
  const [defaultSalePrice, setDefaultSalePrice] = useState<string>(
    project.default_sale_price ? project.default_sale_price.toLocaleString('tr-TR') : ''
  );
  const [salesEnabled, setSalesEnabled] = useState<boolean>(
    project.sales_enabled ?? true
  );
  const [settingsSuccessMessage, setSettingsSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setName(project.name || '');
    setLocation(project.location || '');
    setDescription(project.description || '');
    setTotalBudget(project.total_budget ? project.total_budget.toLocaleString('tr-TR') : '');
    setStatus(project.status || 'planning');
    setCompletionMonths(project.estimated_completion_months || 24);
    setVisibility(project.visibility || 'public');
    setShowFinancials(project.show_financials_to_clients || false);
    setDefaultSalePrice(project.default_sale_price ? project.default_sale_price.toLocaleString('tr-TR') : '');
    setSalesEnabled(project.sales_enabled ?? true);
  }, [project]);

  const parsedBudget = parseFloat(totalBudget.replace(/\./g, '')) || 0;
  const parsedSalePrice = parseFloat(defaultSalePrice.replace(/\./g, '')) || 0;

  const hasSettingsChanged =
    !isGuest &&
    (name.trim() !== (project.name || '') ||
      location.trim() !== (project.location || '') ||
      description.trim() !== (project.description || '') ||
      parsedBudget !== (project.total_budget || 0) ||
      status !== (project.status || 'planning') ||
      completionMonths !== (project.estimated_completion_months || 24) ||
      visibility !== (project.visibility || 'public') ||
      showFinancials !== (project.show_financials_to_clients || false) ||
      parsedSalePrice !== (project.default_sale_price || 0) ||
      salesEnabled !== (project.sales_enabled ?? true));

  const formatNumberWithDots = (val: string): string => {
    const rawDigits = val.replace(/\D/g, '');
    if (!rawDigits) return '';
    return parseInt(rawDigits, 10).toLocaleString('tr-TR');
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const rawAmount = expenseAmount.replace(/\./g, '');
    const amount = parseFloat(rawAmount);
    if (!amount || amount <= 0) return;

    onAddExpense({
      category: expenseCategory,
      amount,
      notes: expenseNotes,
      invoice_url: invoiceUrl,
      date: expenseDate,
    });

    setExpenseAmount('');
    setExpenseNotes('');
    setInvoiceUrl('');
  };

  const handleSaveSettings = () => {
    if (!hasSettingsChanged) return;

    const updatedData: Partial<Project> = {
      name: name.trim() || project.name,
      location: location.trim(),
      description: description.trim(),
      total_budget: parsedBudget,
      status,
      estimated_completion_months: completionMonths,
      visibility,
      show_financials_to_clients: showFinancials,
      default_sale_price: parsedSalePrice,
      sales_enabled: salesEnabled,
    };

    if (onUpdateProjectSettings) {
      onUpdateProjectSettings(updatedData);
    } else {
      onUpdateVisibility(visibility, showFinancials);
    }

    setSettingsSuccessMessage('Proje ayarları başarıyla kaydedildi ve tüm sisteme uygulandı.');
    setTimeout(() => {
      setSettingsSuccessMessage(null);
    }, 4000);
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl mb-8">
      {/* Create Project Modal Trigger */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateProject={onCreateNewProject}
      />

      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" />
            <span>YÜKLENİCİ YÖNETİM PANELİ</span>
          </div>
          <h3 className="text-2xl font-bold text-white">İnşaat Proje & Maliyet Kontrol Merkezi</h3>
        </div>
      </div>

      {/* Tab 1: Expense Logger & Expense History */}
      {activeTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* New Expense Form or ReadOnly Notice */}
          <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
            {isReadOnly ? (
              <div className="space-y-3 py-4 text-center">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/30 flex items-center justify-center mx-auto">
                  <Eye className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-white">Salt Okunur İnceleme Modu</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Bu şantiyenin gider harcamaları şeffaf olarak kamuya açıktır. Yeni gider kaydı ekleme yetkisi yalnızca proje sahibi müteahhittedir.
                </p>
              </div>
            ) : (
              <>
                <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-amber-500" />
                  Yeni Gider / Fatura Kaydı Gir
                </h4>

                <form onSubmit={handleCreateExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Gider Kategorisi</label>
                <CustomCategorySelect
                  value={expenseCategory}
                  onChange={(val) => setExpenseCategory(val)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Tutar (₺)</label>
                <input
                  type="text"
                  placeholder="Örn: 250.000"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(formatNumberWithDots(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Fatura / Belge URL</label>
                <input
                  type="url"
                  placeholder="https://example.com/fatura-001.pdf"
                  value={invoiceUrl}
                  onChange={(e) => setInvoiceUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Tarih</label>
                <CustomDatePicker
                  value={expenseDate}
                  onChange={(val) => setExpenseDate(val)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Açıklama / Notlar</label>
                <textarea
                  rows={2}
                  placeholder="Örn: C35 Hazır beton alımı irsaliye no #940"
                  value={expenseNotes}
                  onChange={(e) => setExpenseNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-bold py-2.5 rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 text-sm"
              >
                <PlusCircle className="w-4 h-4" />
                Gider Kaydını Sisteme İşle
              </button>
            </form>
          </>
        )}
      </div>

          {/* Expense History Table */}
          <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-sm shadow-amber-400/50" />
                <h4 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Proje Gider Kayıtları</span>
                  <span className="bg-slate-900 text-amber-400 text-xs px-2.5 py-0.5 rounded-full border border-amber-500/20 font-bold">
                    {project.expenses?.length || 0} Kayıt
                  </span>
                </h4>
              </div>

              {/* Premium Toplam Harcama Metric Card */}
              <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-500/5 border border-amber-500/30 px-4 py-2 rounded-2xl shadow-lg backdrop-blur-md">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 flex items-center justify-center font-extrabold shadow-md shadow-amber-500/30 shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-black tracking-wider text-amber-400/90">Toplam Harcama</span>
                  <span className="text-base font-black text-white tracking-tight leading-tight">
                    {project.total_actual_cost.toLocaleString('tr-TR')} <span className="text-amber-400 font-bold text-xs">₺</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="pb-2.5 font-bold">Tarih</th>
                    <th className="pb-2.5 font-bold">Kategori</th>
                    <th className="pb-2.5 font-bold">Açıklama</th>
                    <th className="pb-2.5 text-right font-bold">Tutar</th>
                    <th className="pb-2.5 text-center font-bold">Belge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {project.expenses?.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-900/60 transition group">
                      <td className="py-3 text-slate-300 whitespace-nowrap font-medium">{formatDateTr(exp.date)}</td>
                      <td className="py-3">
                        {getCategoryBadge(exp.category)}
                      </td>
                      <td className="py-3 text-slate-300 max-w-[160px] truncate">{exp.notes || '—'}</td>
                      <td className="py-3 text-right font-extrabold text-white text-sm">
                        {exp.amount.toLocaleString('tr-TR')} <span className="text-amber-400 text-xs font-bold">₺</span>
                      </td>
                      <td className="py-3 text-center">
                        {exp.invoice_url ? (
                          <a
                            href={exp.invoice_url}
                            target="_blank"
                            rel="noreferrer"
                            className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 inline-flex items-center justify-center transition"
                            title="Belgeyi Görüntüle"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Project Level Stage Toggles */}
      {activeTab === 'stages' && (
        <div className="space-y-4">
          {!isReadOnly && toastMessage && (
            <div className="p-3 bg-rose-500/20 border border-rose-500/50 rounded-xl flex items-center justify-between text-rose-200 text-xs animate-shake">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{toastMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setToastMessage(null)}
                className="text-rose-400 font-bold hover:text-white ml-2 text-sm"
              >
                ✕
              </button>
            </div>
          )}

          <h4 className="text-sm font-bold text-white mb-2">Proje Temel & Genel İmalat Aşamaları</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.stages?.map((st) => {
              const depStatus = checkProjectStageStatus(project, st.id);
              const isLocked = !st.is_completed && !depStatus.isUnlocked;

              const handleStageToggle = () => {
                if (isReadOnly || isGuest) return;
                if (isLocked) {
                  setToastMessage(depStatus.reason || 'Ön koşul aşaması tamamlanmalıdır.');
                  return;
                }
                setToastMessage(null);
                onToggleStage(st.id, !st.is_completed);
              };

              return (
                <div
                  key={st.id}
                  onClick={handleStageToggle}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                    isLocked
                      ? 'bg-slate-950/60 border-slate-800 text-slate-600 opacity-80 cursor-not-allowed'
                      : st.is_completed
                      ? 'bg-amber-500/10 border-amber-500/50 text-amber-200 cursor-pointer hover:border-amber-500/60'
                      : 'bg-slate-950 border-slate-800 text-slate-400 cursor-pointer hover:border-amber-500/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      disabled={isLocked}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStageToggle();
                      }}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                        isLocked
                          ? 'border-slate-700 bg-slate-900/50 text-slate-600 cursor-not-allowed'
                          : st.is_completed
                          ? 'bg-amber-500 border-amber-400 text-slate-950 cursor-pointer'
                          : 'border-slate-600 bg-slate-900 hover:border-amber-400 cursor-pointer'
                      }`}
                    >
                      {st.is_completed ? (
                        <CheckCircle2 className="w-4 h-4 stroke-[3]" />
                      ) : isLocked ? (
                        <Lock className="w-3.5 h-3.5 text-slate-500" />
                      ) : null}
                    </button>
                    <div>
                      <h5 className="font-bold text-sm text-white flex items-center gap-2">
                        <span>{st.name}</span>
                        {isLocked && (
                          <span className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded font-normal flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" /> Kilitli
                          </span>
                        )}
                      </h5>
                      <p className="text-xs text-slate-400">
                        Ağırlık: %{st.weight_percentage || 0} • Bütçe: {(st.estimated_cost || 0).toLocaleString('tr-TR')} ₺
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full font-bold inline-flex items-center gap-1.5 ${
                      isLocked
                        ? 'bg-slate-900 text-rose-400 border border-rose-500/30'
                        : st.is_completed
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isLocked && <Lock className="w-3 h-3 shrink-0" />}
                    <span>
                      {isLocked
                        ? 'Kilitli (Ön Koşul)'
                        : st.is_completed
                        ? 'Tamamlandı (Canlı)'
                        : 'Gölge (Bekliyor)'}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Project Settings & Configuration Panel */}
      {activeTab === 'settings' && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-3xl mx-auto space-y-8">
          {/* Header Banner */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-white">Proje Ayarları & Yapılandırma</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Projenizin adı, bütçesi, şantiye statüsü, görünürlüğü ve satış tercihlerini düzenleyin.
                </p>
              </div>
            </div>
            {hasSettingsChanged && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Kaydedilmemiş Değişiklik Var
              </span>
            )}
          </div>

          {/* Guest Mode Notice Banner */}
          {isGuest && (
            <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-2xl flex items-center gap-3 text-xs text-cyan-300 shadow-lg animate-fadeIn">
              <Lock className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold block text-white text-sm">Misafir Modu (Salt Okunur)</span>
                <span>Misafir oturumunda proje ayarları ve parametreleri kilitlidir. Ayarları değiştirmek için lütfen kayıtlı yönetici hesabı ile giriş yapın.</span>
              </div>
            </div>
          )}

          {/* Toast Message */}
          {settingsSuccessMessage && (
            <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-emerald-200 text-xs animate-fadeIn shadow-lg shadow-emerald-500/10">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-semibold">{settingsSuccessMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSettingsSuccessMessage(null)}
                className="text-emerald-400 hover:text-white font-bold ml-2 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {/* Section 1: Temel Proje Bilgileri */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-400 uppercase tracking-wider">
              <Building2 className="w-4 h-4" />
              <span>1. Temel Proje Künyesi & Statü</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Proje Adı */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Proje Adı <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    disabled={isGuest}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Örn: Zümrüt Kule Rezidans"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-medium text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-950"
                  />
                </div>
              </div>

              {/* Lokasyon / Adres */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Lokasyon / Şehir
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    disabled={isGuest}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Örn: Ataşehir, İstanbul"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-medium text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-950"
                  />
                </div>
              </div>
            </div>

            {/* Proje Durumu / Statü */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-2">
                Proje İnşaat Statüsü
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'planning', label: 'Planlama Aşamasında', icon: '📝' },
                  { id: 'active', label: 'İnşaat Halinde (Devam Ediyor)', icon: '🏗️' },
                  { id: 'completed', label: 'Tamamlandı & Teslim', icon: '✅' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isGuest}
                    onClick={() => !isGuest && setStatus(item.id as any)}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition ${
                      isGuest
                        ? 'opacity-60 cursor-not-allowed border-slate-800'
                        : 'cursor-pointer'
                    } ${
                      status === item.id
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span className="text-center">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tahmini Süre & Açıklama */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Tahmini Süre (Ay)
                </label>
                <CustomDurationSelect
                  value={completionMonths}
                  disabled={isGuest}
                  onChange={(val) => !isGuest && setCompletionMonths(val)}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Proje Açıklaması & Notlar
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <textarea
                    rows={2}
                    disabled={isGuest}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Proje hakkında kısa açıklama veya inşaat detayları..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-medium text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition resize-none disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-950"
                  />
                </div>
              </div>
            </div>
          </div>

          <hr className="border-slate-800/80" />

          {/* Section 2: Finans & Bütçe Yönetimi */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-400 uppercase tracking-wider">
              <Wallet className="w-4 h-4" />
              <span>2. Finans & Bütçe Yönetimi</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Proje Toplam Hedef Bütçesi (₺) <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <span className="text-slate-500 font-bold absolute left-3.5 top-1/2 -translate-y-1/2 text-sm">₺</span>
                <input
                  type="text"
                  disabled={isGuest}
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(formatNumberWithDots(e.target.value))}
                  placeholder="50.000.000"
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-bold text-amber-300 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-950"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                💡 Bütçeyi güncellediğinizde harcama sapması ve % finansal ilerleme oranları tüm platformda anında yeniden hesaplanır.
              </p>
            </div>
          </div>

          <hr className="border-slate-800/80" />

          {/* Section 3: Görünürlük & Erişim Statüsü */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-400 uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              <span>3. Görünürlük & Erişim Yetkileri</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { type: 'private', label: 'Özel (Private)', desc: 'Yalnızca siz görürsünüz', icon: Lock },
                { type: 'protected', label: 'Davetli (Protected)', desc: 'Davetli müşteriler erişir', icon: Eye },
                { type: 'public', label: 'Herkese Açık (Public)', desc: 'Tüm platforma açık', icon: Globe },
              ].map(({ type, label, desc, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  disabled={isGuest}
                  onClick={() => !isGuest && setVisibility(type as VisibilityType)}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center text-center gap-2 text-xs font-bold transition-all ${
                    isGuest
                      ? 'opacity-60 cursor-not-allowed border-slate-800'
                      : 'cursor-pointer'
                  } ${
                    visibility === type
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md ring-1 ring-amber-400/30'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5 text-amber-400" />
                  <div>
                    <div className="font-extrabold text-white text-xs">{label}</div>
                    <div className="text-[10px] text-slate-500 font-normal mt-0.5">{desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-slate-800/80" />

          {/* Section 4: Satış & Daire Fiyatlandırma Ayarları */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-amber-400 uppercase tracking-wider">
              <ShoppingBag className="w-4 h-4" />
              <span>4. Satış & Dağıtım Yapılandırması</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Sales Enabled Toggle */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                    <span>Satış Modülünü Etkinleştir</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Proje içerisindeki Satış sekmesini aktifleştirir.
                  </p>
                </div>

                <label className={`relative inline-flex items-center ${isGuest ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
                  <input
                    type="checkbox"
                    disabled={isGuest}
                    checked={salesEnabled}
                    onChange={(e) => setSalesEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
                </label>
              </div>

              {/* Default Sale Price */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Varsayılan Daire Satış Fiyatı (₺)
                </label>
                <div className="relative">
                  <span className="text-slate-500 font-bold absolute left-3.5 top-1/2 -translate-y-1/2 text-sm">₺</span>
                  <input
                    type="text"
                    disabled={isGuest}
                    value={defaultSalePrice}
                    onChange={(e) => setDefaultSalePrice(formatNumberWithDots(e.target.value))}
                    placeholder="3.500.000"
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm font-medium text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/50 transition disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-950"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 5: Save Settings Button */}
          <div className="pt-2">
            <button
              type="button"
              disabled={isGuest || !hasSettingsChanged}
              onClick={handleSaveSettings}
              className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm transition-all flex items-center justify-center gap-2.5 ${
                isGuest
                  ? 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  : hasSettingsChanged
                    ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 shadow-xl shadow-amber-500/20 cursor-pointer ring-2 ring-amber-400/50 scale-[1.01]'
                    : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <Save className={`w-5 h-5 ${!isGuest && hasSettingsChanged ? 'text-slate-950 animate-bounce' : 'text-slate-500'}`} />
              <span>
                {isGuest
                  ? 'Misafir Modu: Ayarlar Kilitlidir'
                  : hasSettingsChanged
                    ? 'Proje Ayarlarını Kaydet ve Tüm Sisteme Uygula'
                    : 'Değişiklik Yok (Tüm Ayarlar Güncel)'}
              </span>
            </button>
          </div>

          {/* Section 6: Danger Zone: Delete Project */}
          <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-5 space-y-3 mt-8">
            <div className="flex items-center gap-2.5 text-red-400 font-extrabold text-sm">
              <Trash2 className="w-5 h-5 text-red-500" />
              <span>Tehlikeli Bölge: Projeyi Sil</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bu projeyi platformdan tamamen kaldırır. Projeye ait tüm katlar, daireler, imalat aşamaları ve harcama kayıtları kalıcı olarak silinir.
            </p>
            <button
              type="button"
              disabled={isGuest}
              onClick={() => {
                if (isGuest || isReadOnly) {
                  showReadOnlyWarning('Proje silme');
                  return;
                }
                setIsDeleteModalOpen(true);
              }}
              className={`font-bold px-4 py-2.5 rounded-xl transition text-xs flex items-center gap-2 ${
                isGuest
                  ? 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                  : 'bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 cursor-pointer'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              Projeyi Kalıcı Olarak Sil
            </button>
          </div>

          {/* Delete Project Confirmation Modal */}
          <DeleteProjectModal
            isOpen={isDeleteModalOpen}
            projectName={project.name}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirmDelete={() => onDeleteProject?.(project.id)}
          />
        </div>
      )}
    </div>
  );
};
