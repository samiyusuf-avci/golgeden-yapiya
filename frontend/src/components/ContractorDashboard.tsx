import React, { useState, useEffect } from 'react';
import type { Project, ExpenseCategory, VisibilityType, Expense } from '../types';
import {
  PlusCircle,
  Receipt,
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
} from 'lucide-react';
import { CreateProjectModal } from './CreateProjectModal';
import { CustomCategorySelect } from './CustomCategorySelect';
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
  onAddExpense: (expense: Partial<Expense>) => void;
  onToggleStage: (stageId: string, isCompleted: boolean) => void;
  onCreateNewProject: (projectData: any) => void;
  onDeleteProject?: (projectId: string) => void;
  initialTab?: 'expenses' | 'settings' | 'stages';
}

export const ContractorDashboard: React.FC<ContractorDashboardProps> = ({
  project,
  onUpdateVisibility,
  onAddExpense,
  onToggleStage,
  onCreateNewProject,
  onDeleteProject,
  initialTab = 'expenses',
}) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'settings' | 'stages'>(initialTab);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
  const [visibility, setVisibility] = useState<VisibilityType>(project.visibility || 'public');
  const [showFinancials, setShowFinancials] = useState<boolean>(
    project.show_financials_to_clients || false
  );
  const [settingsSuccessMessage, setSettingsSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setVisibility(project.visibility || 'public');
    setShowFinancials(project.show_financials_to_clients || false);
  }, [project.id, project.visibility, project.show_financials_to_clients]);

  const initialVisibility = project.visibility || 'public';
  const initialShowFinancials = project.show_financials_to_clients || false;
  const hasSettingsChanged =
    visibility !== initialVisibility || showFinancials !== initialShowFinancials;

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
    onUpdateVisibility(visibility, showFinancials);
    setSettingsSuccessMessage('Gizlilik ve görünürlük ayarları başarıyla kaydedildi ve uygulandı.');
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
            <span>Şantiye Yönetim & Maliyet Kontrol Merkezi</span>
          </div>
          <h3 className="text-2xl font-bold text-white">İnşaat Proje & Maliyet Kontrol Merkezi</h3>
        </div>
      </div>

      {/* Tab 1: Expense Logger & Expense History */}
      {activeTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* New Expense Form */}
          <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
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
          {toastMessage && (
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

      {/* Tab 3: Project Privacy Settings */}
      {activeTab === 'settings' && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 max-w-2xl mx-auto space-y-6">
          {settingsSuccessMessage && (
            <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl flex items-center justify-between text-emerald-200 text-xs animate-fadeIn shadow-lg shadow-emerald-500/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{settingsSuccessMessage}</span>
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

          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <Shield className="w-6 h-6 text-amber-500" />
            <div>
              <h4 className="text-base font-bold text-white">Görünürlük & Finansal Gizlilik Ayarları</h4>
              <p className="text-xs text-slate-400">
                Müşteri portalında görünmesini istediğiniz yetki ve bütçe sınırlarını yönetin.
              </p>
            </div>
          </div>

          {/* Visibility Mode Radio Group */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Proje Görünürlük Statüsü
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: 'private', label: 'Özel (Private)', icon: Lock },
                { type: 'protected', label: 'Davetli (Protected)', icon: Eye },
                { type: 'public', label: 'Herkese Açık (Public)', icon: Globe },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVisibility(type as VisibilityType)}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                    visibility === type
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Client Financial Privacy Switch */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                <span>Müşterilere Finansal Verileri Göster</span>
              </div>
              <p className="text-xs text-slate-400 max-w-sm">
                Kapalı olduğunda `client` rolündeki kullanıcıların ekranında Bütçe, Harcama ve Gider grafikleri otomatik maskelenir.
              </p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showFinancials}
                onChange={(e) => setShowFinancials(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500" />
            </label>
          </div>

          <button
            type="button"
            disabled={!hasSettingsChanged}
            onClick={handleSaveSettings}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              hasSettingsChanged
                ? 'bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/25 cursor-pointer ring-2 ring-amber-400/50 font-extrabold'
                : 'bg-slate-800/60 border border-slate-700/80 text-slate-500 cursor-not-allowed opacity-60'
            }`}
          >
            <Save className={`w-4 h-4 ${hasSettingsChanged ? 'text-slate-950' : 'text-slate-500'}`} />
            <span>
              {hasSettingsChanged
                ? 'Gizlilik Ayarlarını Kaydet ve Uygula'
                : 'Değişiklik Yok (Ayarlar Güncel)'}
            </span>
          </button>

          {/* Danger Zone: Delete Project */}
          <div className="bg-red-950/30 border border-red-500/30 rounded-2xl p-5 space-y-3 mt-8">
            <div className="flex items-center gap-2.5 text-red-400 font-extrabold text-sm">
              <Trash2 className="w-5 h-5 text-red-500" />
              <span>Tehlikeli Bölge: Projeyi Sil</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bu projeyi sistemden tamamen kaldırır. Projeye ait tüm katlar, daireler, imalat aşamaları ve harcama kayıtları kalıcı olarak silinir.
            </p>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 font-bold px-4 py-2.5 rounded-xl transition text-xs flex items-center gap-2 cursor-pointer"
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
