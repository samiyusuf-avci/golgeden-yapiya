import React, { useState } from 'react';
import type { Project, ExpenseCategory, VisibilityType, Expense } from '../types';
import {
  PlusCircle,
  Settings,
  Receipt,
  CheckSquare,
  Shield,
  Eye,
  Lock,
  Globe,
  FileText,
  Save,
  CheckCircle2,
  FolderPlus,
  UserCheck,
} from 'lucide-react';
import { CreateProjectModal } from './CreateProjectModal';

interface ContractorDashboardProps {
  project: Project;
  onUpdateVisibility: (visibility: VisibilityType, showFinancials: boolean) => void;
  onAddExpense: (expense: Partial<Expense>) => void;
  onToggleStage: (stageId: string, isCompleted: boolean) => void;
  onCreateNewProject: (projectData: any) => void;
}

export const ContractorDashboard: React.FC<ContractorDashboardProps> = ({
  project,
  onUpdateVisibility,
  onAddExpense,
  onToggleStage,
  onCreateNewProject,
}) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'settings' | 'stages'>('expenses');
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(expenseAmount);
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
    onUpdateVisibility(visibility, showFinancials);
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl mb-8">
      {/* Create Project Modal Trigger */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreateProject={onCreateNewProject}
      />

      {/* Dashboard Top Header & Create Project Action */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
            <UserCheck className="w-4 h-4" />
            <span>Müteahhit / Admin Yönetici Ekranı</span>
          </div>
          <h3 className="text-2xl font-bold text-white">İnşaat Proje & Maliyet Kontrol Merkezi</h3>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs transition shadow-lg shadow-amber-500/25 flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Yeni Proje Oluştur</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-6 w-fit">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'expenses'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Gider / Fatura Ekle</span>
        </button>

        <button
          onClick={() => setActiveTab('stages')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'stages'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Aşama Tamamlama</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Proje & Gizlilik Ayarları</span>
        </button>
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
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value as ExpenseCategory)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="material">Malzeme & Beton Alımı</option>
                  <option value="labor">İşçilik & Kalıp Ödemesi</option>
                  <option value="official">Resmi Harç & Yapı Denetim</option>
                  <option value="subcontractor">Taşeron & Tesisat</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Tutar (₺)</label>
                <input
                  type="number"
                  placeholder="Örn: 250000"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
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
                <input
                  type="date"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
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
            <h4 className="text-sm font-bold text-white mb-4 flex items-center justify-between">
              <span>Proje Gider Kayıtları ({project.expenses?.length || 0})</span>
              <span className="text-xs text-amber-400 font-semibold">
                Toplam Harcama: {project.total_actual_cost.toLocaleString('tr-TR')} ₺
              </span>
            </h4>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="pb-2">Tarih</th>
                    <th className="pb-2">Kategori</th>
                    <th className="pb-2">Açıklama</th>
                    <th className="pb-2 text-right">Tutar</th>
                    <th className="pb-2 text-center">Belge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {project.expenses?.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-900/60 transition">
                      <td className="py-3 text-slate-300 whitespace-nowrap">{exp.date}</td>
                      <td className="py-3">
                        <span className="bg-slate-800 text-amber-300 font-semibold px-2 py-0.5 rounded text-[11px] border border-slate-700">
                          {exp.category}
                        </span>
                      </td>
                      <td className="py-3 text-slate-300 max-w-[160px] truncate">{exp.notes || '—'}</td>
                      <td className="py-3 text-right font-bold text-white">
                        {exp.amount.toLocaleString('tr-TR')} ₺
                      </td>
                      <td className="py-3 text-center">
                        {exp.invoice_url ? (
                          <a
                            href={exp.invoice_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-amber-400 hover:text-amber-300 inline-flex items-center gap-1"
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
          <h4 className="text-sm font-bold text-white mb-2">Proje Temel & Genel İmalat Aşamaları</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {project.stages?.map((st) => (
              <div
                key={st.id}
                className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                  st.is_completed
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-200'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onToggleStage(st.id, !st.is_completed)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                      st.is_completed
                        ? 'bg-amber-500 border-amber-400 text-slate-950'
                        : 'border-slate-600 bg-slate-900 hover:border-amber-400'
                    }`}
                  >
                    {st.is_completed && <CheckCircle2 className="w-4 h-4 stroke-[3]" />}
                  </button>
                  <div>
                    <h5 className="font-bold text-sm text-white">{st.name}</h5>
                    <p className="text-xs text-slate-400">
                      Ağırlık: %{st.weight_percentage} • Bütçe: {st.estimated_cost.toLocaleString('tr-TR')} ₺
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold ${
                    st.is_completed
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {st.is_completed ? 'Tamamlandı (Canlı)' : 'Gölge (Bekliyor)'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Project Privacy Settings */}
      {activeTab === 'settings' && (
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-6 max-w-2xl mx-auto space-y-6">
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
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-xs font-bold transition-all ${
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
            onClick={handleSaveSettings}
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-bold py-3 rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 text-sm"
          >
            <Save className="w-4 h-4" />
            Gizlilik Ayarlarını Kaydet ve Uygula
          </button>
        </div>
      )}
    </div>
  );
};
