import React from 'react';
import type { Project, ExpenseCategory } from '../types';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  PieChart as PieChartIcon,
  Lock,
  Wallet,
  Target,
  ShieldCheck,
  TrendingUp,
  Package,
  HardHat,
  FileCheck2,
  Wrench,
} from 'lucide-react';

interface BudgetChartsProps {
  project: Project;
  isClientHidden: boolean;
}

const CATEGORY_NAMES: Record<ExpenseCategory, string> = {
  material: 'Malzeme & Beton',
  labor: 'İşçilik & Kalıp',
  official: 'Resmi Harç & Ruhsat',
  subcontractor: 'Taşeron & Tesisat',
};

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  material: '#f59e0b', // Amber
  labor: '#3b82f6', // Blue
  official: '#10b981', // Emerald
  subcontractor: '#a855f7', // Purple
};

const CATEGORY_ICONS: Record<ExpenseCategory, React.ComponentType<{ className?: string }>> = {
  material: Package,
  labor: HardHat,
  official: FileCheck2,
  subcontractor: Wrench,
};

export const BudgetCharts: React.FC<BudgetChartsProps> = ({ project, isClientHidden }) => {
  if (isClientHidden) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 mb-8 text-center flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
        <div className="w-16 h-16 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-amber-400 mb-4 shadow-xl">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">Finansal Grafikler Kısıtlanmıştır</h3>
        <p className="text-sm text-slate-400 max-w-md">
          Müteahhit firma bu projenin finansal bütçe ve gider grafiklerini müşterilere kapalı olarak ayarlamıştır.
        </p>
      </div>
    );
  }

  const totalBudget = project.total_budget || 0;
  const actualCost = project.total_actual_cost || 0;
  const remainingBudget = Math.max(0, totalBudget - actualCost);
  const spentPercentage = totalBudget > 0 ? Math.min(100, (actualCost / totalBudget) * 100) : 0;

  // Prepare Category Pie Chart Data
  const categoryTotals: Record<string, number> = {
    material: 0,
    labor: 0,
    official: 0,
    subcontractor: 0,
  };

  project.expenses?.forEach((exp) => {
    if (categoryTotals[exp.category] !== undefined) {
      categoryTotals[exp.category] += exp.amount;
    }
  });

  const totalExpenseSum = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  const pieData = Object.entries(categoryTotals)
    .filter(([_, val]) => val > 0)
    .map(([cat, value]) => ({
      categoryKey: cat as ExpenseCategory,
      name: CATEGORY_NAMES[cat as ExpenseCategory] || cat,
      value,
      percent: totalExpenseSum > 0 ? (value / totalExpenseSum) * 100 : 0,
      color: CATEGORY_COLORS[cat as ExpenseCategory] || '#64748b',
    }));

  // Custom Tooltip for Pie Chart
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/98 border border-slate-700/90 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl animate-fadeIn space-y-1.5 text-xs z-50">
          <div className="flex items-center gap-2 font-bold text-white">
            <div className="w-3 h-3 rounded-md" style={{ backgroundColor: data.color }} />
            <span>{data.name}</span>
          </div>
          <div className="text-amber-400 font-black text-sm">
            {Number(data.value).toLocaleString('tr-TR')} ₺
          </div>
          <div className="text-[11px] text-slate-400 font-semibold bg-slate-800 px-2 py-0.5 rounded-md inline-block">
            Toplam harcamanın %{data.percent.toFixed(1)}'i
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Upper Budget Progress Status Bar */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" />
              <span>Genel Proje Bütçe Kullanım Oranı</span>
            </div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              Bütçe Gerçekleşme Durumu: %{spentPercentage.toFixed(1)}
            </h3>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="bg-slate-950/80 border border-slate-800 px-3.5 py-2 rounded-2xl flex items-center gap-2.5">
              <Target className="w-4 h-4 text-blue-400" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Hedef Bütçe</div>
                <div className="text-xs font-black text-white">{totalBudget.toLocaleString('tr-TR')} ₺</div>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 px-3.5 py-2 rounded-2xl flex items-center gap-2.5">
              <Wallet className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-[10px] text-amber-400/90 uppercase font-bold">Fiili Harcanan</div>
                <div className="text-xs font-black text-amber-300">{actualCost.toLocaleString('tr-TR')} ₺</div>
              </div>
            </div>

            <div className="bg-emerald-500/10 border border-emerald-500/30 px-3.5 py-2 rounded-2xl flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-[10px] text-emerald-400/90 uppercase font-bold">Kalan Bütçe</div>
                <div className="text-xs font-black text-emerald-300">{remainingBudget.toLocaleString('tr-TR')} ₺</div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar Visual */}
        <div className="w-full bg-slate-950 rounded-full h-3.5 p-0.5 border border-slate-800 relative overflow-hidden">
          <div
            className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 h-full rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
            style={{ width: `${Math.max(1.5, spentPercentage)}%` }}
          />
        </div>
      </div>

      {/* Pie / Donut Chart: Expenses by Category */}
      <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Gider Kategorileri Dağılımı</h3>
              <p className="text-xs text-slate-400">Kategori Bazlı Harcama Analizi</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* Donut Chart */}
          <div className="md:col-span-5 h-64 w-full relative flex items-center justify-center">
            {pieData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={68}
                      outerRadius={98}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="#020617"
                          strokeWidth={3}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Donut Center Overlay */}
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Toplam Gider</span>
                  <span className="text-base font-black text-amber-400">
                    {actualCost >= 1000000
                      ? `${(actualCost / 1000000).toFixed(2)}M ₺`
                      : `${actualCost.toLocaleString('tr-TR')} ₺`}
                  </span>
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-400 italic flex flex-col items-center gap-2">
                <Wallet className="w-8 h-8 text-slate-600" />
                <span>Henüz kaydedilmiş harcama bulunmuyor.</span>
              </div>
            )}
          </div>

          {/* Category Breakdown Cards */}
          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {pieData.length > 0 ? (
              pieData.map((item) => {
                const Icon = CATEGORY_ICONS[item.categoryKey] || Package;
                return (
                  <div
                    key={item.categoryKey}
                    className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 text-xs flex flex-col justify-between space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div
                          className="w-3 h-3 rounded-md shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <Icon className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="text-slate-200 font-bold truncate">{item.name}</span>
                      </div>
                      <span className="font-black text-amber-400 text-xs shrink-0 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                        %{item.percent.toFixed(1)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400 font-medium">
                      <span>Tutar:</span>
                      <span className="font-extrabold text-white">
                        {item.value.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>

                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.percent}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 text-xs text-slate-400 italic">Henüz kategori verisi yok.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
