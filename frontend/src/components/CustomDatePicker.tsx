import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
}

const MONTH_NAMES_TR = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

const WEEKDAYS_TR = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse input date (YYYY-MM-DD) safely
  const parseDateStr = (dateStr: string) => {
    if (!dateStr) return new Date();
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    return new Date();
  };

  const selectedDate = parseDateStr(value);
  const [viewDate, setViewDate] = useState<Date>(selectedDate);

  useEffect(() => {
    setViewDate(parseDateStr(value));
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  // Format date to YYYY-MM-DD
  const formatDateToISO = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  // Format for Turkish display button (e.g., 19.08.2026 or 19 Ağustos 2026)
  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Tarih Seçin';
    const d = parseDateStr(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Today check
  const today = new Date();
  const isToday = (y: number, m: number, d: number) => {
    return (
      today.getFullYear() === y &&
      today.getMonth() === m &&
      today.getDate() === d
    );
  };

  // Selected check
  const isSelected = (y: number, m: number, d: number) => {
    return (
      selectedDate.getFullYear() === y &&
      selectedDate.getMonth() === m &&
      selectedDate.getDate() === d
    );
  };

  // Calculate calendar days
  const firstDayOfWeek = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7; // Mon=0
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const prevMonthDays = Array.from({ length: firstDayOfWeek }, (_, i) => {
    return daysInPrevMonth - firstDayOfWeek + i + 1;
  });

  const currentMonthDays = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);

  const totalGridCells = Math.ceil((prevMonthDays.length + currentMonthDays.length) / 7) * 7;
  const nextMonthDaysCount = totalGridCells - (prevMonthDays.length + currentMonthDays.length);
  const nextMonthDays = Array.from({ length: nextMonthDaysCount }, (_, i) => i + 1);

  const handleSelectDay = (day: number) => {
    const isoDate = formatDateToISO(viewYear, viewMonth, day);
    onChange(isoDate);
    setIsOpen(false);
  };

  const handleSetToday = () => {
    const now = new Date();
    const iso = formatDateToISO(now.getFullYear(), now.getMonth(), now.getDate());
    onChange(iso);
    setViewDate(now);
    setIsOpen(false);
  };

  const handleSetYesterday = () => {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    const iso = formatDateToISO(yest.getFullYear(), yest.getMonth(), yest.getDate());
    onChange(iso);
    setViewDate(yest);
    setIsOpen(false);
  };

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
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <CalendarIcon className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-100 text-xs sm:text-sm">
            {formatDisplayDate(value)}
          </span>
        </div>
        <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg">
          Değiştir
        </span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-slate-900/98 border border-slate-700/90 rounded-2xl p-4 shadow-2xl z-50 backdrop-blur-xl animate-fadeIn w-72 sm:w-80">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 flex items-center justify-center transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="font-extrabold text-white text-sm tracking-wide">
              {MONTH_NAMES_TR[viewMonth]} {viewYear}
            </div>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 flex items-center justify-center transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday names */}
          <div className="grid grid-cols-7 text-center mb-1.5">
            {WEEKDAYS_TR.map((wd) => (
              <span key={wd} className="text-[11px] font-bold text-amber-400/80 uppercase">
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Prev month days */}
            {prevMonthDays.map((d) => (
              <div
                key={`prev-${d}`}
                className="h-8 flex items-center justify-center text-xs text-slate-700 select-none cursor-default font-medium"
              >
                {d}
              </div>
            ))}

            {/* Current month days */}
            {currentMonthDays.map((d) => {
              const selected = isSelected(viewYear, viewMonth, d);
              const tod = isToday(viewYear, viewMonth, d);

              return (
                <button
                  key={`curr-${d}`}
                  type="button"
                  onClick={() => handleSelectDay(d)}
                  className={`h-8 rounded-xl text-xs font-bold flex items-center justify-center transition cursor-pointer relative ${
                    selected
                      ? 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 font-black shadow-md shadow-amber-500/30 scale-105 z-10'
                      : tod
                      ? 'bg-amber-500/10 border border-amber-500/50 text-amber-300 hover:bg-amber-500/20'
                      : 'text-slate-200 hover:bg-slate-800 hover:text-amber-400'
                  }`}
                >
                  {d}
                  {tod && !selected && (
                    <span className="absolute bottom-1 w-1 h-1 bg-amber-400 rounded-full" />
                  )}
                </button>
              );
            })}

            {/* Next month days */}
            {nextMonthDays.map((d) => (
              <div
                key={`next-${d}`}
                className="h-8 flex items-center justify-center text-xs text-slate-700 select-none cursor-default font-medium"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Quick Preset Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSetToday}
                className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 text-[11px] font-extrabold transition flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3 text-amber-400" /> Bugün
              </button>
              <button
                type="button"
                onClick={handleSetYesterday}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition cursor-pointer"
              >
                Dün
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[11px] font-bold text-slate-400 hover:text-white transition cursor-pointer px-2 py-1"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
