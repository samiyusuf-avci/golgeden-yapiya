import React, { useState, useRef, useEffect } from 'react';
import type { ExpenseCategory } from '../types';
import { ChevronDown, Check, Package, HardHat, FileCheck2, Wrench } from 'lucide-react';

interface CustomCategorySelectProps {
  value: ExpenseCategory;
  onChange: (value: ExpenseCategory) => void;
}

const CATEGORIES: {
  id: ExpenseCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}[] = [
  {
    id: 'material',
    label: 'Malzeme & Beton Alımı',
    icon: Package,
    description: 'Çimento, demir, beton, tuğla vb.',
  },
  {
    id: 'labor',
    label: 'İşçilik & Kalıp Ödemesi',
    icon: HardHat,
    description: 'Usta, kalıpçı, demirci hakedişleri',
  },
  {
    id: 'official',
    label: 'Resmi Harç & Yapı Denetim',
    icon: FileCheck2,
    description: 'Belediye, SGK, denetim ücretleri',
  },
  {
    id: 'subcontractor',
    label: 'Taşeron & Tesisat',
    icon: Wrench,
    description: 'Elektrik, su, mermer, boya işleri',
  },
];

export const CustomCategorySelect: React.FC<CustomCategorySelectProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedCategory = CATEGORIES.find((c) => c.id === value) || CATEGORIES[0];
  const SelectedIcon = selectedCategory.icon;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2 text-sm text-white flex items-center justify-between transition cursor-pointer shadow-inner ${
          isOpen
            ? 'border-amber-500 ring-2 ring-amber-500/20'
            : 'border-slate-700 hover:border-amber-500/50'
        }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <SelectedIcon className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-100 truncate text-xs sm:text-sm">{selectedCategory.label}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/98 border border-slate-700/90 rounded-2xl p-1.5 shadow-2xl z-50 space-y-1 backdrop-blur-xl animate-fadeIn">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = cat.id === value;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onChange(cat.id);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-xl text-left transition flex items-center justify-between cursor-pointer group ${
                  isSelected
                    ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold'
                    : 'text-slate-200 hover:bg-slate-800/80 hover:text-amber-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : 'bg-slate-800 text-slate-400 group-hover:text-amber-400 group-hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">{cat.label}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{cat.description}</div>
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
