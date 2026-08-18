import React, { useState } from 'react';
import type { VisibilityType } from '../types';
import { Building2, X, PlusCircle, DollarSign, Layers, Home, Shield, Lock, Eye, Globe } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateProject: (projectData: {
    name: string;
    location: string;
    total_budget: number;
    floor_count: number;
    units_per_floor: number;
    visibility: VisibilityType;
    show_financials_to_clients: boolean;
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
  const [floorCount, setFloorCount] = useState(4);
  const [unitsPerFloor, setUnitsPerFloor] = useState(2);
  const [visibility, setVisibility] = useState<VisibilityType>('public');
  const [showFinancials, setShowFinancials] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const budget = parseFloat(totalBudget);
    if (!name || !budget || budget <= 0) return;

    onCreateProject({
      name,
      location,
      total_budget: budget,
      floor_count: floorCount,
      units_per_floor: unitsPerFloor,
      visibility,
      show_financials_to_clients: showFinancials,
    });

    setName('');
    setLocation('');
    setTotalBudget('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Yeni İnşaat Projesi Oluştur</h3>
              <p className="text-xs text-slate-400">Gölgeden Yapıya mimari modelinizi tanımlayın</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Proje Adı</label>
            <input
              type="text"
              placeholder="Örn: Safir Kule Rezidans"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Lokasyon / Şehir</label>
            <input
              type="text"
              placeholder="Örn: Kadıköy / İstanbul"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Toplam Hedef Bütçe (₺)</label>
            <div className="relative">
              <input
                type="number"
                placeholder="Örn: 20000000"
                value={totalBudget}
                onChange={(e) => setTotalBudget(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                required
              />
              <DollarSign className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            </div>
          </div>

          {/* Building Structural Specs */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-amber-400" /> Kat Sayısı
              </label>
              <select
                value={floorCount}
                onChange={(e) => setFloorCount(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {[3, 4, 5, 6, 8, 10].map((num) => (
                  <option key={num} value={num}>
                    {num} Katlı Bina Model
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Home className="w-3.5 h-3.5 text-amber-400" /> Katta Daire Sayısı
              </label>
              <select
                value={unitsPerFloor}
                onChange={(e) => setUnitsPerFloor(parseInt(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
              >
                {[1, 2, 3, 4].map((num) => (
                  <option key={num} value={num}>
                    Kat Başı {num} Daire
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Privacy & Financial Switch */}
          <div className="pt-2">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Proje Görünürlüğü & Müşteri Finansal Gizliliği
            </label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { type: 'private', label: 'Özel', icon: Lock },
                { type: 'protected', label: 'Davetli', icon: Eye },
                { type: 'public', label: 'Açık', icon: Globe },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setVisibility(type as VisibilityType)}
                  className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition ${
                    visibility === type
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
              <span className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                <Shield className="w-4 h-4 text-amber-400" />
                Müşterilere Finansal Verileri Göster
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFinancials}
                  onChange={(e) => setShowFinancials(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500" />
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-yellow-500 text-slate-950 font-bold py-3 rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 text-sm mt-4"
          >
            <PlusCircle className="w-4 h-4" />
            Binayı Gölge İskelet Olarak Oluştur
          </button>
        </form>
      </div>
    </div>
  );
};
