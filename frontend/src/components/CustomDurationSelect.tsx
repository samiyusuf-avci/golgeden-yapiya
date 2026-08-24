import React, { useState, useRef, useEffect } from 'react';
import { Timer, ChevronDown, Check } from 'lucide-react';

interface CustomDurationSelectProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const DURATION_OPTIONS = [
  { months: 6, label: '6 Ay', sub: '0.5 Yıl (Kısa Süreli Proje)' },
  { months: 9, label: '9 Ay', sub: '0.75 Yıl (Hızlı Tamamlanma)' },
  { months: 12, label: '12 Ay', sub: '1 Yıl (Standart Yapı)' },
  { months: 18, label: '18 Ay', sub: '1.5 Yıl (Orta Ölçekli)' },
  { months: 24, label: '24 Ay', sub: '2 Yıl (Rezidans & Blok)' },
  { months: 30, label: '30 Ay', sub: '2.5 Yıl (Geniş Etaplı)' },
  { months: 36, label: '36 Ay', sub: '3 Yıl (Büyük Karma Proje)' },
  { months: 48, label: '48 Ay', sub: '4 Yıl (Toplu Konut Siteleri)' },
  { months: 60, label: '60 Ay', sub: '5 Yıl (Master Plan Şehir Projesi)' },
];

export const CustomDurationSelect: React.FC<CustomDurationSelectProps> = ({ value, onChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption =
    DURATION_OPTIONS.find((o) => o.months === value) ||
    DURATION_OPTIONS.find((o) => o.months === 24) ||
    DURATION_OPTIONS[0];

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
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-slate-900 border rounded-xl px-3.5 py-2.5 text-sm text-white flex items-center justify-between transition shadow-inner ${
          disabled
            ? 'opacity-60 cursor-not-allowed border-slate-800'
            : isOpen
              ? 'border-amber-500 ring-2 ring-amber-500/25 bg-slate-900/90 cursor-pointer'
              : 'border-slate-800 hover:border-amber-500/50 cursor-pointer'
        }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Timer className="w-3.5 h-3.5" />
          </div>
          <div className="text-left truncate">
            <span className="font-bold text-amber-300 text-xs sm:text-sm">{selectedOption.label}</span>
            <span className="text-[11px] text-slate-400 font-normal ml-2">({selectedOption.months / 12} Yıl)</span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-1 ${
            isOpen ? 'rotate-180 text-amber-400' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/98 border border-slate-700/90 rounded-2xl p-1.5 shadow-2xl z-50 max-h-64 overflow-y-auto space-y-1 backdrop-blur-2xl animate-fadeIn custom-scrollbar">
          {DURATION_OPTIONS.map((opt) => {
            const isSelected = opt.months === value;

            return (
              <button
                key={opt.months}
                type="button"
                onClick={() => {
                  onChange(opt.months);
                  setIsOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-xl text-left transition flex items-center justify-between cursor-pointer group ${
                  isSelected
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold'
                    : 'text-slate-200 hover:bg-slate-800/90 hover:text-amber-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition text-xs font-extrabold ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                        : 'bg-slate-800 text-slate-400 group-hover:text-amber-400 group-hover:bg-slate-700'
                    }`}
                  >
                    {opt.months}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{opt.label}</span>
                      <span className="text-[10px] text-amber-400/90 font-medium">({opt.months / 12} Yıl)</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal">{opt.sub}</div>
                  </div>
                </div>
                {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
