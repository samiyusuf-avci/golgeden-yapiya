import React, { useState } from 'react';
import type { VisibilityType } from '../types';
import { Building2, X, PlusCircle, Lock, Eye, Globe, MapPin, ChevronDown, Check, Timer } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectData: {
    name: string;
    location: string;
    total_budget: number;
    visibility: VisibilityType;
    show_financials_to_clients: boolean;
    estimated_completion_months: number;
  }) => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreateProject,
}) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [totalBudget, setTotalBudget] = useState('');
  const [visibility, setVisibility] = useState<VisibilityType>('public');
  const [completionMonths, setCompletionMonths] = useState(24);

  const [isDurationDropdownOpen, setIsDurationDropdownOpen] = useState(false);

  if (!isOpen) return null;

  const formatNumberWithDots = (val: string): string => {
    const rawDigits = val.replace(/\D/g, '');
    if (!rawDigits) return '';
    return parseInt(rawDigits, 10).toLocaleString('tr-TR');
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNumberWithDots(e.target.value);
    setTotalBudget(formatted);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawBudget = totalBudget.replace(/\./g, '');
    const budget = parseFloat(rawBudget);
    if (!name || !budget || budget <= 0) return;

    onCreateProject({
      name,
      location,
      total_budget: budget,
      visibility,
      show_financials_to_clients: false,
      estimated_completion_months: completionMonths,
    });

    setName('');
    setLocation('');
    setTotalBudget('');
    setCompletionMonths(24);
    onClose();
  };


  const durationOptions = [6, 9, 12, 18, 24, 30, 36, 48, 60];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xl animate-fadeIn">
      <div className="bg-slate-900/95 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
        {/* Glow Decorator */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-extrabold text-white tracking-tight">Yeni İnşaat Projesi Oluştur</h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Gölgeden Yapıya dijital mimari modelinizi tanımlayın</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 flex items-center justify-center transition cursor-pointer shadow-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {/* Project Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Proje Adı
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Örn: Zümrüt Kule Rezidans"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
                required
              />
            </div>
          </div>

          {/* Location & Budget Side-by-Side Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Location */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Lokasyon / Şehir
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Örn: Pendik / İstanbul"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
                />
              </div>
            </div>

            {/* Total Target Budget with thousand separator dots */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Toplam Hedef (₺)
              </label>
              <div className="relative">
                <span className="text-amber-400 font-extrabold text-sm absolute left-3.5 top-1/2 -translate-y-1/2">
                  ₺
                </span>
                <input
                  type="text"
                  placeholder="Örn: 20.000.000"
                  value={totalBudget}
                  onChange={handleBudgetChange}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-8 pr-4 py-3 text-sm font-semibold text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
                  required
                />
              </div>
            </div>
          </div>


          {/* Tahmini Bitirme Süresi */}
          <div className="relative">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Timer className="w-4 h-4 text-amber-400" /> Tahmini Bitirme Süresi
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsDurationDropdownOpen(!isDurationDropdownOpen);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-extrabold text-white flex items-center justify-between hover:border-amber-500/50 transition shadow-inner cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Timer className="w-3.5 h-3.5 text-amber-400" />
                  {completionMonths} Ay ({(completionMonths / 12).toFixed(completionMonths % 12 === 0 ? 0 : 1)} Yıl)
                </span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isDurationDropdownOpen ? 'rotate-180 text-amber-400' : ''}`} />
              </button>

              {isDurationDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-slate-950/95 border border-slate-800 rounded-2xl p-1.5 shadow-2xl z-30 space-y-1 backdrop-blur-xl animate-fadeIn max-h-56 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-950/80 [&::-webkit-scrollbar-thumb]:bg-amber-500/40 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-amber-500">
                  {durationOptions.map((months) => (
                    <button
                      key={months}
                      type="button"
                      onClick={() => {
                        setCompletionMonths(months);
                        setIsDurationDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                        completionMonths === months
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                          : 'text-slate-300 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      <span>{months} Ay{months % 12 === 0 ? ` (${months / 12} Yıl)` : ''}</span>
                      {completionMonths === months && <Check className="w-3.5 h-3.5 text-slate-950" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Privacy & Financial Settings */}
          <div className="pt-2 space-y-3">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
              Proje Görünürlüğü
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { type: 'private', label: 'Özel', icon: Lock },
                { type: 'protected', label: 'Davetli', icon: Eye },
                { type: 'public', label: 'Herkese Açık', icon: Globe },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVisibility(type as VisibilityType)}
                  className={`p-2.5 rounded-2xl border flex items-center justify-center gap-1.5 text-xs font-extrabold transition cursor-pointer ${
                    visibility === type
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 text-amber-400" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black py-3.5 rounded-2xl transition shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 text-sm mt-4 cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            <span>Binayı Gölge İskelet Olarak Oluştur</span>
          </button>
        </form>
      </div>
    </div>
  );
};
