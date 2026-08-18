import React from 'react';
import type { Project, ExpenseCategory } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { BarChart3, PieChart as PieChartIcon, Lock } from 'lucide-react';

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
  labor: '#3b82f6',    // Blue
  official: '#10b981', // Emerald
  subcontractor: '#8b5cf6', // Purple
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

  // Prepare Bar Chart Data
  const barData = [
    {
      name: 'Bütçe & Harcama',
      'Hedef Bütçe': project.total_budget,
      'Fiili Harcama': project.total_actual_cost,
    },
  ];

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

  const pieData = Object.entries(categoryTotals)
    .filter(([_, val]) => val > 0)
    .map(([cat, value]) => ({
      name: CATEGORY_NAMES[cat as ExpenseCategory] || cat,
      value,
      color: CATEGORY_COLORS[cat as ExpenseCategory] || '#64748b',
    }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
      {/* 1. Bar Chart: Planned vs Actual */}
      <div className="lg:col-span-7 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-500" />
            Planlanan vs. Gerçekleşen Maliyet (₺)
          </h3>
          <span className="text-xs text-slate-400">Karşılaştırmalı Bütçe Analizi</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M ₺`} />
              <Tooltip
                formatter={(value: any) => [
                  value ? `${Number(value).toLocaleString('tr-TR')} ₺` : '0 ₺',
                  '',
                ]}
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  color: '#fff',
                }}
              />
              <Legend />
              <Bar dataKey="Hedef Bütçe" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Fiili Harcama" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 2. Pie Chart: Expenses by Category */}
      <div className="lg:col-span-5 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <PieChartIcon className="w-5 h-5 text-amber-500" />
            Kategori Bazlı Gider Dağılımı
          </h3>
          <span className="text-xs text-slate-400">Gider Oranları</span>
        </div>

        <div className="h-72 w-full flex items-center justify-center">
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [
                    value ? `${Number(value).toLocaleString('tr-TR')} ₺` : '0 ₺',
                    '',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    color: '#fff',
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-xs text-slate-400 italic">Henüz gider kaydı bulunmuyor.</div>
          )}
        </div>
      </div>
    </div>
  );
};
